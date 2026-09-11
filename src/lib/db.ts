import { DatabaseSync } from "node:sqlite";
import path from "path";

export interface Tag {
  id: number;
  name: string;
  slug: string;
  prompt_count: number;
}

export interface PromptArgument {
  id: number;
  prompt_id: number;
  name: string;
  default_value: string;
  position_index: number;
}

export interface PromptItem {
  id: number;
  title: string;
  description: string | null;
  content: string;
  author_name: string | null;
  author_link: string | null;
  source_link: string | null;
  source_published_at: string | null;
  media_urls: string[];
  has_arguments: number;
  argument_count: number;
  created_at: string;
  tags: string[];
  arguments?: PromptArgument[];
}

interface PromptRow {
  id: number;
  title: string;
  description: string | null;
  content: string;
  author_name: string | null;
  author_link: string | null;
  source_link: string | null;
  source_published_at: string | null;
  media_urls: string | null;
  has_arguments: number;
  argument_count: number;
  created_at: string;
}

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), "data.db");
    dbInstance = new DatabaseSync(dbPath, { readOnly: true });
  }
  return dbInstance;
}

export function getAllTags(): Tag[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT t.id, t.name, t.slug, COUNT(pt.prompt_id) as prompt_count
    FROM tags t
    JOIN prompt_tags pt ON pt.tag_id = t.id
    GROUP BY t.id
    ORDER BY prompt_count DESC
  `);
  const rows = stmt.all() as unknown as Tag[];
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    slug: String(r.slug),
    prompt_count: Number(r.prompt_count),
  }));
}

export interface SearchParams {
  query?: string;
  tag?: string;
  hasArgsOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  prompts: PromptItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function searchPrompts({
  query = "",
  tag = "",
  hasArgsOnly = false,
  page = 1,
  limit = 24,
}: SearchParams): SearchResult {
  const db = getDb();
  const offset = Math.max(0, (page - 1) * limit);

  const cleanQuery = query.trim().replace(/['"]/g, "");

  let baseQuery = "";
  const params: (string | number)[] = [];

  if (cleanQuery) {
    // FTS query
    const ftsQuery = cleanQuery
      .split(/\s+/)
      .map((term) => `"${term}"*`)
      .join(" AND ");

    baseQuery = `
      FROM prompts p
      JOIN prompts_fts fts ON fts.rowid = p.id
      ${tag ? "JOIN prompt_tags pt ON pt.prompt_id = p.id JOIN tags t ON t.id = pt.tag_id" : ""}
      WHERE prompts_fts MATCH ?
      ${tag ? "AND t.slug = ?" : ""}
      ${hasArgsOnly ? "AND p.has_arguments = 1" : ""}
    `;
    params.push(ftsQuery);
    if (tag) params.push(tag);
  } else {
    // Standard filtered query
    baseQuery = `
      FROM prompts p
      ${tag ? "JOIN prompt_tags pt ON pt.prompt_id = p.id JOIN tags t ON t.id = pt.tag_id" : ""}
      WHERE 1=1
      ${tag ? "AND t.slug = ?" : ""}
      ${hasArgsOnly ? "AND p.has_arguments = 1" : ""}
    `;
    if (tag) params.push(tag);
  }

  // Count total
  const countStmt = db.prepare(`SELECT COUNT(DISTINCT p.id) as count ${baseQuery}`);
  const totalRow = countStmt.get(...params) as unknown as { count: number } | undefined;
  const total = totalRow ? totalRow.count : 0;

  // Fetch prompts
  const selectSql = `
    SELECT DISTINCT
      p.id, p.title, p.description, p.content,
      p.author_name, p.author_link, p.source_link,
      p.source_published_at, p.media_urls,
      p.has_arguments, p.argument_count, p.created_at
    ${baseQuery}
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
  `;
  const fetchParams = [...params, limit, offset];
  const rows = db.prepare(selectSql).all(...fetchParams) as unknown as PromptRow[];

  if (rows.length === 0) {
    return { prompts: [], total, page, totalPages: Math.ceil(total / limit) };
  }

  // Fetch tags for these prompts in one batch
  const promptIds = rows.map((r) => r.id);
  const placeholders = promptIds.map(() => "?").join(",");
  const tagsStmt = db.prepare(`
    SELECT pt.prompt_id, t.name
    FROM prompt_tags pt
    JOIN tags t ON t.id = pt.tag_id
    WHERE pt.prompt_id IN (${placeholders})
  `);
  const tagRows = tagsStmt.all(...promptIds) as unknown as { prompt_id: number; name: string }[];
  const tagsByPrompt: Record<number, string[]> = {};
  for (const tr of tagRows) {
    if (!tagsByPrompt[tr.prompt_id]) {
      tagsByPrompt[tr.prompt_id] = [];
    }
    tagsByPrompt[tr.prompt_id]!.push(tr.name);
  }

  const prompts: PromptItem[] = rows.map((row) => {
    let mediaList: string[] = [];
    try {
      mediaList = JSON.parse(row.media_urls || "[]");
    } catch {
      mediaList = [];
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      content: row.content,
      author_name: row.author_name,
      author_link: row.author_link,
      source_link: row.source_link,
      source_published_at: row.source_published_at,
      media_urls: mediaList,
      has_arguments: row.has_arguments,
      argument_count: row.argument_count,
      created_at: row.created_at,
      tags: tagsByPrompt[row.id] || [],
    };
  });

  return {
    prompts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export function getPromptById(id: number): PromptItem | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM prompts WHERE id = ?").get(id) as unknown as PromptRow | undefined;
  if (!row) return null;

  const tagRows = db.prepare(`
    SELECT t.name FROM prompt_tags pt
    JOIN tags t ON t.id = pt.tag_id
    WHERE pt.prompt_id = ?
  `).all(id) as unknown as { name: string }[];

  const argRows = db.prepare(`
    SELECT id, prompt_id, name, default_value, position_index
    FROM prompt_arguments
    WHERE prompt_id = ?
    ORDER BY position_index ASC
  `).all(id) as unknown as PromptArgument[];
  const parsedArgs = argRows.map((a) => ({
    id: Number(a.id),
    prompt_id: Number(a.prompt_id),
    name: String(a.name),
    default_value: String(a.default_value),
    position_index: Number(a.position_index),
  }));

  let mediaList: string[] = [];
  try {
    mediaList = JSON.parse(row.media_urls || "[]");
  } catch {
    mediaList = [];
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    author_name: row.author_name,
    author_link: row.author_link,
    source_link: row.source_link,
    source_published_at: row.source_published_at,
    media_urls: mediaList,
    has_arguments: row.has_arguments,
    argument_count: row.argument_count,
    created_at: row.created_at,
    tags: tagRows.map((t) => t.name),
    arguments: parsedArgs,
  };
}
