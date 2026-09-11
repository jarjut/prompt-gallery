"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import type { PromptItem, Tag, SearchResult } from "@/lib/db";
import { FilterBar } from "@/components/FilterBar";
import { PromptCard } from "@/components/PromptCard";
import { PromptModal } from "@/components/PromptModal";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";

interface GalleryViewProps {
  initialData: SearchResult;
  tags: Tag[];
  initialTag?: string;
  initialQuery?: string;
  initialPage?: number;
  initialPrompt?: PromptItem | null;
}

export function GalleryView({
  initialData,
  tags,
  initialTag = "",
  initialQuery = "",
  initialPage = 1,
  initialPrompt = null,
}: GalleryViewProps) {
  const [prompts, setPrompts] = useState<PromptItem[]>(initialData.prompts);
  const [totalResults, setTotalResults] = useState(initialData.total);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(initialPrompt);

  const [isPending, startTransition] = useTransition();

  const activeTagRef = useRef(initialTag);
  const activeQueryRef = useRef(initialQuery);
  const activePageRef = useRef(initialPage);
  const promptsRef = useRef(prompts);
  promptsRef.current = prompts;
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastFetchedKeyRef = useRef(`${initialTag}|${initialQuery.trim()}|${initialPage}`);

  const getUrl = useCallback(
    (tag: string, query: string, page: number, promptId?: number | null) => {
      const params = new URLSearchParams();
      if (tag) params.set("tag", tag);
      if (query.trim()) params.set("q", query.trim());
      if (page > 1) params.set("page", page.toString());
      if (promptId) params.set("prompt", promptId.toString());
      const qs = params.toString();
      return qs ? `/?${qs}` : "/";
    },
    []
  );

  const fetchFilteredPrompts = useCallback(
    async (page: number, query: string, tag: string) => {
      const fetchKey = `${tag}|${query.trim()}|${page}`;
      lastFetchedKeyRef.current = fetchKey;

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
        if (lastFetchedKeyRef.current === fetchKey) {
          setPrompts(data.prompts);
          setTotalResults(data.total);
          setTotalPages(data.totalPages);
          setCurrentPage(data.page);
          activePageRef.current = data.page;
        }
      } catch (err) {
        console.error("Error fetching prompts:", err);
      }
    },
    []
  );

  const fetchPromptDetail = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/prompts/${id}`);
      if (res.ok) {
        const data: PromptItem = await res.json();
        setSelectedPrompt(data);
      } else if (res.status === 404) {
        const params = new URLSearchParams(window.location.search);
        params.delete("prompt");
        const qs = params.toString();
        window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
        setSelectedPrompt(null);
      }
    } catch (err) {
      console.error("Error fetching prompt detail:", err);
    }
  }, []);

  // History Priming on cold-load with ?prompt=
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const promptIdParam = urlParams.get("prompt");

    if (promptIdParam && !window.history.state?.__primed) {
      const baseParams = new URLSearchParams(window.location.search);
      baseParams.delete("prompt");
      const baseQs = baseParams.toString();
      const baseUrl = baseQs ? `/?${baseQs}` : "/";
      const fullUrl = window.location.pathname + window.location.search;

      window.history.replaceState({ __primed: true, prompt: null }, "", baseUrl);
      window.history.pushState(
        { __primed: true, prompt: Number(promptIdParam) },
        "",
        fullUrl
      );
    }

    if (promptIdParam && !selectedPrompt) {
      const pId = Number(promptIdParam);
      if (!isNaN(pId)) {
        const found = initialData.prompts.find((p) => p.id === pId);
        if (found) {
          setSelectedPrompt(found);
        } else {
          fetchPromptDetail(pId);
        }
      }
    }
  }, [initialData.prompts, selectedPrompt, fetchPromptDetail]);

  // Popstate listener (Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tagParam = params.get("tag") || "";
      const queryParam = params.get("q") || "";
      const pageParam = Math.max(1, parseInt(params.get("page") || "1", 10));
      const promptParam = params.get("prompt");

      // 1. Sync Modal
      if (!promptParam) {
        setSelectedPrompt(null);
      } else {
        const pId = Number(promptParam);
        if (!isNaN(pId)) {
          setSelectedPrompt((current) => {
            if (current?.id === pId) return current;
            const found = promptsRef.current.find((p) => p.id === pId);
            if (found) return found;
            fetchPromptDetail(pId);
            return current;
          });
        }
      }

      // 2. Sync Filters
      const filtersChanged =
        tagParam !== activeTagRef.current ||
        queryParam !== activeQueryRef.current ||
        pageParam !== activePageRef.current;

      if (filtersChanged) {
        activeTagRef.current = tagParam;
        activeQueryRef.current = queryParam;
        activePageRef.current = pageParam;

        setSelectedTag(tagParam);
        setSearchQuery(queryParam);
        setCurrentPage(pageParam);

        startTransition(() => {
          fetchFilteredPrompts(pageParam, queryParam, tagParam);
        });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [fetchFilteredPrompts, fetchPromptDetail]);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      clearTimeout(debounceTimerRef.current);

      if (query === "") {
        activeQueryRef.current = "";
        activePageRef.current = 1;
        setCurrentPage(1);

        startTransition(() => {
          fetchFilteredPrompts(1, "", activeTagRef.current);
        });

        const newUrl = getUrl(activeTagRef.current, "", 1, selectedPrompt?.id);
        window.history.replaceState(
          { __primed: true, prompt: selectedPrompt?.id ?? null },
          "",
          newUrl
        );
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        activeQueryRef.current = query;
        activePageRef.current = 1;
        setCurrentPage(1);

        startTransition(() => {
          fetchFilteredPrompts(1, query, activeTagRef.current);
        });

        const newUrl = getUrl(activeTagRef.current, query, 1, selectedPrompt?.id);
        window.history.replaceState(
          { __primed: true, prompt: selectedPrompt?.id ?? null },
          "",
          newUrl
        );
      }, 250);
    },
    [fetchFilteredPrompts, getUrl, selectedPrompt]
  );

  const handleSearchSubmit = useCallback(
    (query: string) => {
      clearTimeout(debounceTimerRef.current);

      activeQueryRef.current = query;
      activePageRef.current = 1;
      setCurrentPage(1);

      startTransition(() => {
        fetchFilteredPrompts(1, query, activeTagRef.current);
      });

      const newUrl = getUrl(activeTagRef.current, query, 1, selectedPrompt?.id);
      window.history.pushState(
        { __primed: true, prompt: selectedPrompt?.id ?? null },
        "",
        newUrl
      );
    },
    [fetchFilteredPrompts, getUrl, selectedPrompt]
  );

  const handleTagChange = useCallback(
    (tag: string) => {
      activeTagRef.current = tag;
      activePageRef.current = 1;
      setSelectedTag(tag);
      setCurrentPage(1);

      startTransition(() => {
        fetchFilteredPrompts(1, activeQueryRef.current, tag);
      });

      const newUrl = getUrl(tag, activeQueryRef.current, 1, selectedPrompt?.id);
      window.history.pushState(
        { __primed: true, prompt: selectedPrompt?.id ?? null },
        "",
        newUrl
      );
    },
    [fetchFilteredPrompts, getUrl, selectedPrompt]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      activePageRef.current = newPage;
      setCurrentPage(newPage);

      startTransition(() => {
        fetchFilteredPrompts(newPage, activeQueryRef.current, activeTagRef.current);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      const newUrl = getUrl(
        activeTagRef.current,
        activeQueryRef.current,
        newPage,
        selectedPrompt?.id
      );
      window.history.pushState(
        { __primed: true, prompt: selectedPrompt?.id ?? null },
        "",
        newUrl
      );
    },
    [totalPages, fetchFilteredPrompts, getUrl, selectedPrompt]
  );

  const handleSelectPrompt = useCallback(
    (prompt: PromptItem) => {
      setSelectedPrompt(prompt);
      const newUrl = getUrl(
        activeTagRef.current,
        activeQueryRef.current,
        activePageRef.current,
        prompt.id
      );
      window.history.pushState(
        { __primed: true, prompt: prompt.id },
        "",
        newUrl
      );
    },
    [getUrl]
  );

  const handleCloseModal = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("prompt")) {
      window.history.back();
    } else {
      setSelectedPrompt(null);
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    activeTagRef.current = "";
    activeQueryRef.current = "";
    activePageRef.current = 1;
    setSelectedTag("");
    setSearchQuery("");
    setCurrentPage(1);

    startTransition(() => {
      fetchFilteredPrompts(1, "", "");
    });

    const newUrl = getUrl("", "", 1, selectedPrompt?.id);
    window.history.pushState(
      { __primed: true, prompt: selectedPrompt?.id ?? null },
      "",
      newUrl
    );
  }, [fetchFilteredPrompts, getUrl, selectedPrompt]);
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* Sticky Header & Taxonomy Filter */}
      <FilterBar
        tags={tags}
        selectedTag={selectedTag}
        searchQuery={searchQuery}
        totalResults={totalResults}
        onTagChange={handleTagChange}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
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
                onSelect={handleSelectPrompt}
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
              onClick={handleResetFilters}
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
        onClose={handleCloseModal}
      />
    </div>
  );
}
