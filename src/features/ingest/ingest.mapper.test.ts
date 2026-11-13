import { describe, expect, it } from "vitest";
import type { IngestJob } from "../../services/ingest.types";
import { buildIngestRequest, EMPTY_INGEST_FORM, isTerminalJobStatus, toJobView } from "./ingest.mapper";

const base: IngestJob = {
  job_id: "ING-20261112-0000ABCD",
  source_id: "SRC-1",
  file_sha256: "b".repeat(64),
  status: "running",
  stats: {
    total_lines: 200,
    valid: 40,
    blank: 2,
    rejected: 1,
    error_samples: [{ record_no: 9, code: "BARIS_RUSAK" }],
  },
  last_record_no: 50,
  error_code: null,
  created_at: "2026-11-12T01:00:00Z",
  started_at: "2026-11-12T01:00:01Z",
  finished_at: null,
};

describe("isTerminalJobStatus", () => {
  it("treats completed, completed_with_errors and failed as final", () => {
    expect(isTerminalJobStatus("completed")).toBe(true);
    expect(isTerminalJobStatus("completed_with_errors")).toBe(true);
    expect(isTerminalJobStatus("failed")).toBe(true);
  });
  it("keeps queued and running open, and treats a missing status as open", () => {
    expect(isTerminalJobStatus("queued")).toBe(false);
    expect(isTerminalJobStatus("running")).toBe(false);
    expect(isTerminalJobStatus(undefined)).toBe(false);
  });
});

describe("toJobView", () => {
  it("estimates progress from the last record and the total lines while running", () => {
    const view = toJobView(base);
    expect(view.progress).toBe(25);
    expect(view.terminal).toBe(false);
    expect(view.succeeded).toBe(false);
    expect(view.tone).toBe("info");
    expect(view.statusLabel).toBe("Sedang diimpor");
    expect(view.valid).toBe(40);
    expect(view.errorSamples).toEqual([{ recordNo: 9, code: "BARIS_RUSAK" }]);
  });

  it("is indeterminate while running when the total is unknown", () => {
    expect(toJobView({ ...base, stats: {} }).progress).toBeNull();
  });

  it("caps the running estimate at 99 so only a final status shows 100", () => {
    expect(toJobView({ ...base, last_record_no: 200 }).progress).toBe(99);
  });

  it("marks a completed job as succeeded at 100 percent", () => {
    const view = toJobView({ ...base, status: "completed", last_record_no: 200 });
    expect(view).toMatchObject({ progress: 100, terminal: true, succeeded: true, tone: "success" });
    expect(view.statusLabel).toBe("Selesai");
  });

  it("keeps the partial result of a job that finished with rejected rows", () => {
    const view = toJobView({ ...base, status: "completed_with_errors", last_record_no: 200 });
    expect(view).toMatchObject({ progress: 100, terminal: true, succeeded: false, tone: "warning" });
    expect(view.rejected).toBe(1);
  });

  it("shows the error code of a failed job and no progress", () => {
    const view = toJobView({ ...base, status: "failed", error_code: "JOB_GAGAL" });
    expect(view.progress).toBeNull();
    expect(view.errorText).toBe("Kode error: JOB_GAGAL");
    expect(view.tone).toBe("danger");
  });

  it("keeps the full file hash for the view to shorten", () => {
    expect(toJobView(base).fileSha256).toBe("b".repeat(64));
  });
});

describe("buildIngestRequest", () => {
  it("builds the body from a trimmed path, the fixed adapter and no hash when empty", () => {
    expect(buildIngestRequest({ ...EMPTY_INGEST_FORM, pathRef: "  hayabusa/alert.jsonl  " })).toEqual({
      ok: true,
      body: { adapter: "hayabusa", path_ref: "hayabusa/alert.jsonl" },
    });
  });

  it("adds a valid hash in lowercase", () => {
    const sha = "ABCDEF".padEnd(64, "0");
    const result = buildIngestRequest({ pathRef: "a.json", expectedSha256: sha });
    expect(result).toEqual({
      ok: true,
      body: { adapter: "hayabusa", path_ref: "a.json", expected_sha256: sha.toLowerCase() },
    });
  });

  it("requires a path", () => {
    expect(buildIngestRequest(EMPTY_INGEST_FORM)).toEqual({
      ok: false,
      errors: { pathRef: "Isi path file di server." },
    });
  });

  it("rejects path traversal with either slash", () => {
    for (const pathRef of ["../rahasia.json", "a/../b.json", "a\\..\\b.json"]) {
      const result = buildIngestRequest({ pathRef, expectedSha256: "" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.pathRef).toMatch(/'\.\.'/);
    }
  });

  it("rejects a path longer than 300 characters", () => {
    const result = buildIngestRequest({ pathRef: "a".repeat(301), expectedSha256: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.pathRef).toMatch(/300/);
  });

  it("rejects a hash that is not 64 hexadecimal characters", () => {
    const result = buildIngestRequest({ pathRef: "a.json", expectedSha256: "xyz" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.expectedSha256).toMatch(/64/);
  });
});
