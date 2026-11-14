import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logout } from "../../lib/auth-api";
import { authService } from "../../services/auth.service";
import { platformService } from "../../services/platform.service";
import { activeSection, describeHealth, useShellState } from "./use-shell-state.hook";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  pathname: "/cards/IC-20261110-003",
}));
vi.mock("../../lib/auth-api", () => ({ logout: vi.fn() }));
vi.mock("../../services/auth.service", () => ({ authService: { me: vi.fn() } }));
vi.mock("../../services/platform.service", () => ({ platformService: { health: vi.fn() } }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => nav.pathname,
}));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

describe("activeSection", () => {
  it("maps nested paths to the sidebar section", () => {
    expect(activeSection("/")).toBe("/");
    expect(activeSection("/cards/IC-1")).toBe("/cards");
    expect(activeSection("/digests")).toBe("/digests");
  });
});

describe("describeHealth", () => {
  it("covers loading, failure and the three service colours", () => {
    expect(describeHealth(undefined, true).tone).toBe("danger");
    expect(describeHealth(undefined, false).label).toBe("Memeriksa layanan…");
    const base = { layanan: {}, audit_tertunda: 0 };
    expect(describeHealth({ ...base, status: "hijau" }, false).tone).toBe("success");
    expect(describeHealth({ ...base, status: "kuning" }, false).tone).toBe("warning");
    expect(describeHealth({ ...base, status: "merah" }, false).tone).toBe("danger");
  });
});

describe("useShellState", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    nav.pathname = "/cards/IC-20261110-003";
    vi.mocked(authService.me).mockResolvedValue({
      user_id: "usr_1",
      roles: ["analis"],
      permissions: ["session"],
    });
    vi.mocked(platformService.health).mockResolvedValue({ status: "hijau", layanan: {}, audit_tertunda: 0 });
  });

  it("takes role and section from the session and the route, not from a preview picker", async () => {
    const { result } = renderHook(() => useShellState(), { wrapper });
    await waitFor(() => expect(result.current.session.role).toBe("analis"));
    expect(result.current.activePath).toBe("/cards");
    await waitFor(() => expect(result.current.status.label).toBe("Semua layanan normal"));
  });

  it("revokes the session before navigating to login", async () => {
    const { result } = renderHook(() => useShellState(), { wrapper });
    act(() => result.current.navigate("/digests"));
    await act(() => result.current.signOut());
    expect(logout).toHaveBeenCalledOnce();
    expect(nav.push).toHaveBeenCalledWith("/digests");
    expect(nav.replace).toHaveBeenCalledWith("/login");
    expect(nav.refresh).toHaveBeenCalledOnce();
  });

  it("keeps the current page and shows failed logout for retry", async () => {
    vi.mocked(logout).mockRejectedValueOnce(new Error("Layanan belum tersedia."));
    const { result } = renderHook(() => useShellState(), { wrapper });
    await act(() => result.current.signOut());
    expect(result.current.signOutError).toBe("Layanan belum tersedia.");
    expect(nav.replace).not.toHaveBeenCalled();
    await act(() => result.current.signOut());
    expect(nav.replace).toHaveBeenCalledWith("/login");
  });

  const me = (roles: string[], permissions: unknown) =>
    vi.mocked(authService.me).mockResolvedValue({ user_id: "usr_1", roles, permissions } as never);

  it.each([
    ["pimpinan", "/handover", ["session", "digests:read"]],
    ["pimpinan", "/cases", ["session", "digests:read"]],
    ["pimpinan", "/cases/DF-20261110-001", ["session", "digests:read"]],
    ["analis", "/users", ["session", "handover", "identities:own"]],
    ["dfir", "/users", ["session", "cases:read", "identities:own"]],
  ])("forbids %s on %s from the /auth/me permissions", async (role, pathname, permissions) => {
    nav.pathname = pathname;
    me([role], permissions);
    const { result } = renderHook(() => useShellState(), { wrapper });
    await waitFor(() => expect(result.current.session.user).not.toBeNull());
    expect(result.current.forbidden).toBe(true);
  });

  it.each([
    ["analis", "/handover", ["session", "handover"]],
    ["dfir", "/cases/DF-20261110-001", ["session", "cases:read"]],
    ["admin", "/users", ["session", "identities:admin"]],
    ["pimpinan", "/digests", ["session", "digests:read"]],
  ])("allows %s on %s", async (role, pathname, permissions) => {
    nav.pathname = pathname;
    me([role], permissions);
    const { result } = renderHook(() => useShellState(), { wrapper });
    await waitFor(() => expect(result.current.session.user).not.toBeNull());
    expect(result.current.forbidden).toBe(false);
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["a number", 7],
    ["an object", { handover: true }],
  ])("fails closed when permissions are %s", async (_label, permissions) => {
    nav.pathname = "/handover";
    me(["analis"], permissions);
    const { result } = renderHook(() => useShellState(), { wrapper });
    await waitFor(() => expect(result.current.session.user).not.toBeNull());
    expect(result.current.forbidden).toBe(true);
    expect(result.current.session.can("handover")).toBe(false);
  });

  it("follows the permissions of the next session after signing in again", async () => {
    nav.pathname = "/users";
    me(["analis"], ["session"]);
    const { result } = renderHook(() => useShellState(), { wrapper });
    await waitFor(() => expect(result.current.session.user).not.toBeNull());
    expect(result.current.forbidden).toBe(true);
    me(["admin"], ["session", "identities:admin"]);
    act(() => result.current.session.retry());
    await waitFor(() => expect(result.current.forbidden).toBe(false));
  });

  it("drops menu entries whose route the session may not open", async () => {
    me(["dfir"], ["session", "cards:read", "cases:read"]);
    const { result } = renderHook(() => useShellState(), { wrapper });
    await waitFor(() => expect(result.current.session.user).not.toBeNull());
    const menu = result.current.navigation.map((item) => item.href);
    expect(menu).toContain("/cases");
    expect(menu).toContain("/cards");
    expect(menu).not.toContain("/handover");
    expect(menu).not.toContain("/users");
  });
});
