import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/http/api-error";
import { caseService } from "./case.service";

const fetchMock = vi.fn<typeof fetch>();

describe("caseService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("gets a case by ID under /api/v1 with same-origin cookies and no cache", async () => {
    fetchMock.mockResolvedValue(Response.json({ case_id: "CS-20261112-001", status: "diminta" }));
    const body = await caseService.get("CS-20261112-001");
    expect(body).toEqual({ case_id: "CS-20261112-001", status: "diminta" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/cases/CS-20261112-001",
      expect.objectContaining({
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
      }),
    );
  });

  it("sends cursor and limit as query parameters and omits empty ones", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({ case_id: "CS-20261112-001", status: "diminta", items: [], next_cursor: null }),
    );
    await caseService.timeline("CS-20261112-001", { cursor: "TL-20261112-001-00002", limit: 50 });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/v1/cases/CS-20261112-001/timeline?cursor=TL-20261112-001-00002&limit=50",
    );
    await caseService.timeline("CS-20261112-001", { limit: 50 });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/v1/cases/CS-20261112-001/timeline?limit=50");
  });

  it("gets the custody chain of a case under /api/v1 with the ID encoded", async () => {
    const custody = { case_id: "CS-20261112-001", entries: [], chain_ok: true };
    fetchMock.mockResolvedValue(Response.json(custody));
    const body = await caseService.custody("CS-20261112-001");
    expect(body).toEqual(custody);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/cases/CS-20261112-001/custody");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "GET", credentials: "same-origin" });
  });

  it("requests the report as a blob with format=html and returns the raw body", async () => {
    fetchMock.mockResolvedValue(
      new Response("<h1>Laporan</h1>", { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    );
    const blob = await caseService.report("CS-20261112-001");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/cases/CS-20261112-001/report?format=html");
    expect(Object.prototype.toString.call(blob)).toBe("[object Blob]"); // not instanceof: jsdom and Node have different Blob classes
    expect(blob.size).toBe(new TextEncoder().encode("<h1>Laporan</h1>").length);
    expect(blob.type).toMatch(/^text\/html/);
  });

  it("maps a 409 without a report to a conflict error that keeps the code", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { code: "LAPORAN_BELUM_ADA", message: "laporan belum ada", trace_id: "t-1" } },
        { status: 409 },
      ),
    );
    const error = await caseService.report("CS-20261112-001").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, kind: "conflict", code: "LAPORAN_BELUM_ADA", traceId: "t-1" });
  });

  it("maps a 404 with a non-JSON upstream body without leaking its text", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Not Found dari layanan dfir</html>", { status: 404 }));
    const error = await caseService.get("CS-20261112-999").catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 404, kind: "not-found" });
    expect((error as ApiError).message).toBe("");
  });
});
