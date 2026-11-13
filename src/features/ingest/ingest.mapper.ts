import type { IngestJob, IngestJobStatus, IngestRequest } from "../../services/ingest.types";

/** Statuses after which the job no longer changes (`JOB_DONE` plus `failed` in `ingest/src/astria_ingest/store.py`). */
export const TERMINAL_JOB_STATUSES: readonly IngestJobStatus[] = [
  "completed",
  "completed_with_errors",
  "failed",
];

export function isTerminalJobStatus(status: IngestJobStatus | undefined): boolean {
  return status !== undefined && TERMINAL_JOB_STATUSES.includes(status);
}

const STATUS_LABEL: Record<IngestJobStatus, string> = {
  queued: "Menunggu giliran",
  running: "Sedang diimpor",
  completed: "Selesai",
  completed_with_errors: "Selesai, sebagian baris ditolak",
  failed: "Gagal",
};

const STATUS_TONE: Record<IngestJobStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  queued: "neutral",
  running: "info",
  completed: "success",
  completed_with_errors: "warning",
  failed: "danger",
};

export type JobView = {
  jobId: string;
  sourceId: string;
  /** Full SHA-256 of the file. The screen may shorten it for display only. */
  fileSha256: string;
  status: IngestJobStatus;
  statusLabel: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
  terminal: boolean;
  /** True when the job finished with every row imported (`completed`). */
  succeeded: boolean;
  /** 0 to 100 when the total is known and the job is still running; null means indeterminate. */
  progress: number | null;
  lastRecord: number;
  totalLines: number | null;
  valid: number | null;
  blank: number | null;
  rejected: number | null;
  errorSamples: { recordNo: number; code: string }[];
  /** Human-readable failure line, or null when there is no error code. */
  errorText: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

/** Turns a `JobResponse` into what the screen shows. Progress is an estimate: upstream reports the last record, not a percentage. */
export function toJobView(job: IngestJob): JobView {
  const totalLines = job.stats.total_lines ?? null;
  const terminal = isTerminalJobStatus(job.status);
  const succeeded = job.status === "completed";
  let progress: number | null = null;
  if (terminal) progress = 100;
  else if (job.status === "running" && totalLines !== null && totalLines > 0) {
    progress = Math.min(99, Math.floor((job.last_record_no / totalLines) * 100));
  }
  return {
    jobId: job.job_id,
    sourceId: job.source_id,
    fileSha256: job.file_sha256,
    status: job.status,
    statusLabel: STATUS_LABEL[job.status],
    tone: STATUS_TONE[job.status],
    terminal,
    succeeded,
    progress: job.status === "failed" ? null : progress,
    lastRecord: job.last_record_no,
    totalLines,
    valid: job.stats.valid ?? null,
    blank: job.stats.blank ?? null,
    rejected: job.stats.rejected ?? null,
    errorSamples: (job.stats.error_samples ?? []).map((sample) => ({
      recordNo: sample.record_no,
      code: sample.code,
    })),
    errorText: job.error_code ? `Kode error: ${job.error_code}` : null,
    startedAt: job.started_at,
    finishedAt: job.finished_at,
  };
}

export type IngestForm = {
  pathRef: string;
  expectedSha256: string;
};

export type IngestFormErrors = Partial<Record<keyof IngestForm, string>>;

export const EMPTY_INGEST_FORM: IngestForm = { pathRef: "", expectedSha256: "" };

/** Checks the form the same way the BFF does, so the user sees the problem before a round trip. */
export function buildIngestRequest(
  form: IngestForm,
): { ok: true; body: IngestRequest } | { ok: false; errors: IngestFormErrors } {
  const errors: IngestFormErrors = {};
  const pathRef = form.pathRef.trim();
  const sha = form.expectedSha256.trim().toLowerCase();
  if (pathRef.length === 0) {
    errors.pathRef = "Isi path file di server.";
  } else if (pathRef.length > 300) {
    errors.pathRef = "Path maksimal 300 karakter.";
  } else if (pathRef.split(/[\\/]/).includes("..") || pathRef.includes("\0")) {
    errors.pathRef = "Path tidak boleh memuat '..'.";
  }
  if (sha.length > 0 && !/^[0-9a-f]{64}$/.test(sha)) {
    errors.expectedSha256 = "SHA-256 harus 64 karakter hex.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    body: { adapter: "hayabusa", path_ref: pathRef, ...(sha ? { expected_sha256: sha } : {}) },
  };
}
