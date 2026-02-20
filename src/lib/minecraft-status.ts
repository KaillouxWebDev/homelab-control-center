/**
 * Minecraft server list ping (status) with in-memory cache.
 * Internal API only — do not expose publicly.
 * SSRF-safe: host/port from env only (no query params).
 */

import { status } from "minecraft-server-util";

function getCacheMs(): number {
  const v = process.env.MINECRAFT_CACHE_MS?.trim();
  if (!v) return 4000;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 60000) : 4000;
}

function getHost(): string {
  return process.env.MINECRAFT_HOST?.trim() || "192.168.1.20";
}

function getPort(): number {
  const p = process.env.MINECRAFT_PORT?.trim();
  if (!p) return 25565;
  const n = parseInt(p, 10);
  return Number.isFinite(n) ? n : 25565;
}

function getTimeoutMs(): number {
  const t = process.env.MINECRAFT_TIMEOUT_MS?.trim();
  if (!t) return 1500;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10000) : 1500;
}

function normalizeError(e: unknown): "timeout" | "refused" | "unreachable" | string {
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  if (lower.includes("timeout") || lower.includes("timed out")) return "timeout";
  if (lower.includes("econnrefused") || lower.includes("refused")) return "refused";
  if (lower.includes("offline") || lower.includes("unreachable")) return "unreachable";
  return msg.slice(0, 80);
}

export type MinecraftStatusResult =
  | {
      ok: true;
      up: true;
      online: number;
      max: number;
      version: string;
      latencyMs: number;
      checkedAt: string;
    }
  | {
      ok: true;
      up: false;
      error: string;
      checkedAt: string;
    };

let cached: MinecraftStatusResult | null = null;
let cachedAt = 0;

export async function getMinecraftStatus(): Promise<MinecraftStatusResult> {
  const now = Date.now();
  const cacheMs = getCacheMs();
  if (cached && now - cachedAt < cacheMs) {
    return cached;
  }

  const host = getHost();
  const port = getPort();
  const timeoutMs = getTimeoutMs();
  const checkedAt = new Date().toISOString();

  const start = Date.now();
  try {
    const response = await status(host, port, { timeout: timeoutMs });
    const end = Date.now();
    const latencyMs = Math.round(end - start);
    const online = response.players?.online ?? 0;
    const max = response.players?.max ?? 0;
    const version = response.version?.name?.trim() ?? "—";

    cached = {
      ok: true,
      up: true,
      online,
      max,
      version,
      latencyMs,
      checkedAt,
    };
    cachedAt = now;
    return cached;
  } catch (e) {
    const error = normalizeError(e);
    cached = {
      ok: true,
      up: false,
      error,
      checkedAt,
    };
    cachedAt = now;
    return cached;
  }
}
