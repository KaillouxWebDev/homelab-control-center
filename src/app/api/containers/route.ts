import { NextResponse } from "next/server";
import { fetchContainers } from "@/lib/portainer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result = await fetchContainers();
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status === 0 ? 503 : result.error.status }
    );
  }
  return NextResponse.json(result.data);
}
