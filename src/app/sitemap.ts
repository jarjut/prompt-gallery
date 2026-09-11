import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yantraloka.com";
  const db = getDb();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  const rows = db
    .prepare(
      "SELECT id, created_at, source_published_at FROM prompts ORDER BY id ASC"
    )
    .all() as unknown as {
    id: number;
    created_at: string;
    source_published_at: string | null;
  }[];

  for (const row of rows) {
    entries.push({
      url: `${baseUrl}/prompts/${row.id}`,
      lastModified: row.source_published_at
        ? new Date(row.source_published_at)
        : new Date(row.created_at),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
