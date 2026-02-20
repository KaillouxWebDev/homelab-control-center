/**
 * Server-side environment configuration.
 * Never import this file from client components or expose secrets to the client.
 */

const DEMO_MODE = process.env.DEMO_MODE === "true";
const PORTAINER_INSECURE_TLS = process.env.PORTAINER_INSECURE_TLS === "true";

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

export function getRequiredEnv(): { missing: string[]; ok: boolean } {
  if (DEMO_MODE) return { missing: [], ok: true };
  const required = ["PORTAINER_URL", "PORTAINER_ENDPOINT_ID"] as const;
  const missing = required.filter((key) => {
    const v = process.env[key];
    return v === undefined || v.trim() === "";
  });
  return { missing: [...missing], ok: missing.length === 0 };
}

/** When not in demo mode, either API key or username+password must be set. */
export function hasPortainerAuth(): boolean {
  if (DEMO_MODE) return true;
  if (process.env.PORTAINER_API_KEY?.trim()) return true;
  const u = process.env.PORTAINER_USERNAME?.trim();
  const p = process.env.PORTAINER_PASSWORD;
  return !!(u && p);
}

export function getPortainerBaseUrl(): string {
  const url = process.env.PORTAINER_URL?.trim();
  if (!url && !DEMO_MODE) throw new Error("PORTAINER_URL is required when not in demo mode");
  return (url ?? "http://localhost").replace(/\/$/, "");
}

export function getPortainerEndpointId(): string {
  const id = process.env.PORTAINER_ENDPOINT_ID?.trim();
  if (!id && !DEMO_MODE) throw new Error("PORTAINER_ENDPOINT_ID is required when not in demo mode");
  return id ?? "1";
}

export function getPortainerApiKey(): string | null {
  const key = process.env.PORTAINER_API_KEY?.trim();
  return key || null;
}

export function getPortainerUsername(): string | null {
  return process.env.PORTAINER_USERNAME?.trim() || null;
}

export function getPortainerPassword(): string | null {
  return process.env.PORTAINER_PASSWORD ?? null;
}

/** If true, allow self-signed TLS certs for Portainer (server-side only). */
export function isPortainerInsecureTls(): boolean {
  return PORTAINER_INSECURE_TLS;
}

/**
 * Call once at server startup if PORTAINER_INSECURE_TLS=true.
 * Avoid using in production with untrusted networks.
 */
export function applyInsecureTls(): void {
  if (isPortainerInsecureTls()) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}
