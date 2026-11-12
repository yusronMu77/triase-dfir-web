import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addRequestInterceptor, api, apiRequest, buildUrl, onUnauthorized } from "./api-client";
import { ApiError, describeError } from "./api-error";

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

function lastCall(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init, headers: new Headers(init.headers) };
}

describe("buildUrl", () => {
  it("prefixes /api/v1 and drops empty query values", () => {
    expect(buildUrl("/cards", { status: "baru", band: "", host: undefined, limit: 20, flag: false })).toBe(
      "/api/v1/cards?status=baru&limit=20&flag=false",
    );
    expect(buildUrl("/health")).toBe("/api/v1/health");
  });
});

describe("apiRequest", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    onUnauthorized(null);
    vi.unstubAllGlobals();
  });

  it("sends same-origin cookies, JSON headers and a JSON body, and never an Authorization header", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));
    const result = await api.post<{ ok: boolean }>("/cards/IC-1/events", { tipe: "comment", isi: "halo" });
    const { url, init, headers } = lastCall(fetchMock);
    expect(result).toEqual({ ok: true });
    expect(url).toBe("/api/v1/cards/IC-1/events");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(init.cache).toBe("no-store");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.has("Authorization")).toBe(false);
    expect(init.body).toBe(JSON.stringify({ tipe: "comment", isi: "halo" }));
  });

  it("normalizes the error body, trace id and Retry-After", async () => {
    fetchMock.mockResolvedValue(
      json(
        { error: { code: "TERLALU_BANYAK", message: "terlalu banyak permintaan", trace_id: "t-1" } },
        { status: 429, headers: { "Retry-After": "7" } },
      ),
    );
    const error = await apiRequest({ path: "/cards" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError).toMatchObject({
      status: 429,
      code: "TERLALU_BANYAK",
      traceId: "t-1",
      retryAfterSeconds: 7,
    });
    expect(apiError.kind).toBe("rate-limited");
    expect(describeError(apiError)).toContain("7 detik");
  });

  it("keeps extra fields of a 409 so the screen can reload the row version", async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: "VERSI_BENTROK", message: "x", row_version: 4 } }, { status: 409 }),
    );
    const error = (await api
      .patch("/cards/IC-1", { if_row_version: 3 })
      .catch((e: unknown) => e)) as ApiError;
    expect(error.kind).toBe("conflict");
    expect(error.extra).toEqual({ row_version: 4 });
  });

  it.each([
    [403, "forbidden", false],
    [404, "not-found", false],
    [422, "validation", false],
    [500, "server", true],
    [503, "unavailable", true],
  ])("maps HTTP %i to %s (retryable: %s) without throwing a raw error", async (status, kind, retryable) => {
    fetchMock.mockResolvedValue(new Response("<html>oops</html>", { status }));
    const error = (await apiRequest({ path: "/x" }).catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe(kind);
    expect(error.retryable).toBe(retryable);
    expect(describeError(error)).not.toContain("oops");
  });

  it("calls the unauthorized handler on 401 unless the caller opts out", async () => {
    const handler = vi.fn();
    onUnauthorized(handler);
    fetchMock.mockResolvedValue(
      json({ error: { code: "TIDAK_TERAUTENTIKASI", message: "x" } }, { status: 401 }),
    );
    await expect(apiRequest({ path: "/cards" })).rejects.toMatchObject({ kind: "unauthenticated" });
    expect(handler).toHaveBeenCalledOnce();
    await expect(apiRequest({ path: "/auth/reauth", handleUnauthorized: false })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(handler).toHaveBeenCalledOnce();
  });

  it("returns undefined for 204 and a blob for documents", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(api.delete("/identities/ID-1")).resolves.toBeUndefined();
    fetchMock.mockResolvedValueOnce(
      new Response("<p>laporan</p>", { status: 200, headers: { "Content-Type": "text/html" } }),
    );
    const blob = await apiRequest<Blob>({ path: "/cases/CS-1/report", as: "blob" });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe("<p>laporan</p>".length);
    expect(lastCall(fetchMock).headers.get("Accept")).toBe("*/*");
  });

  it("reports an unreadable success body as an invalid response", async () => {
    fetchMock.mockResolvedValue(new Response("not json", { status: 200 }));
    await expect(apiRequest({ path: "/cards" })).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("turns network failures and timeouts into friendly ApiErrors", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(apiRequest({ path: "/cards" })).rejects.toMatchObject({ kind: "network" });
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    const pending = apiRequest({ path: "/cards", timeoutMs: 50 }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(60);
    expect(await pending).toMatchObject({ kind: "timeout" });
    vi.useRealTimers();
  });

  it("lets the caller cancel without producing an ApiError", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    const pending = apiRequest({ path: "/cards", signal: controller.signal }).catch((e: unknown) => e);
    controller.abort();
    const error = await pending;
    expect(error).not.toBeInstanceOf(ApiError);
  });

  it("runs registered request interceptors after the base headers", async () => {
    fetchMock.mockImplementation(async () => json({}));
    const remove = addRequestInterceptor((plan) => {
      const headers = new Headers(plan.init.headers);
      headers.set("X-Request-Id", "r-1");
      return { ...plan, init: { ...plan.init, headers } };
    });
    await api.get("/health");
    remove();
    expect(lastCall(fetchMock).headers.get("X-Request-Id")).toBe("r-1");
    await api.get("/health");
    expect(lastCall(fetchMock).headers.has("X-Request-Id")).toBe(false);
  });
});

describe("describeError", () => {
  it("gives a safe generic message for non-ApiError values", () => {
    expect(describeError(new TypeError("secret stack"))).toBe(
      "Terjadi kesalahan tak terduga. Silakan coba lagi.",
    );
  });
});
