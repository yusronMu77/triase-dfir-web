import { astriaNavigation } from "@astria/ui";
import { describe, expect, it } from "vitest";
import type { Permission } from "../../services/auth.types";
import { canOpenRoute, ROUTE_PERMISSIONS, requiredPermission, routeSection } from "./route-access";

const holding =
  (...held: Permission[]) =>
  (permission: Permission) =>
    held.includes(permission);

describe("routeSection", () => {
  it("maps nested paths to their first segment", () => {
    expect(routeSection("/")).toBe("/");
    expect(routeSection("/cases/DF-20261110-001")).toBe("/cases");
    expect(routeSection("/users/")).toBe("/users");
  });
});

describe("requiredPermission", () => {
  it("maps the guarded routes to the permission the api asks for", () => {
    expect(ROUTE_PERMISSIONS).toEqual({
      "/handover": "handover",
      "/cases": "cases:read",
      "/users": "identities:admin",
    });
    expect(requiredPermission("/handover")).toBe("handover");
    expect(requiredPermission("/cases")).toBe("cases:read");
    expect(requiredPermission("/cases/DF-20261110-001")).toBe("cases:read");
    expect(requiredPermission("/users")).toBe("identities:admin");
  });
  it("leaves other routes unguarded and ignores inherited object keys", () => {
    expect(requiredPermission("/")).toBeNull();
    expect(requiredPermission("/digests")).toBeNull();
    expect(requiredPermission("/constructor")).toBeNull();
    expect(requiredPermission("/__proto__")).toBeNull();
  });
  it("guards only routes that exist in the navigation", () => {
    const hrefs = astriaNavigation.map((item) => item.href);
    for (const route of Object.keys(ROUTE_PERMISSIONS)) expect(hrefs).toContain(route);
  });
});

describe("canOpenRoute", () => {
  it("opens a guarded route only with its permission", () => {
    expect(canOpenRoute("/handover", holding("handover"))).toBe(true);
    expect(canOpenRoute("/handover", holding("session", "digests:read"))).toBe(false);
    expect(canOpenRoute("/cases/DF-1", holding("cases:read"))).toBe(true);
    expect(canOpenRoute("/cases", holding("cards:read"))).toBe(false);
    expect(canOpenRoute("/users", holding("identities:admin"))).toBe(true);
    expect(canOpenRoute("/users", holding("identities:own"))).toBe(false);
  });
  it("fails closed without permissions and keeps unguarded routes open", () => {
    expect(canOpenRoute("/users", holding())).toBe(false);
    expect(canOpenRoute("/digests", holding())).toBe(true);
  });
});
