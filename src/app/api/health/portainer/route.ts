import { NextResponse } from "next/server";
import {
  isDemoMode,
  getPortainerBaseUrl,
  getPortainerApiKey,
} from "@/lib/env";
import { getPortainerToken } from "@/lib/portainer";

export const dynamic = "force-dynamic";

type AuthMode = "demo" | "apiKey" | "jwt";

export async function GET() {
  const demo = isDemoMode();
  const baseUrl = getPortainerBaseUrl();

  let authMode: AuthMode = "jwt";
  let headers: Record<string, string> = {};

  try {
    if (demo) {
      authMode = "demo";
      return NextResponse.json({
        ok: true,
        authMode,
        portainerVersion: null,
      });
    }

    const apiKey = getPortainerApiKey();
    if (apiKey) {
      authMode = "apiKey";
      headers["X-API-Key"] = apiKey;
    } else {
      authMode = "jwt";
      const token = await getPortainerToken();
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const text = await res.text();
      const status = res.status;
      const message =
        text || (status === 401 || status === 403
          ? "Unauthorized"
          : res.statusText || "Portainer health check failed");
      return NextResponse.json(
        { ok: false, error: message, authMode },
        { status: 502 }
      );
    }

    // Portainer version isn't guaranteed here; set null for now.
    return NextResponse.json({
      ok: true,
      authMode,
      portainerVersion: null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const isTls =
      /cert|certificate|self signed|unable to verify/i.test(msg);

    return NextResponse.json(
      {
        ok: false,
        error: isTls
          ? "TLS certificate not accepted. Consider PORTAINER_INSECURE_TLS=true in trusted environments."
          : msg,
        authMode,
      },
      { status: 502 }
    );
  }
}

