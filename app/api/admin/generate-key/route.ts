import { NextRequest, NextResponse } from "next/server";
import { isAdminKey, generateKey } from "@/lib/keys";

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") ?? "";
  if (!isAdminKey(adminKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { label } = (await req.json()) as { label?: string };
  const entry = generateKey(label ?? "");
  return NextResponse.json({ key: entry });
}
