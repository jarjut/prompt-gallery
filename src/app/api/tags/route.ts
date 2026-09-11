import { NextResponse } from "next/server";
import { getAllTags } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tags = getAllTags();
    return NextResponse.json(tags);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
