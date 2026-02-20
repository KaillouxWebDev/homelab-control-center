/**
 * Portainer CE API client.
 * - DEMO_MODE: returns mock data, no real calls.
 * - PORTAINER_API_KEY: use as Bearer token (no login).
 * - Else: login via POST /api/auth => JWT, cached with refresh.
 * - All requests: 5s timeout, optional insecure TLS.
 */

import {
  isDemoMode,
  getRequiredEnv,
  hasPortainerAuth,
  getPortainerBaseUrl,
  getPortainerEndpointId,
  getPortainerApiKey,
  getPortainerUsername,
  getPortainerPassword,
  applyInsecureTls,
} from "./env";

const TOKEN_REFRESH_MINUTES = 7;
const FETCH_TIMEOUT_MS = 5000;

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

type AuthMode = "apiKey" | "jwt";

let resolvedAuthMode: AuthMode | null = null;

// Apply insecure TLS once when module loads (server-side only).
if (typeof process !== "undefined") {
  applyInsecureTls();
}

function getBaseUrl(): string {
  return getPortainerBaseUrl();
}

function getEndpointId(): string {
  return getPortainerEndpointId();
}

function isTokenValid(): boolean {
  return !!cachedToken && Date.now() < tokenExpiresAt;
}

function resolveAuthMode(): AuthMode | null {
  if (isDemoMode()) return null;
  if (resolvedAuthMode) return resolvedAuthMode;

  const apiKey = getPortainerApiKey();
  const username = getPortainerUsername();
  const password = getPortainerPassword();

  if (apiKey && username && password) {
    // Guard: configuration error if both modes are set
    console.error(
      "[portainer] Both PORTAINER_API_KEY and PORTAINER_USERNAME/PORTAINER_PASSWORD are set. Configure only one auth mode."
    );
    throw new Error(
      "Portainer auth misconfigured: set either PORTAINER_API_KEY OR PORTAINER_USERNAME/PORTAINER_PASSWORD, not both."
    );
  }

  resolvedAuthMode = apiKey ? "apiKey" : "jwt";

  if (typeof console !== "undefined") {
    console.log(
      `[portainer] Auth mode: ${isDemoMode() ? "demo" : resolvedAuthMode}`
    );
  }

  return resolvedAuthMode;
}

export async function getPortainerToken(): Promise<string> {
  if (isDemoMode()) return "demo-token";
  const mode = resolveAuthMode();
  if (mode === "apiKey") {
    throw new Error("getPortainerToken() must not be called in API key mode");
  }
  if (isTokenValid()) return cachedToken!;

  const baseUrl = getBaseUrl();
  const username = getPortainerUsername();
  const password = getPortainerPassword();
  if (!username || !password) {
    throw new Error(
      "PORTAINER_USERNAME and PORTAINER_PASSWORD are required when PORTAINER_API_KEY is not set"
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      await res.text(); // consume body
      throw new Error(`Portainer auth failed: ${res.status}`);
    }

    const data = (await res.json()) as { jwt?: string };
    if (!data.jwt) throw new Error("Portainer auth: no JWT in response");

    cachedToken = data.jwt;
    tokenExpiresAt = Date.now() + TOKEN_REFRESH_MINUTES * 60 * 1000;
    return cachedToken;
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error) throw e;
    throw new Error("Portainer auth failed");
  }
}

export function clearPortainerToken(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

export type PortainerApiError = { status: number; message: string };

async function buildAuthHeaders(
  existing: HeadersInit | undefined
): Promise<{ headers: HeadersInit } | { error: PortainerApiError }> {
  if (isDemoMode()) {
    return { headers: existing ?? {} };
  }

  const mode = resolveAuthMode();

  // Start from existing headers (if any)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(existing as Record<string, string> | undefined),
  };

  if (mode === "apiKey") {
    const apiKey = getPortainerApiKey();
    if (!apiKey) {
      return {
        error: {
          status: 0,
          message: "PORTAINER_API_KEY is not set but apiKey mode was selected",
        },
      };
    }
    // Use Portainer API key header
    headers["X-API-Key"] = apiKey;
    delete headers.Authorization;
    return { headers };
  }

  // JWT mode
  try {
    const token = await getPortainerToken();
    headers.Authorization = `Bearer ${token}`;
    return { headers };
  } catch (e) {
    return {
      error: {
        status: 0,
        message: e instanceof Error ? e.message : "Auth failed",
      },
    };
  }
}

