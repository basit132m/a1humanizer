import { NextRequest, NextResponse } from "next/server";
import { humanizeText } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { text, level } = await req.json() as { text: string; level: number };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!level || level < 1 || level > 10) {
      return NextResponse.json(
        { error: "Level must be between 1 and 10" },
        { status: 400 }
      );
    }

    const result = await humanizeText(text.trim(), level);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("Humanize error:", err);
    return NextResponse.json(
      { error: "Failed to humanize text. Please try again." },
      { status: 500 }
    );
  }
}
