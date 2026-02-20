import { NextResponse } from "next/server";
import { containerAction } from "@/lib/portainer";
import { isValidContainerId } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !isValidContainerId(id)) {
    return NextResponse.json({ error: "Invalid container id" }, { status: 400 });
  }

  const result = await containerAction(id, "restart");
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status === 0 ? 503 : result.error.status }
    );
  }
  return NextResponse.json({ ok: true });
}
