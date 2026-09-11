import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllTags, searchPrompts } from "@/lib/db";
import { PromptCard } from "@/components/PromptCard";
import { ArrowLeft, ArrowRight, Tag as TagIcon, SlidersHorizontal } from "lucide-react";

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tags = getAllTags();
  const tag = tags.find((t) => t.slug === slug);
  if (!tag) return { title: "Category Not Found" };

  const title = `${tag.name} AI Prompt Formulas (${tag.prompt_count} Prompts)`;
  const description = `Curated collection of ${tag.prompt_count.toLocaleString()} ${tag.name.toLowerCase()} generative AI prompt formulas with customizable variables for Midjourney, Flux, and Stable Diffusion.`;

  return {
    title,
    description,
    keywords: [
      tag.name,
      `${tag.name} prompts`,
      `${tag.name} midjourney`,
      `${tag.name} flux prompts`,
      "AI prompt engineering",
    ],
    alternates: {
      canonical: `/tag/${tag.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/tag/${tag.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;

  const tags = getAllTags();
  const tag = tags.find((t) => t.slug === slug);
  if (!tag) notFound();

  const currentPage = Math.max(1, Number(page || "1"));
  const result = searchPrompts({ tag: tag.slug, page: currentPage, limit: 24 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yantraloka.com";

  // Schema.org CollectionPage and ItemList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${tag.name} AI Prompt Formulas`,
    description: `Curated collection of ${tag.prompt_count} ${tag.name.toLowerCase()} generative AI prompt formulas.`,
    url: `${siteUrl}/tag/${tag.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: result.prompts.map((p, idx) => ({
        "@type": "ListItem",
        position: (currentPage - 1) * 24 + idx + 1,
        name: p.title,
        url: `${siteUrl}/prompts/${p.id}`,
      })),
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Header Bar */}
      <header className="w-full bg-paper hairline-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ALL CATEGORIES</span>
          </Link>

          <Link
            href="/"
            className="font-display font-extrabold text-lg tracking-tighter lowercase flex items-center"
          >
            yantraloka<span className="w-1.5 h-1.5 bg-accent inline-block ml-1"></span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 font-mono text-xs text-muted mb-4 pb-2 hairline-b">
          <Link href="/" className="hover:underline">
            ARCHIVE
          </Link>
          <span>/</span>
          <span>CATEGORIES</span>
          <span>/</span>
          <span className="text-ink uppercase">{tag.name}</span>
        </div>

        {/* Category Hero / Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-ink tracking-tight">
              {tag.name}
            </h1>
            <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-paper-3 hairline-all text-ink uppercase">
              {tag.prompt_count.toLocaleString()} Formulas
            </span>
          </div>

          <p className="mt-3 text-base sm:text-lg text-ink-secondary leading-relaxed max-w-3xl">
            Curated archive of {tag.prompt_count.toLocaleString()} prompt formulas categorized under{" "}
            <strong className="text-ink font-semibold">{tag.name}</strong>. Designed for generative
            AI systems including Midjourney, Flux, and Stable Diffusion with customizable variable
            parameters.
          </p>

          {/* Related Categories Navigation (Topical Authority & Cross-Linking) */}
          <div className="mt-6 pt-4 hairline-t">
            <div className="flex items-center gap-2 font-mono text-xs text-muted mb-2.5">
              <TagIcon className="w-3.5 h-3.5" />
              <span>EXPLORE OTHER CATEGORIES:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags
                .filter((t) => t.slug !== tag.slug)
                .map((otherTag) => (
                  <Link
                    key={otherTag.slug}
                    href={`/tag/${otherTag.slug}`}
                    className="text-[11px] font-mono uppercase px-2 py-1 bg-paper-2 hover:bg-paper-3 text-muted hover:text-ink hairline-all transition-colors"
                  >
                    {otherTag.name} ({otherTag.prompt_count})
                  </Link>
                ))}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between font-mono text-xs text-muted mb-4 pb-2 hairline-b">
          <div>
            SHOWING {result.prompts.length} OF {result.total.toLocaleString()} {tag.name.toUpperCase()} PROMPTS
          </div>
          <div>
            PAGE {currentPage} OF {Math.max(1, result.totalPages)}
          </div>
        </div>

        {/* Cards Grid */}
        {result.prompts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center dot-grid hairline-all p-8 my-8">
            <h3 className="font-display font-bold text-lg text-ink">No prompts found in this category</h3>
          </div>
        )}

        {/* Pagination */}
        {result.totalPages > 1 && (
          <div className="mt-10 pt-4 hairline-t flex items-center justify-between font-mono text-xs">
            {currentPage > 1 ? (
              <Link
                href={`/tag/${tag.slug}?page=${currentPage - 1}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-paper-2 hairline-all hover:bg-paper-3 transition-colors text-ink"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </Link>
            ) : (
              <div className="opacity-40 px-3 py-2 hairline-all cursor-not-allowed">
                <span>Previous</span>
              </div>
            )}

            <span className="text-muted">
              Page {currentPage} of {result.totalPages}
            </span>

            {currentPage < result.totalPages ? (
              <Link
                href={`/tag/${tag.slug}?page=${currentPage + 1}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-paper-2 hairline-all hover:bg-paper-3 transition-colors text-ink"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="opacity-40 px-3 py-2 hairline-all cursor-not-allowed">
                <span>Next</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-paper hairline-t mt-16 py-6 text-center font-mono text-xs text-muted">
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
    </div>
  );
}
