import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, logout } from "./auth-api";

const fetchMock = vi.fn<typeof fetch>();
const user = { user_id: "u-1", username: "analis01", roles: ["analis"], permissions: ["session"] };

describe("cookie session API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("posts the exact JSON contract with same-origin cookies", async () => {
    fetchMock.mockResolvedValue(Response.json({ user }));
    expect(await login("analis01", " secret ")).toEqual({ user });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        body: JSON.stringify({ username: "analis01", password: " secret " }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it.each([
    [400, "Periksa"],
    [401, "Nama pengguna atau kata sandi salah"],
    [403, "ditolak"],
    [404, "belum tersedia"],
    [422, "Periksa"],
    [429, "Terlalu banyak"],
    [500, "belum tersedia"],
    [502, "belum tersedia"],
    [503, "belum tersedia"],
  ])("maps HTTP %s without exposing upstream details", async (status, message) => {
    fetchMock.mockResolvedValue(new Response("private upstream detail", { status: Number(status) }));
    await expect(login("user", "secret")).rejects.toThrow(String(message));
  });

  it.each([
    "<html>proxy failure</html>",
    "{}",
    '{"user":{"user_id":"u-1"}}',
    '{"user":{"user_id":"","roles":[],"permissions":[]}}',
  ])("rejects malformed success responses: %s", async (body) => {
    fetchMock.mockResolvedValue(new Response(body));
    await expect(login("user", "secret")).rejects.toThrow("Respons layanan tidak valid");
  });

  it("handles network failures", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(login("user", "secret")).rejects.toThrow("Periksa koneksi");
  });

  it("aborts a stalled request after 15 seconds", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );
    const assertion = expect(login("user", "secret")).rejects.toThrow("Permintaan terlalu lama");
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([204, 401])("accepts logout HTTP %s without requiring JSON", async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    await expect(logout()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
  });

  it("does not hide logout failures", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(logout()).rejects.toThrow("belum tersedia");
  });
});
