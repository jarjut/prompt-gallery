import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPromptById } from "@/lib/db";
import { CopyButton } from "@/components/CopyButton";
import {
  ArrowLeft,
  ExternalLink,
  SlidersHorizontal,
  Calendar,
  User,
  Tag as TagIcon,
  Image as ImageIcon,
} from "lucide-react";

interface PromptPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PromptPageProps): Promise<Metadata> {
  const { id } = await params;
  const promptId = Number(id);
  if (isNaN(promptId)) return { title: "Prompt Not Found" };

  const prompt = getPromptById(promptId);
  if (!prompt) return { title: "Prompt Not Found" };

  const title = `${prompt.title} — AI Prompt Formula`;
  const description =
    prompt.description ||
    `Generative AI prompt formula #${prompt.id}. ${prompt.content.slice(0, 150)}...`;
  const primaryMedia = prompt.media_urls?.[0];

  return {
    title,
    description,
    keywords: prompt.tags,
    alternates: {
      canonical: `/prompts/${prompt.id}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/prompts/${prompt.id}`,
      images: primaryMedia ? [{ url: primaryMedia, alt: prompt.title }] : [],
    },
    twitter: {
      card: primaryMedia ? "summary_large_image" : "summary",
      title,
      description,
      images: primaryMedia ? [primaryMedia] : [],
    },
  };
}

export default async function PromptDetailPage({ params }: PromptPageProps) {
  const { id } = await params;
  const promptId = Number(id);
  if (isNaN(promptId)) notFound();

  const prompt = getPromptById(promptId);
  if (!prompt) notFound();

  const primaryMedia = prompt.media_urls?.[0];

  // Schema.org structured data for search engines & AI citation engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: prompt.title,
    headline: prompt.title,
    description: prompt.description || `Generative AI prompt formula #${prompt.id}`,
    text: prompt.content,
    datePublished: prompt.source_published_at || prompt.created_at,
    dateCreated: prompt.created_at,
    keywords: prompt.tags.join(", "),
    image: primaryMedia || undefined,
    author: prompt.author_name
      ? {
          "@type": "Person",
          name: prompt.author_name,
          url: prompt.author_link || undefined,
        }
      : undefined,
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO ARCHIVE</span>
          </Link>

          <Link
            href="/"
            className="font-display font-extrabold text-lg tracking-tighter lowercase flex items-center"
          >
            yantraloka<span className="w-1.5 h-1.5 bg-accent inline-block ml-1"></span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb & ID Bar */}
        <div className="flex items-center justify-between font-mono text-xs text-muted mb-4 pb-2 hairline-b">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:underline">
              ARCHIVE
            </Link>
            <span>/</span>
            <span className="text-ink">PROMPT #{prompt.id}</span>
          </div>
          {prompt.has_arguments === 1 && (
            <div className="flex items-center gap-1.5 text-accent">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{prompt.argument_count} DYNAMIC ARGUMENTS</span>
            </div>
          )}
        </div>

        {/* Title & Metadata Strip */}
        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight tracking-tight">
            {prompt.title}
          </h1>

          {prompt.description && (
            <p className="mt-3 text-base sm:text-lg text-ink-secondary leading-relaxed max-w-3xl">
              {prompt.description}
            </p>
          )}

          {/* Meta Details Row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-muted pt-3 hairline-t">
            {prompt.author_name && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Author:</span>
                {prompt.author_link ? (
                  <a
                    href={prompt.author_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-accent underline flex items-center gap-1"
                  >
                    <span>{prompt.author_name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-ink">{prompt.author_name}</span>
                )}
              </div>
            )}

            {prompt.source_published_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Published: {new Date(prompt.source_published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            {prompt.source_link && (
              <a
                href={prompt.source_link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink underline flex items-center gap-1"
              >
                <span>Original Post</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Grid: Media + Formula */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Visual Preview Column (if present) */}
          {primaryMedia && (
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="relative aspect-[4/3] w-full bg-paper-3 hairline-all overflow-hidden">
                <img
                  src={primaryMedia}
                  alt={prompt.title}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="text-[11px] font-mono text-muted text-center">
                Visual generation preview from source
              </div>
            </div>
          )}

          {/* Formula & Extraction Column */}
          <div className={primaryMedia ? "lg:col-span-7 flex flex-col gap-6" : "lg:col-span-12 flex flex-col gap-6"}>
            {/* Prompt Formula Section (AI Extractable Passage) */}
            <section className="bg-paper-2 hairline-all p-5">
              <div className="flex items-center justify-between gap-4 mb-3 pb-3 hairline-b">
                <span className="font-mono text-xs uppercase tracking-widest text-muted">
                  Formula Content
                </span>
                <CopyButton text={prompt.content} />
              </div>

              <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-ink select-all bg-paper p-4 hairline-all overflow-x-auto">
                <code>{prompt.content}</code>
              </pre>
            </section>

            {/* Dynamic Arguments Table (if present) */}
            {prompt.arguments && prompt.arguments.length > 0 && (
              <section className="bg-paper hairline-all p-5">
                <div className="flex items-center gap-2 mb-3 pb-2 hairline-b">
                  <SlidersHorizontal className="w-4 h-4 text-accent" />
                  <h2 className="font-display font-bold text-sm uppercase tracking-wide text-ink">
                    Dynamic Arguments ({prompt.arguments.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="hairline-b text-muted uppercase">
                        <th className="py-2 pr-4">#</th>
                        <th className="py-2 pr-4">Argument Name</th>
                        <th className="py-2">Default Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {prompt.arguments.map((arg, idx) => (
                        <tr key={arg.id}>
                          <td className="py-2 pr-4 text-muted">{idx + 1}</td>
                          <td className="py-2 pr-4 font-semibold text-accent">{arg.name}</td>
                          <td className="py-2 text-ink break-words">
                            {arg.default_value ? `"${arg.default_value}"` : "(empty)"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Taxonomy Tags */}
            {prompt.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <TagIcon className="w-3.5 h-3.5 text-muted" />
                <span className="font-mono text-xs text-muted uppercase">Tags:</span>
                {prompt.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/?tag=${encodeURIComponent(tag.toLowerCase().replace(/\s+&\s+/g, "-").replace(/\s+/g, "-"))}`}
                    className="text-xs font-mono font-medium uppercase tracking-wider px-2 py-1 bg-paper-3 hairline-all text-ink hover:bg-ink hover:text-paper transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-paper hairline-t mt-16 py-6 text-center font-mono text-xs text-muted">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
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
