import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Returns whether app is in demo mode (for UI banner). No secrets. */
export async function GET() {
  return NextResponse.json({ demoMode: isDemoMode() });
}
