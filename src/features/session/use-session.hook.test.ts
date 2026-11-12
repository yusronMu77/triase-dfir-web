import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "../../services/auth.service";
import { primaryRole, useSession } from "./use-session.hook";

vi.mock("../../services/auth.service", () => ({ authService: { me: vi.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

describe("primaryRole", () => {
  it("picks the first known role by priority and ignores unknown ones", () => {
    expect(primaryRole(["analis", "admin"])).toBe("admin");
    expect(primaryRole(["pimpinan", "analis"])).toBe("analis");
    expect(primaryRole(["juru-kunci"])).toBeNull();
    expect(primaryRole([])).toBeNull();
  });
});

describe("useSession", () => {
  beforeEach(() => vi.resetAllMocks());

  it("exposes role and permissions from /auth/me", async () => {
    vi.mocked(authService.me).mockResolvedValue({
      user_id: "usr_1",
      roles: ["analis"],
      permissions: ["cards:read", "session"],
    });
    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.role).toBe("analis");
    expect(result.current.can("cards:read")).toBe(true);
    expect(result.current.can("config:write")).toBe(false);
  });

  it("surfaces the error so the shell can offer a retry", async () => {
    vi.mocked(authService.me).mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
  });
});
