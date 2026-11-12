import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/http/api-error";
import { configService } from "./config.service";

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const lastCall = (fetchMock: ReturnType<typeof vi.fn>) => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init };
};

describe("configService", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("lists effective settings with GET /api/v1/config", async () => {
    fetchMock.mockResolvedValue(json({ items: [] }));
    const result = await configService.list();
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe("/api/v1/config");
    expect(init.method).toBe("GET");
    expect(result).toEqual({ items: [] });
  });

  it("sends the value and the expected version in the body of PUT /config/{key}", async () => {
    fetchMock.mockResolvedValue(json({ key: "score.band", value: {}, source: "database", version: 3 }));
    await configService.putSetting("score.band", { value: { kritis: 70 }, if_version: 2 });
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe("/api/v1/config/score.band");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ value: { kritis: 70 }, if_version: 2 });
  });

  it("keeps the secret value in the body only, never in the URL, and does not log it", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    fetchMock.mockResolvedValue(json({ key: "model.api_key", terisi: true, version: 1 }));
    const result = await configService.putSecret("model.api_key", "rahasia-uji-123");
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe("/api/v1/config/secrets/model.api_key");
    expect(url).not.toContain("rahasia-uji-123");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ value: "rahasia-uji-123" });
    expect(JSON.stringify(result)).not.toContain("rahasia-uji-123");
    expect(log).not.toHaveBeenCalled();
    expect(debug).not.toHaveBeenCalled();
  });

  it("maps a 403 on a secret write to a forbidden error without echoing the value", async () => {
    fetchMock.mockResolvedValue(
      json(
        { error: { code: "DILARANG", message: "aksi ini tidak diizinkan", trace_id: "t-9" } },
        { status: 403 },
      ),
    );
    const error = await configService.putSecret("model.api_key", "rahasia-uji-123").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe("forbidden");
    expect((error as ApiError).traceId).toBe("t-9");
    expect((error as ApiError).message).not.toContain("rahasia-uji-123");
  });

  it("maps a 409 on a setting to a conflict so the form can reload", async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: "VERSI_KONFLIK", message: "data berubah" } }, { status: 409 }),
    );
    const error = await configService
      .putSetting("chat.allow_t2", { value: true, if_version: 1 })
      .catch((e: unknown) => e);
    expect((error as ApiError).kind).toBe("conflict");
  });

  it("encodes the key in the path", async () => {
    fetchMock.mockResolvedValue(json({ key: "a", value: 1, source: "bawaan", version: 0 }));
    await configService.putSetting("a/b?c", { value: 1, if_version: 0 });
    expect(lastCall(fetchMock).url).toBe("/api/v1/config/a%2Fb%3Fc");
  });
});
