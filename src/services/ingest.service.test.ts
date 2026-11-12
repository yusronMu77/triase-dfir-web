import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/http/api-error";
import { ingestService } from "./ingest.service";

const fetchMock = vi.fn<typeof fetch>();
const jobId = "ING-20261112-0000ABCD";

describe("ingestService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("posts the path reference as JSON and returns the accepted job", async () => {
    const accepted = {
      job_id: jobId,
      source_id: "SRC-1",
      file_sha256: "a".repeat(64),
      status: "queued",
      created: true,
      stats: { total_lines: 3, valid: 0, blank: 0, rejected: 0, error_samples: [] },
    };
    fetchMock.mockResolvedValue(Response.json(accepted, { status: 202 }));
    const body = { adapter: "hayabusa", path_ref: "hayabusa/alert.jsonl" };

    expect(await ingestService.start(body)).toEqual(accepted);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/ingest",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
        credentials: "same-origin",
        redirect: "error",
      }),
    );
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("maps a rejected path to a validation error with the server code", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { code: "PATH_DITOLAK", message: "path di luar folder impor", trace_id: "t-1" } },
        { status: 422 },
      ),
    );
    const failure = await ingestService.start({ adapter: "hayabusa", path_ref: "x.json" }).catch((e) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({
      kind: "validation",
      status: 422,
      code: "PATH_DITOLAK",
      message: "path di luar folder impor",
      traceId: "t-1",
    });
  });

  it("reads one job with GET and an encoded id", async () => {
    fetchMock.mockResolvedValue(Response.json({ job_id: jobId, status: "running" }));
    await ingestService.job(jobId);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/ingest/jobs/${jobId}`,
      expect.objectContaining({ method: "GET" }),
    );

    fetchMock.mockResolvedValue(Response.json({ job_id: "x" }));
    await ingestService.job("a/b");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/ingest/jobs/a%2Fb");
  });

  it("reports a missing job as not-found and a forbidden read as forbidden", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: { code: "JOB_TIDAK_ADA" } }, { status: 404 }));
    await expect(ingestService.job(jobId)).rejects.toMatchObject({ kind: "not-found", status: 404 });

    fetchMock.mockResolvedValueOnce(Response.json({ error: { code: "AKSES_DITOLAK" } }, { status: 403 }));
    await expect(ingestService.job(jobId)).rejects.toMatchObject({ kind: "forbidden", status: 403 });
  });
});
