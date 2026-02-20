/**
 * Server-side only: load optional config/services.yml for Open URLs.
 * Do not import from client code.
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface ServiceOpenEntry {
  openUrl: string | null;
  label?: string;
}

export type ServicesConfig = Record<string, ServiceOpenEntry>;

const BUILTIN: ServicesConfig = {
  jellyfin: { openUrl: "https://jellyfin.home", label: "Jellyfin" },
  pihole: { openUrl: "http://pihole.home", label: "Pi-hole" },
  caddy: { openUrl: "https://home", label: "Caddy" },
  portainer: { openUrl: "https://portainer.home", label: "Portainer" },
  filebrowser: { openUrl: "https://files.home", label: "FileBrowser" },
  netdata: { openUrl: "https://netdata.home", label: "Netdata" },
  mc: { openUrl: "https://mc.home", label: "Minecraft" },
};

let cached: ServicesConfig | null = null;

function configPath(): string {
  return path.join(process.cwd(), "config", "services.yml");
}

export function getServicesConfig(): ServicesConfig {
  if (cached) return cached;

  try {
    const p = configPath();
    if (!fs.existsSync(p)) {
      cached = BUILTIN;
      return cached;
    }
    const raw = fs.readFileSync(p, "utf8");
    const parsed = yaml.load(raw) as { services?: Record<string, { openUrl?: string | null; label?: string }> } | null;
    if (!parsed?.services || typeof parsed.services !== "object") {
      cached = BUILTIN;
      return cached;
    }
    const result: ServicesConfig = {};
    for (const [key, val] of Object.entries(parsed.services)) {
      if (val && typeof val === "object") {
        const openUrl = val.openUrl === null || val.openUrl === undefined ? null : String(val.openUrl);
        result[key.toLowerCase()] = { openUrl, label: val.label ? String(val.label) : undefined };
      }
    }
    cached = Object.keys(result).length ? result : BUILTIN;
    return cached;
  } catch {
    cached = BUILTIN;
    return cached;
  }
}

/** Resolve open URL for a container name (server-side). */
export function resolveOpenUrl(containerName: string): { url: string; label?: string } | null {
  const config = getServicesConfig();
  const normalized = containerName.replace(/^\//, "").toLowerCase();
  for (const [key, entry] of Object.entries(config)) {
    if (entry.openUrl && normalized.includes(key)) {
      return { url: entry.openUrl, label: entry.label };
    }
  }
  return null;
}
