import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditService } from "./audit.service";

const fetchMock = vi.fn<typeof fetch>();

describe("auditService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("lists a page with from_seq and limit in the query string", async () => {
    fetchMock.mockResolvedValue(Response.json({ items: [], next_from_seq: null }));
    await auditService.list({ fromSeq: 50, limit: 50 });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/audit?from_seq=50&limit=50");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
  });

  it("omits empty query parameters when no options are given", async () => {
    fetchMock.mockResolvedValue(Response.json({ items: [], next_from_seq: null }));
    await auditService.list();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/audit");
  });

  it("starts a verification with POST and no body", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ job_id: "ver_1", status: "berjalan", from_seq: 1, checked: 0 }, { status: 202 }),
    );
    const result = await auditService.startVerify();
    expect(result).toMatchObject({ job_id: "ver_1", status: "berjalan" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/audit/verify");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });

  it("reads a verification job by id", async () => {
    fetchMock.mockResolvedValue(Response.json({ job_id: "ver_ABC123", status: "selesai", ok: true }));
    await auditService.verifyJob("ver_ABC123");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/audit/verify/ver_ABC123");
  });

  it("maps a forbidden verification to a forbidden error", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: { code: "PERAN_TIDAK_CUKUP" } }, { status: 403 }));
    await expect(auditService.startVerify()).rejects.toMatchObject({ kind: "forbidden", status: 403 });
  });
});
