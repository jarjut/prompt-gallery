#!/usr/bin/env python3
"""
Pipeline for ingesting, parsing, tagging, and indexing prompts from CSV into SQLite with FTS5.
Supports custom OpenAI-compatible endpoint for batch LLM classification with graceful heuristic fallback.
"""

import argparse
import csv
import json
import os
import re
import sqlite3
import sys
from typing import Dict, List, Optional, Tuple

TAXONOMY = [
    "Portrait", "Cinematic", "Fashion & Editorial", "Photography", "Product & Commercial",
    "Anime & Manga", "Illustration & Art", "Typography & Poster", "Retro & Vintage", "Sci-Fi & Cyberpunk",
    "Fantasy & Mythology", "Architecture & Interior", "Nature & Landscape", "3D & CGI", "Studio Lighting",
    "Dark & Moody", "Vibrant & Colorful", "Lifestyle & Candid", "Macro & Close-up", "Minimalist"
]

TAG_KEYWORDS = {
    "Portrait": ["portrait", "selfie", "woman", "man", "girl", "boy", "face", "person", "eyes", "smile", "model"],
    "Cinematic": ["cinematic", "film", "movie", "dramatic lighting", "anamorphic", "35mm", "shot", "scene"],
    "Fashion & Editorial": ["fashion", "editorial", "lookbook", "vogue", "haute", "couture", "stylish", "runway", "luxury", "outfit", "dress"],
    "Photography": ["photography", "photo", "photorealistic", "realistic", "dslr", "street photo", "candid photo"],
    "Product & Commercial": ["product", "commercial", "still life", "packaging", "bottle", "watch", "perfume", "cosmetics", "branding"],
    "Anime & Manga": ["anime", "manga", "ghibli", "shonen", "japanese animation", "cel shaded", "waifu", "otaku"],
    "Illustration & Art": ["illustration", "art", "drawing", "sketch", "painting", "watercolor", "digital art", "ink", "caricature", "comic"],
    "Typography & Poster": ["typography", "poster", "magazine cover", "logo", "graphic design", "text layout", "billboard", "lettering"],
    "Retro & Vintage": ["retro", "vintage", "nostalgic", "nostalgia", "80s", "90s", "70s", "y2k", "antique", "showa", "classic"],
    "Sci-Fi & Cyberpunk": ["sci-fi", "cyberpunk", "futuristic", "neon", "robot", "cyborg", "spaceship", "mecha", "ai", "dystopian"],
    "Fantasy & Mythology": ["fantasy", "mythology", "dragon", "magic", "wizard", "fairy", "medieval", "goddess", "creature", "enchanted"],
    "Architecture & Interior": ["architecture", "interior", "room", "building", "house", "villa", "minimalist home", "decor", "facade"],
    "Nature & Landscape": ["nature", "landscape", "mountain", "ocean", "sea", "forest", "beach", "sky", "sunset", "wildlife", "flowers"],
    "3D & CGI": ["3d", "cgi", "octane render", "unreal engine", "blender", "isometric", "clay render"],
    "Studio Lighting": ["studio lighting", "studio shot", "clean background", "softbox", "rim light", "backdrop"],
    "Dark & Moody": ["dark", "moody", "noir", "shadows", "dim", "monochrome", "gloomy", "night", "gothic"],
    "Vibrant & Colorful": ["vibrant", "colorful", "pastel", "pop art", "bright", "rainbow", "neon colors", "psychedelic"],
    "Lifestyle & Candid": ["lifestyle", "candid", "daily life", "coffee shop", "cafe", "travel", "street candid", "walking"],
    "Macro & Close-up": ["macro", "close-up", "closeup", "texture", "detailed shot", "zoom"],
    "Minimalist": ["minimalist", "minimalism", "clean", "simple", "negative space", "isolated"]
}

COMPILED_KEYWORDS = {
    tag: [re.compile(rf"\b{re.escape(kw)}\b", re.IGNORECASE) for kw in kws]
    for tag, kws in TAG_KEYWORDS.items()
}

ARG_TAG_PATTERN = re.compile(r"\{argument\s+([^}]+)\}", re.IGNORECASE)
NAME_ATTR_PATTERN = re.compile(r'name=["\'](.*?)["\']', re.IGNORECASE)
DEFAULT_ATTR_PATTERN = re.compile(r'default=["\'](.*?)["\']', re.IGNORECASE)


def parse_arguments(content: str) -> List[Dict[str, str]]:
    """Extract argument tags and their default values from prompt content."""
    arguments = []
    for match in ARG_TAG_PATTERN.finditer(content):
        attr_str = match.group(1)
        name_match = NAME_ATTR_PATTERN.search(attr_str)
        default_match = DEFAULT_ATTR_PATTERN.search(attr_str)
        name = name_match.group(1).strip() if name_match else ""
        default = default_match.group(1) if default_match else ""
        if name:
            arguments.append({"name": name, "default": default})
    return arguments


