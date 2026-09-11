import { NextRequest, NextResponse } from "next/server";
import { searchPrompts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const tag = searchParams.get("tag") ?? "";
    const hasArgsOnly = searchParams.get("argsOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "24", 10) || 24));

    const result = searchPrompts({
      query,
      tag,
      hasArgsOnly,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
