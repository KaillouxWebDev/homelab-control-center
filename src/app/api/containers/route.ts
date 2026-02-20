import { NextResponse } from "next/server";
import { fetchContainers } from "@/lib/portainer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result = await fetchContainers();
  if ("error" in result) {
    const { status, message } = result.error;
    let httpStatus = status === 0 ? 503 : status;

    // Heuristic: TLS / certificat
    if (
      status === 0 &&
      /cert|certificate|self signed|unable to verify/i.test(message)
    ) {
      httpStatus = 502;
    }

    return NextResponse.json({ error: message }, { status: httpStatus });
  }
  return NextResponse.json(result.data);
}
