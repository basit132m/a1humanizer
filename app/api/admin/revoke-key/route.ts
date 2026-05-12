import { NextRequest, NextResponse } from "next/server";
import { isAdminKey, revokeKey, deleteKey } from "@/lib/keys";

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") ?? "";
  if (!isAdminKey(adminKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { key, action } = (await req.json()) as { key: string; action?: "revoke" | "delete" };
  if (!key) {
    return NextResponse.json({ error: "Key required" }, { status: 400 });
  }
  const ok = action === "delete" ? deleteKey(key) : revokeKey(key);
  return NextResponse.json({ success: ok });
}
