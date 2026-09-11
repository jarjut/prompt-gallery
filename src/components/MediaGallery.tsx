"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Image as ImageIcon,
} from "lucide-react";

interface MediaGalleryProps {
  mediaUrls?: string[];
  title: string;
}

export function MediaGallery({ mediaUrls = [], title }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const validUrls = mediaUrls.filter(Boolean);
  const hasMultiple = validUrls.length > 1;
  const currentUrl = validUrls[currentIndex];
  const isCurrentFailed = failedImages[currentIndex];

  const handlePrev = useCallback(() => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validUrls.length - 1));
  }, [hasMultiple, validUrls.length]);

  const handleNext = useCallback(() => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev < validUrls.length - 1 ? prev + 1 : 0));
  }, [hasMultiple, validUrls.length]);

  // Capture Escape and Arrow keys before parent Modal Viewer handles Escape
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.stopPropagation();
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        e.stopPropagation();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.stopPropagation();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isLightboxOpen, handlePrev, handleNext]);

  // Reset index when media set changes
  useEffect(() => {
    setCurrentIndex(0);
    setFailedImages({});
  }, [mediaUrls]);

  if (validUrls.length === 0 || isCurrentFailed) {
    return (
      <div className="aspect-[4/3] w-full bg-paper hairline-all flex flex-col items-center justify-center text-muted p-4 dot-grid">
        <ImageIcon className="w-10 h-10 stroke-1 opacity-50 mb-2" />
        <span className="font-mono text-xs uppercase tracking-wider">No Image Preview</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Media Preview Frame (Bounded Contain) */}
      <div
        onClick={() => setIsLightboxOpen(true)}
        className="relative aspect-[4/3] max-h-[360px] w-full bg-paper-3 hairline-all overflow-hidden flex items-center justify-center group cursor-zoom-in"
        role="button"
        tabIndex={0}
        aria-label="Open image preview in full resolution"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsLightboxOpen(true);
          }
        }}
      >
        <img
          src={currentUrl}
          alt={`${title} - asset ${currentIndex + 1}`}
          referrerPolicy="no-referrer"
          onError={() => setFailedImages((prev) => ({ ...prev, [currentIndex]: true }))}
          className="w-full h-full object-contain"
        />

        {/* Zoom Hint Overlay */}
        <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-paper/90 hairline-all text-ink font-mono text-[11px] px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
            <ZoomIn className="w-3.5 h-3.5 text-accent" />
            <span>Click to expand</span>
          </span>
        </div>

        {/* Counter Badge */}
        {hasMultiple && (
          <div className="absolute bottom-2 right-2 bg-ink/80 text-paper font-mono text-[10px] px-1.5 py-0.5 pointer-events-none">
            {currentIndex + 1} / {validUrls.length}
          </div>
        )}
      </div>

      {/* Multi-Asset Thumbnail Row */}
      {hasMultiple && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
          {validUrls.map((url, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={url + idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 flex-shrink-0 bg-paper-3 hairline-all overflow-hidden transition-all ${
                  isSelected ? "ring-2 ring-accent scale-105" : "opacity-60 hover:opacity-100"
                }`}
                title={`View image ${idx + 1}`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Media Lightbox Overlay */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[70] bg-ink/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header Bar: Counter & Close */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-10">
            {hasMultiple && (
              <span className="font-mono text-xs text-paper/80 bg-paper/10 px-2.5 py-1 hairline-all">
                {currentIndex + 1} / {validUrls.length}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
              }}
              className="p-1.5 text-paper/80 hover:text-paper bg-paper/10 hover:bg-paper/20 hairline-all transition-colors"
              title="Close preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Previous Arrow Button */}
          {hasMultiple && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 sm:left-6 p-2 text-paper/80 hover:text-paper bg-paper/10 hover:bg-paper/20 hairline-all transition-colors z-10"
              title="Previous image (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Expanded Asset Display */}
          {/* ponytail: zoom & pan controls omitted; add when deep gigapixel inspection is requested */}
          <div
            className="max-w-[92vw] max-h-[88vh] flex items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentUrl}
              alt={`${title} - asset ${currentIndex + 1}`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[88vh] object-contain shadow-2xl hairline-all"
            />
          </div>

          {/* Next Arrow Button */}
          {hasMultiple && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 sm:right-6 p-2 text-paper/80 hover:text-paper bg-paper/10 hover:bg-paper/20 hairline-all transition-colors z-10"
              title="Next image (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
