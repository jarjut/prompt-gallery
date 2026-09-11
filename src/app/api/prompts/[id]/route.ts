import { NextRequest, NextResponse } from "next/server";
import { getPromptById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const promptId = parseInt(resolvedParams.id, 10);
    if (isNaN(promptId)) {
      return NextResponse.json({ error: "Invalid prompt ID" }, { status: 400 });
    }

    const prompt = getPromptById(promptId);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
