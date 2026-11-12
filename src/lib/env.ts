/**
 * Runtime configuration. Nothing here is a secret: `NEXT_PUBLIC_*` values are bundled into the browser.
 * Leave `NEXT_PUBLIC_API_BASE_URL` empty to call the same origin (Caddy routes `/api/v1/*` to `api`).
 */
export const API_PREFIX = "/api/v1";

/** Origin of the API as seen by the browser, without a trailing slash. Empty string means same-origin. */
export function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

/** Cross-origin API calls need `credentials: "include"` so the HttpOnly session cookie travels. */
export function isCrossOriginApi(): boolean {
  return apiBaseUrl() !== "";
}

/** Request timeout for ordinary calls; uploads and report downloads pass their own value. */
export const DEFAULT_TIMEOUT_MS = 15_000;
