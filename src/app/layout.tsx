import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yantraloka.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "YANTRALOKA // Generative AI Prompt Formula Archive",
    template: "%s | Yantraloka",
  },
  description:
    "Curated open archive of 15,600+ generative AI prompt formulas with interactive dynamic variable substitution for Midjourney, Flux, and Stable Diffusion.",
  keywords: [
    "AI prompt formulas",
    "generative AI prompts",
    "Midjourney prompts",
    "Flux prompts",
    "Stable Diffusion prompts",
    "prompt engineering",
    "dynamic prompts",
  ],
  authors: [{ name: "jarjut.dev", url: "https://jarjut.dev" }],
  creator: "jarjut.dev",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "YANTRALOKA // Generative AI Prompt Formula Archive",
    description:
      "Curated open archive of 15,600+ generative AI prompt formulas with interactive dynamic variable substitution.",
    url: siteUrl,
    siteName: "Yantraloka",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YANTRALOKA // Generative AI Prompt Formula Archive",
    description:
      "Curated open archive of 15,600+ generative AI prompt formulas with interactive dynamic variable substitution.",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-paper text-ink font-body selection:bg-accent selection:text-accent-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Yantraloka",
              url: siteUrl,
              description:
                "Curated open archive of 15,600+ generative AI prompt formulas with interactive dynamic variable substitution.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteUrl}/?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
