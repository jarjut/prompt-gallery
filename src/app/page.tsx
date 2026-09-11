import { getAllTags, searchPrompts, getPromptById } from "@/lib/db";
import { GalleryView } from "@/components/GalleryView";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    tag?: string;
    q?: string;
    page?: string;
    prompt?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const tag = params.tag || "";
  const q = params.q || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const promptId = params.prompt ? Number(params.prompt) : null;

  const tags = getAllTags();
  const initialData = searchPrompts({ page, limit: 24, query: q, tag });
  const initialPrompt = promptId && !isNaN(promptId) ? getPromptById(promptId) : null;

  return (
    <GalleryView
      initialData={initialData}
      tags={tags}
      initialTag={tag}
      initialQuery={q}
      initialPage={page}
      initialPrompt={initialPrompt}
    />
  );
}
