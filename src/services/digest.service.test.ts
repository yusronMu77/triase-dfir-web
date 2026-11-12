import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/http/api-error";
import { digestService } from "./digest.service";

const fetchMock = vi.fn<typeof fetch>();

describe("digestService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("lists digests with limit and cursor", async () => {
    fetchMock.mockImplementation(async () => Response.json({ items: [], next_cursor: null }));
    await digestService.list({ limit: 20, cursor: "DG-20261112-0700" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/digests?limit=20&cursor=DG-20261112-0700");
    await digestService.list({ limit: 20 });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/v1/digests?limit=20");
  });

  it("gets one digest by ID", async () => {
    fetchMock.mockResolvedValue(Response.json({ digest_id: "DG-20261112-0700", status: "terbit" }));
    const body = await digestService.get("DG-20261112-0700");
    expect(body.status).toBe("terbit");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/digests/DG-20261112-0700");
  });

  it("requests the document as a blob with format=html", async () => {
    fetchMock.mockResolvedValue(
      new Response("<h1>Digest</h1>", { headers: { "Content-Type": "text/html" } }),
    );
    const blob = await digestService.document("DG-20261112-0700");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/digests/DG-20261112-0700/document?format=html");
    expect(blob.size).toBe(new TextEncoder().encode("<h1>Digest</h1>").length);
    expect(blob.type).toMatch(/^text\/html/);
  });

  it("maps 409 on an unpublished document to a conflict error with its code", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: { code: "DIGEST_BELUM_TERBIT", message: "belum terbit" } }, { status: 409 }),
    );
    const error = await digestService.document("DG-20261112-0700").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, kind: "conflict", code: "DIGEST_BELUM_TERBIT" });
  });

  it("posts the run request as JSON and returns the parsed result", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { digest_id: "DG-20261112-0900", status: "terjadwal", terlambat: false },
        { status: 202 },
      ),
    );
    const result = await digestService.run({ jenis: "harian", alasan: "Uji" });
    expect(result.digest_id).toBe("DG-20261112-0900");
    const init = fetchMock.mock.calls[0]?.[1];
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/digests/run");
    expect(init).toMatchObject({
      method: "POST",
      headers: expect.any(Headers),
      body: JSON.stringify({ jenis: "harian", alasan: "Uji" }),
    });
  });

  it("maps 403 on the manual run to a forbidden error", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 }));
    const error = await digestService.run({ jenis: "harian" }).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 403, kind: "forbidden" });
  });
});
