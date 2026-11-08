import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLogin, validateLogin } from "./use-login.hook";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("validateLogin", () => {
  it("asks for both fields", () => {
    expect(validateLogin("", "x")).toBe("Isi nama pengguna.");
    expect(validateLogin("rizky", "")).toBe("Isi kata sandi.");
    expect(validateLogin("rizky", "x")).toBe("");
  });
});

describe("useLogin", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("rejects empty credentials without navigating", async () => {
    const { result } = renderHook(() => useLogin());
    await expect(result.current.submit(new FormData())).rejects.toThrow("Isi nama pengguna.");
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates home after a valid preview sign-in", async () => {
    const { result } = renderHook(() => useLogin());
    const data = new FormData();
    data.set("username", "rizky");
    data.set("password", "rahasia");
    await act(async () => {
      const pending = result.current.submit(data);
      await vi.advanceTimersByTimeAsync(600);
      await pending;
    });
    expect(push).toHaveBeenCalledWith("/");
  });
});