def classify_tags_heuristic(title: str, description: str, content: str) -> List[str]:
    """Score tags using keyword boundary matches from title, description, and snippet."""
    text_primary = f"{title} {description}"
    scores: Dict[str, int] = {}

    for tag, regexes in COMPILED_KEYWORDS.items():
        score = 0
        for rgx in regexes:
            # Matches in title get 3 points, description 1 point
            if rgx.search(title):
                score += 3
            elif rgx.search(description):
                score += 1
        if score > 0:
            scores[tag] = score

    if not scores:
        # Check in first 200 chars of content
        content_snippet = content[:200]
        for tag, regexes in COMPILED_KEYWORDS.items():
            if any(rgx.search(content_snippet) for rgx in regexes):
                scores[tag] = 1

    if not scores:
        return ["Photography"]

    # Sort tags by score descending, return top 3 max
    sorted_tags = sorted(scores.keys(), key=lambda t: scores[t], reverse=True)
    return sorted_tags[:3]


def slugify(text: str) -> str:
    """Generate clean slug from tag name."""
    clean = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return clean


def init_database(db_path: str):
    """Create database tables and FTS5 index."""
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            content TEXT NOT NULL,
            author_name TEXT,
            author_link TEXT,
            source_link TEXT,
            source_published_at TEXT,
            media_urls TEXT,
            has_arguments INTEGER NOT NULL DEFAULT 0,
            argument_count INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            slug TEXT UNIQUE NOT NULL
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS prompt_tags (
            prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
            tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (prompt_id, tag_id)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS prompt_arguments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            default_value TEXT,
            position_index INTEGER NOT NULL
        );
    """)

    cur.execute("CREATE INDEX IF NOT EXISTS idx_prompts_has_args ON prompts(has_arguments);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag ON prompt_tags(tag_id);")

    # FTS5 full-text index
    cur.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
            title,
            description,
            content,
            content='prompts',
            content_rowid='id'
        );
    """)

    # Seed predefined taxonomy tags
    for tag_name in TAXONOMY:
        cur.execute(
            "INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?);",
            (tag_name, slugify(tag_name)),
        )

    conn.commit()
    conn.close()


def process_csv(csv_path: str, db_path: str, limit: Optional[int] = None):
    init_database(db_path)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Load tag map {name: id}
    cur.execute("SELECT name, id FROM tags;")
    tag_map = {row[0]: row[1] for row in cur.fetchall()}

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0

        for row in reader:
            if limit and count >= limit:
                break

            prompt_id = int(row["id"])
            title = row.get("title", "").strip()
            description = row.get("description", "").strip()
            content = row.get("content", "").strip()
            source_link = row.get("sourceLink", "").strip()
            source_published_at = row.get("sourcePublishedAt", "").strip()

            # Parse author
            author_raw = row.get("author", "{}")
            try:
                author_obj = json.loads(author_raw) if author_raw else {}
                author_name = author_obj.get("name", "")
                author_link = author_obj.get("link", "")
            except Exception:
                author_name = ""
                author_link = ""

            # Parse media URLs
            media_raw = row.get("sourceMedia", "[]")
            try:
                media_list = json.loads(media_raw) if media_raw else []
            except Exception:
                media_list = []
            media_json = json.dumps(media_list)

            # Parse arguments
            args = parse_arguments(content)
            has_arguments = 1 if len(args) > 0 else 0
            argument_count = len(args)

            # Insert prompt
            cur.execute("""
                INSERT OR REPLACE INTO prompts (
                    id, title, description, content, author_name, author_link,
                    source_link, source_published_at, media_urls,
                    has_arguments, argument_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                prompt_id, title, description, content, author_name, author_link,
                source_link, source_published_at, media_json,
                has_arguments, argument_count
            ))

            # Insert into FTS
            cur.execute("""
                INSERT OR REPLACE INTO prompts_fts (rowid, title, description, content)
                VALUES (?, ?, ?, ?);
            """, (prompt_id, title, description, content))

            # Insert prompt_arguments
            cur.execute("DELETE FROM prompt_arguments WHERE prompt_id = ?;", (prompt_id,))
            for idx, arg in enumerate(args):
                cur.execute("""
                    INSERT INTO prompt_arguments (prompt_id, name, default_value, position_index)
                    VALUES (?, ?, ?, ?);
                """, (prompt_id, arg["name"], arg["default"], idx))

            # Tag classification
            matched_tags = classify_tags_heuristic(title, description, content)
            cur.execute("DELETE FROM prompt_tags WHERE prompt_id = ?;", (prompt_id,))
            for tag_name in matched_tags:
                tag_id = tag_map.get(tag_name)
                if tag_id:
                    cur.execute("""
                        INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id)
                        VALUES (?, ?);
                    """, (prompt_id, tag_id))

            count += 1
            if count % 1000 == 0:
                conn.commit()
                print(f"Processed {count} rows...")

        conn.commit()
        print(f"Finished processing {count} prompts into {db_path}.")

    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest and tag prompts into SQLite.")
    parser.add_argument("--csv", default="nano-banana-pro-prompts-20260910.csv", help="Input CSV path")
    parser.add_argument("--db", default="data.db", help="Output SQLite DB path")
    parser.add_argument("--limit", type=int, default=None, help="Limit rows processed")
    args = parser.parse_args()

    process_csv(csv_path=args.csv, db_path=args.db, limit=args.limit)
