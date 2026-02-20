import { NextResponse } from "next/server";
import { getMinecraftStatus } from "@/lib/minecraft-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getMinecraftStatus();
  return NextResponse.json(result, { status: 200 });
}
