import { NextResponse } from "next/server";
import { fetchContainerLogs } from "@/lib/portainer";
import { isValidContainerId, sanitizeTail } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !isValidContainerId(id)) {
    return NextResponse.json({ error: "Invalid container id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const tail = sanitizeTail(url.searchParams.get("tail") ?? 200);

  const result = await fetchContainerLogs(id, tail);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status === 0 ? 503 : result.error.status }
    );
  }
  return NextResponse.json({ logs: result.data });
}
