import { NextResponse } from "next/server";
import { getServicesConfig } from "@/lib/services-config";

export const dynamic = "force-dynamic";

/** Returns safe open URL map for UI (no secrets). */
export async function GET() {
  try {
    const config = getServicesConfig();
    const safe: Record<string, { url: string; label?: string }> = {};
    for (const [key, entry] of Object.entries(config)) {
      if (entry.openUrl) safe[key] = { url: entry.openUrl, label: entry.label };
    }
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({});
  }
}
