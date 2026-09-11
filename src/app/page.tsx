import { getAllTags, searchPrompts } from "@/lib/db";
import { GalleryView } from "@/components/GalleryView";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const tags = getAllTags();
  const initialData = searchPrompts({ page: 1, limit: 24 });

  return <GalleryView initialData={initialData} tags={tags} />;
}
