import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { activeSection, useShellState } from "./use-shell-state.hook";

const nav = vi.hoisted(() => ({ push: vi.fn(), pathname: "/cards/IC-20261110-003" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => nav.pathname,
}));

describe("activeSection", () => {
  it("keeps the first path segment", () => {
    expect(activeSection("/")).toBe("/");
    expect(activeSection("/cards")).toBe("/cards");
    expect(activeSection("/cards/IC-20261110-003")).toBe("/cards");
  });
});

describe("useShellState", () => {
  beforeEach(() => {
    sessionStorage.clear();
    nav.push.mockClear();
  });

  it("starts as analyst and highlights the current section", () => {
    const { result } = renderHook(() => useShellState());
    expect(result.current.role).toBe("analis");
    expect(result.current.persona.name).toBe("Rizky Aditya");
    expect(result.current.activePath).toBe("/cards");
  });

  it("changes and remembers the preview role", () => {
    const { result } = renderHook(() => useShellState());
    act(() => result.current.setRole("admin"));
    expect(result.current.role).toBe("admin");
    expect(sessionStorage.getItem("astria-preview-role")).toBe("admin");
  });

  it("restores a stored role and ignores an invalid one", () => {
    sessionStorage.setItem("astria-preview-role", "dfir");
    const first = renderHook(() => useShellState());
    expect(first.result.current.role).toBe("dfir");
    sessionStorage.setItem("astria-preview-role", "juri");
    const second = renderHook(() => useShellState());
    expect(second.result.current.role).toBe("analis");
  });

  it("navigates and signs out through the router", () => {
    const { result } = renderHook(() => useShellState());
    act(() => result.current.navigate("/digests"));
    act(() => result.current.signOut());
    expect(nav.push.mock.calls).toEqual([["/digests"], ["/login"]]);
  });
});
