import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/http/api-error";
import { channelsService } from "./channels.service";

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

describe("channelsService", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("reads policy and gateway status with GET /api/v1/channels", async () => {
    fetchMock.mockResolvedValue(json({ kebijakan: { items: [] }, status: null, bagian_tidak_tersedia: [] }));
    const result = await channelsService.list();
    expect(lastCall(fetchMock).url).toBe("/api/v1/channels");
    expect(result.bagian_tidak_tersedia).toEqual([]);
  });

  it("sends the policy body with if_version to PUT /channels/{channel_id}", async () => {
    fetchMock.mockResolvedValue(
      json({ channel_id: "telegram", active: true, max_detail: "sedang", version: 4 }),
    );
    await channelsService.putPolicy("telegram", { active: true, max_detail: "sedang", if_version: 3 });
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe("/api/v1/channels/telegram");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ active: true, max_detail: "sedang", if_version: 3 });
  });

  it("posts the test without a body to /channels/{channel_id}/test", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));
    const result = await channelsService.test("email");
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe("/api/v1/channels/email/test");
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    expect(result).toEqual({ ok: true });
  });

  it("reports a missing test route as not found, which the hook shows as unavailable", async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: "TIDAK_DITEMUKAN", message: "data tidak ditemukan" } }, { status: 404 }),
    );
    const error = await channelsService.test("telegram").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe("not-found");
  });
});
