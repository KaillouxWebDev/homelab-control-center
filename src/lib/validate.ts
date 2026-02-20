/**
 * Input validation for API routes. Keeps errors safe (no internal details).
 */

const CONTAINER_ID_REGEX = /^[a-f0-9]{12,64}$|^demo-[a-z0-9-]+$/i;

export function isValidContainerId(id: string): boolean {
  return typeof id === "string" && id.length <= 128 && CONTAINER_ID_REGEX.test(id.trim());
}

export function sanitizeTail(tail: unknown): number {
  if (typeof tail === "string") {
    const n = parseInt(tail, 10);
    if (Number.isFinite(n) && n >= 50 && n <= 1000) return n;
  }
  if (typeof tail === "number" && Number.isFinite(tail) && tail >= 50 && tail <= 1000) return tail;
  return 200;
}
