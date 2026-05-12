import { NextRequest, NextResponse } from "next/server";
import { isValidKey, isAdminKey } from "@/lib/keys";

export async function POST(req: NextRequest) {
  try {
    const { key } = (await req.json()) as { key: string };
    if (!key || typeof key !== "string") {
      return NextResponse.json({ valid: false, isAdmin: false }, { status: 400 });
    }
    const valid = isValidKey(key);
    const admin = valid ? isAdminKey(key) : false;
    return NextResponse.json({ valid, isAdmin: admin });
  } catch {
    return NextResponse.json({ valid: false, isAdmin: false }, { status: 500 });
  }
}
