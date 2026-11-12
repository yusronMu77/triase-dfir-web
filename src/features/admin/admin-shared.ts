import { isApiError } from "../../lib/http/api-error";

/**
 * True when the api answers 404 for a route the upstream does not serve yet. The api maps every upstream 404
 * to the same generic "not found", so this cannot tell a missing route from a missing row. Use it only on
 * list and action calls where a 404 means "this feature is not wired up".
 */
export function isRouteUnavailable(error: unknown): boolean {
  return isApiError(error) && error.kind === "not-found";
}

const WIB = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

/** Formats an ISO timestamp for operators in WIB. Missing or invalid values show a dash. */
export function formatWaktu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const time = Date.parse(iso);
  return Number.isFinite(time) ? WIB.format(time) : "—";
}
