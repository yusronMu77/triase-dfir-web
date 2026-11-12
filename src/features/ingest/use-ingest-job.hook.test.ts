import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { ingestService } from "../../services/ingest.service";
import type { IngestAccepted, IngestJob } from "../../services/ingest.types";
import { useIngestJob } from "./use-ingest-job.hook";

vi.mock("../../services/ingest.service", () => ({ ingestService: { start: vi.fn(), job: vi.fn() } }));
const session = vi.hoisted(() => ({ can: vi.fn((_permission: string) => true) }));
vi.mock("../session/use-session.hook", () => ({ useSession: () => session }));

// One client per test file, cleared before each test: a new client per render would reset the cache mid-test.
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client }, children);

const accepted: IngestAccepted = {
  job_id: "ING-20261112-0000ABCD",
  source_id: "SRC-1",
  file_sha256: "a".repeat(64),
  status: "queued",
  created: true,
  stats: { total_lines: 10, valid: 0, blank: 0, rejected: 0, error_samples: [] },
};

function job(status: IngestJob["status"], lastRecord = 0): IngestJob {
  return {
    job_id: accepted.job_id,
    source_id: "SRC-1",
    file_sha256: accepted.file_sha256,
    status,
    stats: { total_lines: 10, valid: 8, blank: 0, rejected: 0, error_samples: [] },
    last_record_no: lastRecord,
    error_code: null,
    created_at: null,
    started_at: null,
    finished_at: null,
  };
}

const fill = (result: { current: ReturnType<typeof useIngestJob> }, pathRef: string) =>
  act(() => result.current.setField("pathRef", pathRef));

describe("useIngestJob", () => {
  beforeEach(() => {
    client.clear();
    vi.mocked(ingestService.job).mockReset();
    session.can.mockReset();
    session.can.mockReturnValue(true);
  });

  it("starts idle with an empty form and exposes write permission", () => {
    const { result } = renderHook(() => useIngestJob(10), { wrapper });
    expect(result.current.form).toEqual({ pathRef: "", expectedSha256: "" });
    expect(result.current.jobId).toBeNull();
    expect(result.current.job).toBeNull();
    expect(result.current.canWrite).toBe(true);
    expect(session.can).toHaveBeenCalledWith("ingest:write");
  });

  it("reports the write permission as false for read-only roles", () => {
    session.can.mockReturnValue(false);
    const { result } = renderHook(() => useIngestJob(10), { wrapper });
    expect(result.current.canWrite).toBe(false);
  });

  it("blocks an invalid path without calling the service", () => {
    const { result } = renderHook(() => useIngestJob(10), { wrapper });
    fill(result, "../rahasia.json");
    act(() => result.current.submit());
    expect(result.current.errors.pathRef).toMatch(/'\.\.'/);
    expect(ingestService.start).not.toHaveBeenCalled();
  });

  it("sends only the path reference and follows the job until it completes", async () => {
    vi.mocked(ingestService.start).mockResolvedValue(accepted);
    vi.mocked(ingestService.job)
      .mockResolvedValueOnce(job("running", 4))
      .mockResolvedValue(job("completed", 10));
    const { result } = renderHook(() => useIngestJob(10), { wrapper });
    fill(result, "hayabusa/alert.jsonl");

    act(() => result.current.submit());
    // The mutation runs asynchronously, so wait for the service call instead of asserting at once.
    await waitFor(() =>
      expect(ingestService.start).toHaveBeenCalledWith({
        adapter: "hayabusa",
        path_ref: "hayabusa/alert.jsonl",
      }),
    );

    await waitFor(() => expect(result.current.job?.succeeded).toBe(true));
    expect(result.current.job?.progress).toBe(100);
    expect(ingestService.job).toHaveBeenCalledWith(accepted.job_id, expect.anything());

    // Polling stops at a final status: no further reads after completion.
    const reads = vi.mocked(ingestService.job).mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(vi.mocked(ingestService.job).mock.calls.length).toBe(reads);
  });

  it("shows a start failure inline and keeps no job", async () => {
    vi.mocked(ingestService.start).mockRejectedValue(
      new ApiError("path di luar folder impor", 422, "PATH_DITOLAK"),
    );
    const { result } = renderHook(() => useIngestJob(10), { wrapper });
    fill(result, "a.json");
    act(() => result.current.submit());
    await waitFor(() => expect(result.current.startError).toBeInstanceOf(ApiError));
    expect(result.current.jobId).toBeNull();
    expect(ingestService.job).not.toHaveBeenCalled();
  });

  it("stops polling after a failed read and exposes the error for a retry", async () => {
    vi.mocked(ingestService.start).mockResolvedValue(accepted);
    vi.mocked(ingestService.job).mockRejectedValue(new ApiError("", 503, undefined));
    const { result } = renderHook(() => useIngestJob(10), { wrapper });
    fill(result, "a.json");
    act(() => result.current.submit());
    await waitFor(() => expect(result.current.jobError).toBeInstanceOf(ApiError));
    const reads = vi.mocked(ingestService.job).mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(vi.mocked(ingestService.job).mock.calls.length).toBe(reads);
  });

  it("marks a repeated file as already imported", async () => {
    vi.mocked(ingestService.start).mockResolvedValue({ ...accepted, created: false, status: "completed" });
    vi.mocked(ingestService.job).mockResolvedValue(job("completed", 10));
    const { result } = renderHook(() => useIngestJob(10), { wrapper });
    fill(result, "a.json");
    act(() => result.current.submit());
    await waitFor(() => expect(result.current.job).not.toBeNull());
    expect(result.current.alreadyImported).toBe(true);
  });
});
