"use client";

import { useEffect, useRef } from "react";
import type { Tag } from "@/lib/db";
import { Search, X } from "lucide-react";

interface FilterBarProps {
  tags: Tag[];
  selectedTag: string;
  searchQuery: string;
  totalResults: number;
  onTagChange: (tag: string) => void;
  onSearchChange: (query: string) => void;
}

export function FilterBar({
  tags,
  selectedTag,
  searchQuery,
  totalResults,
  onTagChange,
  onSearchChange,
}: FilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="w-full bg-paper hairline-b sticky top-0 z-30">
      {/* Top Banner / Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-end justify-between gap-4 hairline-b">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted">
            <span>NANO BANANA PRO ARCHIVE</span>
            <span>·</span>
            <span>{totalResults.toLocaleString()} ITEMS</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl lowercase tracking-tighter text-ink mt-0.5 flex items-center">
            yantraloka<span className="w-2 h-2 bg-accent inline-block ml-1"></span>
          </h1>
        </div>

        {/* Search Bar & Variable Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search prompts... (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-paper-2 hairline-all font-body text-sm text-ink placeholder:text-muted placeholder:font-mono placeholder:text-xs outline-none focus:bg-paper focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Tag Taxonomy Filter Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => onTagChange("")}
            className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider hairline-all transition-colors ${
              selectedTag === ""
                ? "bg-ink text-paper border-ink"
                : "bg-paper hover:bg-paper-2 text-ink-secondary border-rule"
            }`}
          >
            All
          </button>
          {tags.map((tag) => {
            const isSelected = selectedTag === tag.slug;
            return (
              <button
                key={tag.id}
                onClick={() => onTagChange(isSelected ? "" : tag.slug)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase tracking-wider hairline-all transition-colors ${
                  isSelected
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper hover:bg-paper-2 text-ink-secondary border-rule"
                }`}
              >
                <span>{tag.name}</span>
                <span
                  className={`text-[10px] ${
                    isSelected ? "text-paper/70" : "text-muted"
                  }`}
                >
                  {tag.prompt_count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
