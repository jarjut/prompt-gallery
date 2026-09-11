"use client";

import Link from "next/link";
import { useState } from "react";
import type { PromptItem } from "@/lib/db";
import { SlidersHorizontal, Image as ImageIcon } from "lucide-react";

interface PromptCardProps {
  prompt: PromptItem;
  onSelect?: (prompt: PromptItem) => void;
  href?: string;
}

export function PromptCard({ prompt, onSelect, href }: PromptCardProps) {
  const [imageError, setImageError] = useState(false);
  const primaryMedia = prompt.media_urls?.[0];

  return (
    <Link
      href={href || `/?prompt=${prompt.id}`}
      onClick={(e) => {
        if (onSelect && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
          e.preventDefault();
          onSelect(prompt);
        }
      }}
      className="group relative flex flex-col bg-paper hairline-all transition-colors duration-fast hover:bg-paper-2 hover:border-ink cursor-pointer overflow-hidden text-inherit no-underline"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] w-full bg-paper-3 hairline-b overflow-hidden">
        {primaryMedia && !imageError ? (
          <img
            src={primaryMedia}
            alt={prompt.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-top transition-transform duration-normal group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full dot-grid flex flex-col items-center justify-center text-muted p-4">
            <ImageIcon className="w-8 h-8 stroke-1 opacity-50 mb-1" />
            <span className="font-mono text-xs tracking-wider uppercase opacity-75">No Preview</span>
          </div>
        )}

        {/* Dynamic Variable Pill Badge */}
        {prompt.has_arguments === 1 && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-paper/95 backdrop-blur-sm px-2 py-0.5 text-xs font-mono font-medium hairline-all text-ink shadow-sm">
            <SlidersHorizontal className="w-3 h-3 text-accent" />
            <span>{prompt.argument_count} VARS</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-paper bg-ink/80 px-1.5 py-0.5">
          #{prompt.id}
        </div>
      </div>

      {/* Content Meta */}
      <div className="flex flex-col flex-1 p-3.5 justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-sm leading-snug text-ink line-clamp-2 group-hover:text-accent transition-colors">
            {prompt.title}
          </h3>
          {prompt.description && (
            <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
              {prompt.description}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 items-center pt-2 hairline-t">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono font-medium uppercase tracking-wider px-1.5 py-0.5 bg-paper-3 text-ink-secondary"
            >
              {tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-[10px] font-mono text-muted">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
