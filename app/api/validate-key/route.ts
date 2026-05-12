import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json() as { key: string };

    if (!key || typeof key !== "string") {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const validKeys = (process.env.ACCESS_KEYS || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const isValid = validKeys.includes(key.trim());
    return NextResponse.json({ valid: isValid });
  } catch (err) {
    console.error("Validate key error:", err);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
