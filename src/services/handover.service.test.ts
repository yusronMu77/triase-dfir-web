import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/http/api-error";
import { handoverService } from "./handover.service";

const fetchMock = vi.fn<typeof fetch>();

describe("handoverService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("reads the current draft", async () => {
    fetchMock.mockResolvedValue(Response.json({ catatan: "Draf", jumlah_terbuka: 1 }));
    const draft = await handoverService.current();
    expect(draft).toEqual({ catatan: "Draf", jumlah_terbuka: 1 });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/handover/current");
  });

  it("posts the handover as JSON and accepts an empty 201 body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));
    await expect(
      handoverService.save({ catatan: "Dua kartu masih terbuka", jumlah_terbuka: 2, shift: "malam" }),
    ).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/handover");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ catatan: "Dua kartu masih terbuka", jumlah_terbuka: 2, shift: "malam" }),
    });
  });

  it("maps a 404 draft (route not served upstream) to not-found without a message", async () => {
    fetchMock.mockResolvedValue(new Response("Not Found", { status: 404 }));
    const error = await handoverService.current().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, kind: "not-found" });
  });

  it("maps a 503 on save to the unavailable kind", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: { code: "TIDAK_TERSEDIA" } }, { status: 503 }));
    const error = await handoverService
      .save({ catatan: "x", jumlah_terbuka: 0, shift: "pagi" })
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 503, kind: "unavailable", retryable: true });
  });
});
