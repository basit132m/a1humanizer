import { NextRequest, NextResponse } from "next/server";
import { humanizeText, StylePreset, TonePreset, PurposePreset } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { text, level, style, tone, purpose } = (await req.json()) as {
      text: string;
      level: number;
      style?: StylePreset;
      tone?: TonePreset;
      purpose?: PurposePreset;
    };

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    if (!level || level < 1 || level > 10) {
      return NextResponse.json({ error: "Level must be 1–10" }, { status: 400 });
    }

    const result = await humanizeText(
      text.trim(),
      level,
      style ?? "humanize",
      tone ?? "auto",
      purpose ?? "general"
    );

    return NextResponse.json({ result });
  } catch (err) {
    console.error("Humanize error:", err);
    return NextResponse.json(
      { error: "Failed to humanize text. Please try again." },
      { status: 500 }
    );
  }
}
