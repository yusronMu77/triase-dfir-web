import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiError } from "../lib/http/api-error";
import { identitiesService } from "./identities.service";

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

describe("identitiesService", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("lists bindings with GET /api/v1/identities", async () => {
    fetchMock.mockResolvedValue(json({ items: [] }));
    await identitiesService.list();
    expect(lastCall(fetchMock).url).toBe("/api/v1/identities");
  });

  it("revokes with DELETE and accepts 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(identitiesService.revoke("idn_1")).resolves.toBeUndefined();
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe("/api/v1/identities/idn_1");
    expect(init.method).toBe("DELETE");
  });

  it("maps a 404 on another user's binding to not found", async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: "TIDAK_DITEMUKAN", message: "data tidak ditemukan" } }, { status: 404 }),
    );
    const error = await identitiesService.revoke("idn_other").catch((e: unknown) => e);
    expect((error as ApiError).kind).toBe("not-found");
  });

  it("sends an empty JSON object when no channel is chosen, because the api requires a body", async () => {
    fetchMock.mockResolvedValue(
      json({ code: "ABCD2345", expires_at: "2026-11-12T10:00:00Z" }, { status: 201 }),
    );
    await identitiesService.issuePairingCode({});
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe("/api/v1/identities/pairing-codes");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({});
  });

  it("sends the chosen channel in the pairing request", async () => {
    fetchMock.mockResolvedValue(
      json({ code: "ABCD2345", channel: "telegram", expires_at: "2026-11-12T10:00:00Z" }, { status: 201 }),
    );
    await identitiesService.issuePairingCode({ channel: "telegram" });
    expect(JSON.parse(lastCall(fetchMock).init.body as string)).toEqual({ channel: "telegram" });
  });
});
