"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import type { PromptItem, Tag, SearchResult } from "@/lib/db";
import { FilterBar } from "@/components/FilterBar";
import { PromptCard } from "@/components/PromptCard";
import { PromptModal } from "@/components/PromptModal";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

interface GalleryViewProps {
  initialData: SearchResult;
  tags: Tag[];
}

export function GalleryView({ initialData, tags }: GalleryViewProps) {
  const [prompts, setPrompts] = useState<PromptItem[]>(initialData.prompts);
  const [totalResults, setTotalResults] = useState(initialData.total);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTag, setSelectedTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);

  const [isPending, startTransition] = useTransition();

  // Debounced search & filter fetcher
  const fetchFilteredPrompts = useCallback(
    async (page: number, query: string, tag: string) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "24",
      });
      if (query.trim()) params.set("q", query.trim());
      if (tag) params.set("tag", tag);

      try {
        const res = await fetch(`/api/prompts?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch prompts");
        const data: SearchResult = await res.json();
        setPrompts(data.prompts);
        setTotalResults(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      } catch (err) {
        console.error("Error fetching prompts:", err);
      }
    },
    []
  );

  // Trigger search on filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchFilteredPrompts(1, searchQuery, selectedTag);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedTag, fetchFilteredPrompts]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    startTransition(() => {
      fetchFilteredPrompts(newPage, searchQuery, selectedTag);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* Sticky Header & Taxonomy Filter */}
      <FilterBar
        tags={tags}
        selectedTag={selectedTag}
        searchQuery={searchQuery}
        totalResults={totalResults}
        onTagChange={(tag) => setSelectedTag(tag)}
        onSearchChange={(q) => setSearchQuery(q)}
      />

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Loading Indicator Overlay */}
        {isPending && (
          <div className="fixed top-20 right-6 z-40 bg-paper hairline-all px-3 py-1.5 shadow-md flex items-center gap-2 font-mono text-xs text-ink">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>Updating...</span>
          </div>
        )}

        {/* Results Counter & Active Filter Badge */}
        <div className="flex items-center justify-between font-mono text-xs text-muted mb-4 pb-2 hairline-b">
          <div className="flex items-center gap-2">
            <span>SHOWING {prompts.length} OF {totalResults.toLocaleString()} ITEMS</span>
            {selectedTag && (
              <span className="bg-paper-3 text-ink px-2 py-0.5 font-medium hairline-all uppercase">
                Tag: {selectedTag}
              </span>
            )}
          </div>
          <div className="hidden sm:block">
            PAGE {currentPage} OF {Math.max(1, totalPages)}
          </div>
        </div>

        {/* Prompt Card Grid (Catalogue Macrostructure) */}
        {prompts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSelect={(p) => setSelectedPrompt(p)}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center dot-grid hairline-all p-8 my-8">
            <h3 className="font-display font-bold text-lg text-ink">No prompts matched your search</h3>
            <p className="font-mono text-xs text-muted mt-1">
              Try adjusting your search terms or clearing selected tag filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTag("");
              }}
              className="mt-4 px-4 py-2 bg-ink text-paper font-mono text-xs hover:bg-accent transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-8 pt-4 hairline-t flex items-center justify-between font-mono text-xs">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-paper-2 hairline-all hover:bg-paper-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-ink"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-muted">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="flex items-center gap-1.5 px-3 py-2 bg-paper-2 hairline-all hover:bg-paper-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-ink"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>

      {/* Footer (Hallmark Grid Spec) */}
      <footer className="w-full bg-paper hairline-t mt-12 py-6 text-center font-mono text-xs text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>YANTRALOKA // NANO BANANA PRO ARCHIVE</div>
              <div>
                &copy; {new Date().getFullYear()}{" "}
                <a
                  href="https://jarjut.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-ink transition-colors"
                >
                  jarjut.dev
                </a>
                . All rights reserved.
              </div>
        </div>
      </footer>

      {/* Interactive Prompt Modal Dialog */}
      <PromptModal
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
      />
    </div>
  );
}
