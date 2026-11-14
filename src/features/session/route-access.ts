import type { Permission } from "../../services/auth.types";

/**
 * Permission a session needs before a screen may render, by first path segment (`/cases/DF-1` is `/cases`).
 * Listed here are the screens that make no permission-checked api call on load, so an api 403 never shows
 * "Akses ditolak" for them. The permissions are the ones the api asks for the same data (`api` `Perm`).
 */
export const ROUTE_PERMISSIONS: Readonly<Record<string, Permission>> = {
  "/handover": "handover",
  "/cases": "cases:read",
  "/users": "identities:admin",
};

/** First path segment, so `/cards/IC-1` belongs to `/cards`. */
export function routeSection(pathname: string) {
  const [first] = pathname.split("/").filter(Boolean);
  return first ? `/${first}` : "/";
}

export function requiredPermission(pathname: string): Permission | null {
  const section = routeSection(pathname);
  return Object.hasOwn(ROUTE_PERMISSIONS, section) ? (ROUTE_PERMISSIONS[section] ?? null) : null;
}

/** False when the route needs a permission the session does not hold. Routes without an entry stay open. */
export function canOpenRoute(pathname: string, can: (permission: Permission) => boolean) {
  const required = requiredPermission(pathname);
  return required === null || can(required);
}