async function portainerFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T } | { error: PortainerApiError }> {
  const baseUrl = getBaseUrl();
  const endpointId = getEndpointId();
  const url = path.startsWith("http")
    ? path
    : `${baseUrl}${path.replace("{id}", endpointId)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const built = await buildAuthHeaders(options.headers);
    if ("error" in built) {
      clearTimeout(timeout);
      return { error: built.error };
    }

    const res = await fetch(url, {
      ...options,
      headers: built.headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 401) {
      clearPortainerToken();
      return { error: { status: 401, message: "Unauthorized" } };
    }

    const text = await res.text();
    if (!res.ok) {
      return {
        error: { status: res.status, message: text || res.statusText },
      };
    }

    const data = text ? (JSON.parse(text) as T) : ({} as T);
    return { data };
  } catch (e) {
    clearTimeout(timeout);
    const message = e instanceof Error ? e.message : "Network error";
    return { error: { status: 0, message } };
  }
}

// --- Types ---

export interface PortainerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  /** Set from list API when provided, or enriched from inspect (source of truth) */
  Health?: string;
  Ports?: Array<{
    PublicPort?: number;
    PrivatePort: number;
    Type: string;
  }>;
}

export interface ContainerInspect {
  Id: string;
  Name: string;
  State: {
    Status: string;
    Running: boolean;
    Health?: { Status?: string };
  };
  Config?: { Image?: string };
  NetworkSettings?: {
    Ports?: Record<string, Array<{ HostPort?: string }>>;
  };
}

// --- Demo mock data ---

const MOCK_CONTAINERS: PortainerContainer[] = [
  { Id: "demo-jellyfin", Names: ["/jellyfin"], Image: "jellyfin/jellyfin", State: "running", Status: "Up", Ports: [{ PublicPort: 8096, PrivatePort: 8096, Type: "tcp" }] },
  { Id: "demo-mc", Names: ["/mc"], Image: "itzg/minecraft-server", State: "running", Status: "Up", Ports: [{ PublicPort: 25565, PrivatePort: 25565, Type: "tcp" }] },
  { Id: "demo-pihole", Names: ["/pihole"], Image: "pihole/pihole", State: "running", Status: "Up", Ports: [{ PublicPort: 80, PrivatePort: 80, Type: "tcp" }] },
  { Id: "demo-portainer", Names: ["/portainer"], Image: "portainer/portainer-ce", State: "running", Status: "Up", Ports: [{ PublicPort: 9000, PrivatePort: 9000, Type: "tcp" }] },
  { Id: "demo-filebrowser", Names: ["/filebrowser"], Image: "filebrowser/filebrowser", State: "exited", Status: "Exited (0)", Ports: [] },
];

const MOCK_INSPECT: ContainerInspect = {
  Id: "demo-id",
  Name: "/jellyfin",
  State: { Status: "running", Running: true, Health: { Status: "healthy" } },
  Config: { Image: "jellyfin/jellyfin" },
  NetworkSettings: { Ports: { "8096/tcp": [{ HostPort: "8096" }] } },
};

const MOCK_LOGS = `[demo] 2024-01-15 10:00:00 INFO  Application started
[demo] 2024-01-15 10:00:01 INFO  Listening on 0.0.0.0:8096
[demo] 2024-01-15 10:00:02 INFO  Ready to accept connections
`;

function mockInspect(id: string): ContainerInspect {
  const c = MOCK_CONTAINERS.find((x) => x.Id === id);
  const name = c ? c.Names[0] ?? "/unknown" : "/unknown";
  const running = c?.State === "running";
  const health = name.includes("jellyfin") ? "healthy" : undefined;
  return {
    ...MOCK_INSPECT,
    Id: id,
    Name: name,
    State: { Status: running ? "running" : "exited", Running: running, Health: health ? { Status: health } : undefined },
  };
}

// --- Public API ---

export async function fetchContainers(): Promise<
  { data: PortainerContainer[] } | { error: PortainerApiError }
> {
  if (isDemoMode()) return { data: MOCK_CONTAINERS };

  const required = getRequiredEnv();
  if (!required.ok) {
    return { error: { status: 0, message: `Missing required config: ${required.missing.join(", ")}` } };
  }
  if (!hasPortainerAuth()) {
    return { error: { status: 0, message: "Portainer auth not configured (set PORTAINER_API_KEY or PORTAINER_USERNAME+PASSWORD)" } };
  }

  return portainerFetch<PortainerContainer[]>(`/api/endpoints/{id}/docker/containers/json?all=true`);
}

const INSPECT_CONCURRENCY = 5;
const INSPECT_ENRICH_MAX = 50;
/** Max ports per container in list response (dashboard cards show only these). */
const MAX_PORTS_PER_CONTAINER = 8;

/**
 * Fetch containers and enrich health from inspect (source of truth, same as Portainer UI).
 * Only running containers are enriched; concurrency and count are limited to avoid overload.
 * Ports are trimmed to the last MAX_PORTS_PER_CONTAINER so cards stay compact.
 */
export async function fetchContainersWithHealth(): Promise<
  { data: PortainerContainer[] } | { error: PortainerApiError }
> {
  const out = await fetchContainers();
  if ("error" in out) return out;
  const list = out.data;
  const running = list.filter((c) => c.State === "running").slice(0, INSPECT_ENRICH_MAX);
  if (running.length === 0) {
    trimPortsPerContainer(list);
    return { data: list };
  }

  const chunks: PortainerContainer[][] = [];
  for (let i = 0; i < running.length; i += INSPECT_CONCURRENCY) {
    chunks.push(running.slice(i, i + INSPECT_CONCURRENCY));
  }
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map((c) => fetchContainerInspect(c.Id))
    );
    results.forEach((res, i) => {
      if (res.status === "fulfilled" && "data" in res.value) {
        const health = res.value.data.State?.Health?.Status;
        if (health) {
          const c = list.find((x) => x.Id === chunk[i].Id);
          if (c) c.Health = health;
        }
      }
    });
  }
  trimPortsPerContainer(list);
  return { data: list };
}

function trimPortsPerContainer(list: PortainerContainer[]): void {
  for (const c of list) {
    const withPublic = (c.Ports ?? []).filter((p) => p.PublicPort);
    c.Ports = withPublic.slice(-MAX_PORTS_PER_CONTAINER);
  }
}

export async function fetchContainerInspect(
  containerId: string
): Promise<{ data: ContainerInspect } | { error: PortainerApiError }> {
  if (isDemoMode()) return { data: mockInspect(containerId) };

  const required = getRequiredEnv();
  if (!required.ok) return { error: { status: 0, message: `Missing: ${required.missing.join(", ")}` } };
  if (!hasPortainerAuth()) return { error: { status: 0, message: "Portainer auth not configured" } };

  return portainerFetch<ContainerInspect>(
    `/api/endpoints/{id}/docker/containers/${containerId}/json`
  );
}

export async function fetchContainerLogs(
  containerId: string,
  tail: number = 200
): Promise<{ data: string } | { error: PortainerApiError }> {
  if (isDemoMode()) return { data: MOCK_LOGS };

  const required = getRequiredEnv();
  if (!required.ok) return { error: { status: 0, message: `Missing: ${required.missing.join(", ")}` } };
  if (!hasPortainerAuth()) return { error: { status: 0, message: "Portainer auth not configured" } };

  const baseUrl = getBaseUrl();
  const endpointId = getEndpointId();
  const url = `${baseUrl}/api/endpoints/${endpointId}/docker/containers/${containerId}/logs?stdout=true&stderr=true&tail=${tail}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const built = await buildAuthHeaders(undefined);
    if ("error" in built) {
      clearTimeout(timeout);
      return { error: built.error };
    }

    const res = await fetch(url, {
      headers: built.headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 401) {
      clearPortainerToken();
      return { error: { status: 401, message: "Unauthorized" } };
    }
    if (!res.ok) {
      const text = await res.text();
      return { error: { status: res.status, message: text || res.statusText } };
    }

    const blob = await res.blob();
    const text = await blob.text();
    return { data: text };
  } catch (e) {
    clearTimeout(timeout);
    return { error: { status: 0, message: e instanceof Error ? e.message : "Network error" } };
  }
}

export async function containerAction(
  containerId: string,
  action: "start" | "stop" | "restart"
): Promise<{ ok: true } | { error: PortainerApiError }> {
  if (isDemoMode()) return { ok: true };

  const required = getRequiredEnv();
  if (!required.ok) return { error: { status: 0, message: `Missing: ${required.missing.join(", ")}` } };
  if (!hasPortainerAuth()) return { error: { status: 0, message: "Portainer auth not configured" } };

  const result = await portainerFetch<unknown>(
    `/api/endpoints/{id}/docker/containers/${containerId}/${action}`,
    { method: "POST" }
  );
  if ("error" in result) return { error: result.error };
  return { ok: true };
}
