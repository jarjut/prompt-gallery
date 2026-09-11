# Yantraloka (Prompt Gallery)

Archive and customization gallery for generative AI prompt formulas with taxonomy filtering, full-text search (SQLite FTS5), inline argument substitution, and clean one-click clipboard copying.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19
- **Database**: SQLite via Node.js native `node:sqlite` (`DatabaseSync`) with FTS5 search
- **Styling**: Tailwind CSS, Lucide icons
- **Runtime**: Node.js >= 22.5.0 (required for `node:sqlite`), Bun or npm

## Prerequisites

- Node.js >= 22.5.0
- Bun (recommended) or npm
- `data.db` (SQLite database containing prompts and tags in project root)

## Getting Started

1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start development server:
   ```bash
   bun run dev
   ```

   Open [http://localhost:3001](http://localhost:3001) in your browser.

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Base URL used for metadata, Open Graph, sitemap, and robots.txt | `http://localhost:3001` (dev) / `https://yantraloka.com` |

## Available Scripts

- `bun run dev`: Run development server on port 3001.
- `bun run build`: Build production bundle.
- `bun run start`: Start production server on port 3001.
- `node scripts/check-seo.mjs`: Verify SEO, Open Graph, sitemap, and Schema.org JSON-LD tags.

## Deployment Notes (Vercel)

- Requires Node.js 22.x runtime (`"engines": { "node": "22.x" }` in `package.json`).
- `next.config.mjs` configures `outputFileTracingIncludes` to package `data.db` with serverless function handlers.
- Set `NEXT_PUBLIC_SITE_URL` to your production domain in Vercel environment settings.
