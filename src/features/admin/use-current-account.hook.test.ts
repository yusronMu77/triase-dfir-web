import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentAccount } from "./use-current-account.hook";

const session = vi.hoisted(() => ({
  user: null as null | { user_id: string; roles: string[]; permissions: string[]; reauth_at?: string | null },
  loading: false,
  error: null as unknown,
  retry: vi.fn(),
}));

vi.mock("../session/use-session.hook", () => ({
  useSession: () => ({
    user: session.user,
    loading: session.loading,
    error: session.error,
    retry: session.retry,
  }),
}));

describe("useCurrentAccount", () => {
  beforeEach(() => {
    session.user = null;
    session.loading = false;
    session.error = null;
  });

  it("maps the signed-in user into the account view", () => {
    session.user = { user_id: "usr_1", roles: ["dfir", "juru-kunci"], permissions: ["cards:read"] };
    const { result } = renderHook(() => useCurrentAccount());
    expect(result.current.account).toEqual({
      userId: "usr_1",
      roles: ["dfir"],
      permissionCount: 1,
      reauthLabel: "Belum dikonfirmasi ulang",
    });
  });

  it("has no account while the session is loading or failed", () => {
    session.loading = true;
    const loading = renderHook(() => useCurrentAccount());
    expect(loading.result.current.account).toBeNull();
    expect(loading.result.current.loading).toBe(true);

    session.loading = false;
    session.error = new Error("down");
    const failed = renderHook(() => useCurrentAccount());
    expect(failed.result.current.account).toBeNull();
    expect(failed.result.current.error).toBeTruthy();
  });
});
