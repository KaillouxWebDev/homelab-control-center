/**
 * Client-side: resolve "Open" URL from a map returned by GET /api/services.
 * The map is loaded from optional config/services.yml on the server (or built-in defaults).
 */

export interface ServiceOpenConfig {
  url: string;
  label?: string;
}

export type ServicesMap = Record<string, ServiceOpenConfig>;

/**
 * Resolve open URL for a container by name from the services map (from API).
 * If no map or no match, returns null. Optionally fallback to host:port when baseUrl is set.
 */
export function getServiceOpenUrlFromMap(
  containerName: string,
  servicesMap: ServicesMap | undefined | null,
  port?: number,
  baseUrl?: string
): ServiceOpenConfig | null {
  if (servicesMap && typeof servicesMap === "object") {
    const normalized = containerName.replace(/^\//, "").toLowerCase();
    for (const [key, config] of Object.entries(servicesMap)) {
      if (config?.url && normalized.includes(key)) {
        return { url: config.url, label: config.label };
      }
    }
  }

  if (port && baseUrl) {
    try {
      const u = new URL(baseUrl);
      return { label: `Open :${port}`, url: `${u.protocol}//${u.hostname}:${port}` };
    } catch {
      return null;
    }
  }

  return null;
}
