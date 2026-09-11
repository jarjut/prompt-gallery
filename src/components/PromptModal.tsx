"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { PromptItem } from "@/lib/db";
import {
  X,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  SlidersHorizontal,
  Code2,
} from "lucide-react";

import { MediaGallery } from "@/components/MediaGallery";
interface PromptModalProps {
  prompt: PromptItem | null;
  onClose: () => void;
}

interface TextSegment {
  type: "text" | "argument";
  content?: string;
  name?: string;
  defaultValue?: string;
}

const ARG_REGEX = /\{argument\s+name=["'](.*?)["']\s+default=["'](.*?)["']\}/gi;

export function PromptModal({ prompt, onClose }: PromptModalProps) {
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (prompt) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [prompt]);

  // Parse prompt content into segments and initialize argument values
  const { segments, initialDefaults } = useMemo(() => {
    if (!prompt) return { segments: [], initialDefaults: {} };

    const segs: TextSegment[] = [];
    const defaults: Record<string, string> = {};
    const text = prompt.content;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const regex = new RegExp(ARG_REGEX);
    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        segs.push({
          type: "text",
          content: text.slice(lastIndex, matchIndex),
        });
      }

      const name = match[1] ?? "";
      const defVal = match[2] ?? "";
      segs.push({
        type: "argument",
        name,
        defaultValue: defVal,
      });

      if (!(name in defaults)) {
        defaults[name] = defVal;
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      segs.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return { segments: segs, initialDefaults: defaults };
  }, [prompt]);

  // Reset/sync argument state when prompt changes
  useEffect(() => {
    setArgValues(initialDefaults);
    setCopied(false);
    setShowRaw(false);
  }, [initialDefaults]);

  // Update argument value across all synchronized instances
  const handleArgChange = useCallback((name: string, value: string) => {
    setArgValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Reset to original defaults
  const handleResetDefaults = useCallback(() => {
    setArgValues(initialDefaults);
  }, [initialDefaults]);

  // Generate clean rendered string without JSON or argument syntax
  const renderedPrompt = useMemo(() => {
    if (!prompt) return "";
    return prompt.content.replace(
      new RegExp(ARG_REGEX),
      (_match, name, defVal) => {
        return argValues[name] !== undefined ? argValues[name] : defVal;
      }
    );
  }, [prompt, argValues]);

  // Copy to clipboard with silent success microinteraction
  const handleCopy = useCallback(async () => {
    if (!renderedPrompt) return;
    try {
      await navigator.clipboard.writeText(renderedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = renderedPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [renderedPrompt]);

  if (!prompt) return null;

  const primaryMedia = prompt.media_urls?.[0];
  const distinctArgNames = Object.keys(initialDefaults);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/75 backdrop-blur-[2px] transition-opacity"
      />

      {/* Modal Dialog Shell */}
      <div className="relative w-full max-w-5xl bg-paper hairline-all shadow-2xl z-10 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 hairline-b bg-paper-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted uppercase tracking-wider">
              PROMPT #{prompt.id}
            </span>
            {prompt.has_arguments === 1 && (
              <span className="flex items-center gap-1.5 bg-paper px-2 py-0.5 text-xs font-mono font-medium hairline-all text-ink">
                <SlidersHorizontal className="w-3 h-3 text-accent" />
                <span>{distinctArgNames.length} Unique Variables</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-ink hover:bg-paper hairline-all transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Media & Metadata (4 cols on lg) */}
          <div className="lg:col-span-4 p-4 sm:p-6 bg-paper-2 hairline-b lg:hairline-b-0 lg:hairline-r flex flex-col gap-4">
            {/* Media Gallery with Proportioned Preview & Lightbox */}
            <MediaGallery mediaUrls={prompt.media_urls} title={prompt.title} />

            {/* Metadata Spec Sheet */}
            <div className="space-y-3 font-mono text-xs">
              <div className="hairline-b pb-2">
                <div className="text-[10px] text-muted uppercase tracking-widest">Author</div>
                <div className="text-ink font-medium mt-0.5">
                  {prompt.author_link ? (
                    <a
                      href={prompt.author_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-accent inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      <span>{prompt.author_name || "Unknown Author"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    prompt.author_name || "Unknown Author"
                  )}
                </div>
              </div>

              {prompt.source_published_at && (
                <div className="hairline-b pb-2">
                  <div className="text-[10px] text-muted uppercase tracking-widest">Published</div>
                  <div className="text-ink mt-0.5">
                    {new Date(prompt.source_published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}

              {prompt.source_link && (
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-widest">Original Source</div>
                  <a
                    href={prompt.source_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-accent inline-flex items-center gap-1 underline underline-offset-2 mt-0.5"
                  >
                    <span>View on X (Twitter)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Prompt Editor (8 cols on lg) */}
          <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col gap-5">
            {/* Title & Description */}
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink leading-tight">
                {prompt.title}
              </h2>
              {prompt.description && (
                <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">
                  {prompt.description}
                </p>
              )}
            </div>

            {/* Tags Strip */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs font-mono font-medium uppercase tracking-wider bg-paper-3 text-ink-secondary hairline-all"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Prompt Editor Panel */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <span>Interactive Prompt Body</span>
                  {prompt.has_arguments === 1 && (
                    <span className="text-[10px] text-accent font-semibold">
                      (Click underlined tokens to edit)
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {prompt.has_arguments === 1 && (
                    <button
                      onClick={handleResetDefaults}
                      className="text-muted hover:text-ink inline-flex items-center gap-1 underline underline-offset-2"
                      title="Reset variables to initial defaults"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="text-muted hover:text-ink inline-flex items-center gap-1 underline underline-offset-2"
                    title="Toggle raw template markup"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>{showRaw ? "Rendered" : "Raw Syntax"}</span>
                  </button>
                </div>
              </div>

              {/* Text Container */}
              <div className="bg-paper-2 hairline-all p-4 font-mono text-xs sm:text-sm leading-relaxed text-ink min-h-[200px] max-h-[420px] overflow-y-auto whitespace-pre-wrap select-text">
                {showRaw ? (
                  <code>{prompt.content}</code>
                ) : (
                  segments.map((seg, idx) => {
                    if (seg.type === "text") {
                      return <span key={idx}>{seg.content}</span>;
                    }

                    const name = seg.name ?? "";
                    const currentVal = argValues[name] ?? seg.defaultValue ?? "";

                    return (
                      <input
                        key={idx}
                        type="text"
                        value={currentVal}
                        onChange={(e) => handleArgChange(name, e.target.value)}
                        style={{
                          width: `${Math.max(currentVal.length + 1, (seg.defaultValue?.length ?? 6) + 1)}ch`,
                        }}
                        className="inline-token-input text-accent font-semibold"
                        title={`Argument: ${name} (Default: "${seg.defaultValue}")`}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Primary Action Footer */}
            <div className="pt-3 hairline-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xs font-mono text-muted">
                {copied ? (
                  <span className="text-accent font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Clean plain text copied! Ready to paste into Midjourney / LLM.</span>
                  </span>
                ) : (
                  <span>Copies interpolated prompt directly without JSON or markup.</span>
                )}
              </div>

              {/* Copy CTA Button */}
              <button
                onClick={handleCopy}
                className={`px-5 py-2.5 font-mono text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  copied
                    ? "bg-accent text-accent-ink hairline-all border-accent"
                    : "bg-ink text-paper hover:bg-accent hover:text-accent-ink hairline-all border-ink"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
