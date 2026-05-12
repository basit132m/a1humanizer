import { NextRequest, NextResponse } from "next/server";
import { isAdminKey, getAllKeys } from "@/lib/keys";

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") ?? "";
  if (!isAdminKey(adminKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const keys = getAllKeys();
  return NextResponse.json({ keys });
}
