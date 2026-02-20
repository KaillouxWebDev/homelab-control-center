import { NextResponse } from "next/server";
import { fetchContainerInspect } from "@/lib/portainer";
import { isValidContainerId } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !isValidContainerId(id)) {
    return NextResponse.json({ error: "Invalid container id" }, { status: 400 });
  }

  const result = await fetchContainerInspect(id);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status === 0 ? 503 : result.error.status }
    );
  }
  return NextResponse.json(result.data);
}
