import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { login } from "../../lib/auth-api";
import { useLogin, validateLogin } from "./use-login.hook";

const nav = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
vi.mock("../../lib/auth-api", () => ({ login: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient() }, children);

function credentials() {
  const data = new FormData();
  data.set("username", " analis01 ");
  data.set("password", " secret with spaces ");
  return data;
}

describe("validateLogin", () => {
  it("validates the login contract without imposing password-creation rules", () => {
    expect(validateLogin("  ", "x")).toBe("Isi nama pengguna.");
    expect(validateLogin("rizky", "")).toBe("Isi kata sandi.");
    expect(validateLogin("rizky", "x")).toBe("");
    expect(validateLogin("x".repeat(129), "x")).not.toBe("");
    expect(validateLogin("rizky", "x".repeat(257))).not.toBe("");
  });
});

describe("useLogin", () => {
  beforeEach(() => vi.resetAllMocks());

  it("rejects empty credentials without requesting or navigating", async () => {
    const { result } = renderHook(() => useLogin(), { wrapper });
    await act(() => result.current.submit(new FormData()));
    expect(result.current.error).toBe("Isi nama pengguna.");
    expect(login).not.toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it.each([
    ["analis", "/"],
    ["pimpinan", "/digests"],
  ])("navigates %s only after API success, preserving the password", async (role, destination) => {
    vi.mocked(login).mockResolvedValue({ user: { user_id: "u-1", roles: [role], permissions: [] } });
    const { result } = renderHook(() => useLogin(), { wrapper });
    await act(() => result.current.submit(credentials()));
    expect(login).toHaveBeenCalledWith("analis01", " secret with spaces ");
    expect(nav.replace).toHaveBeenCalledWith(destination);
    expect(nav.refresh).toHaveBeenCalledOnce();
    expect(result.current.signedIn).toBe(true);
    expect(result.current.pending).toBe(true);
  });

  it("locks duplicate submissions and permits retry after failure", async () => {
    let reject!: (reason: Error) => void;
    vi.mocked(login).mockImplementation(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    const { result } = renderHook(() => useLogin(), { wrapper });
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.submit(credentials());
    });
    expect(result.current.pending).toBe(true);
    await act(() => result.current.submit(credentials()));
    expect(login).toHaveBeenCalledOnce();
    await act(async () => {
      reject(new Error("Nama pengguna atau kata sandi salah."));
      await pending;
    });
    expect(result.current.pending).toBe(false);
    expect(result.current.error).toContain("kata sandi salah");
    expect(nav.replace).not.toHaveBeenCalled();
    vi.mocked(login).mockResolvedValue({ user: { user_id: "u-1", roles: ["analis"], permissions: [] } });
    await act(() => result.current.submit(credentials()));
    expect(result.current.error).toBe("");
    expect(nav.replace).toHaveBeenCalledWith("/");
  });
});
