import { NextRequest, NextResponse } from "next/server";
import { detectAI } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const result = await detectAI(text.trim());
    return NextResponse.json({ result });
  } catch (err) {
    console.error("Detect error:", err);
    return NextResponse.json(
      { error: "Failed to analyze text. Please try again." },
      { status: 500 }
    );
  }
}
