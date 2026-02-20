import { NextResponse } from "next/server";
import { isDemoMode, getRequiredEnv, hasPortainerAuth, getPortainerBaseUrl, getPortainerEndpointId } from "@/lib/env";
import { getPortainerToken } from "@/lib/portainer";

export const dynamic = "force-dynamic";

export interface SetupStatus {
  demoMode: boolean;
  missingEnv: string[];
  authConfigured: boolean;
  portainerReachable: boolean;
  endpointValid: boolean;
}

export async function GET() {
  try {
    const demoMode = isDemoMode();
    if (demoMode) {
      return NextResponse.json<SetupStatus>({
        demoMode: true,
        missingEnv: [],
        authConfigured: true,
        portainerReachable: true,
        endpointValid: true,
      });
    }

    const required = getRequiredEnv();
    const missingEnv = required.missing;
    const authConfigured = hasPortainerAuth();

    if (!required.ok || !authConfigured) {
      return NextResponse.json<SetupStatus>({
        demoMode: false,
        missingEnv,
        authConfigured,
        portainerReachable: false,
        endpointValid: false,
      });
    }

    let portainerReachable = false;
    let endpointValid = false;

    try {
      const token = await getPortainerToken();
      portainerReachable = true;
      const baseUrl = getPortainerBaseUrl();
      const endpointId = getPortainerEndpointId();
      const res = await fetch(`${baseUrl}/api/endpoints/${endpointId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
      endpointValid = res.ok;
    } catch {
      // portainerReachable or endpointValid stays false
    }

    return NextResponse.json<SetupStatus>({
      demoMode: false,
      missingEnv,
      authConfigured,
      portainerReachable,
      endpointValid,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Setup check failed" },
      { status: 500 }
    );
  }
}
