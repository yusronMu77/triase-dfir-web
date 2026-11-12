/**
 * Ingest types. Source of truth: `api/src/astria_api/routes/dashboard.py` (`IngestRequest`, BFF) and
 * `ingest/src/astria_ingest/api.py` (`ImportResponse`, `JobResponse`). The public contract (`api/openapi/api-v1.json`)
 * has no schemas for these routes, so the fields below follow the upstream code.
 */

/** Body of `POST /api/v1/ingest`. The browser never uploads a file: the service reads `path_ref` from an allowed folder. */
export type IngestRequest = {
  /** Adapter name, `^[a-z][a-z0-9_]{0,39}$`. The ingest service implements `hayabusa`. */
  adapter: string;
  /** Path below an allowed import folder: 1 to 300 characters, no `..` segment. */
  path_ref: string;
  /** Optional lowercase hex SHA-256 of the file (64 characters). A mismatch is rejected upstream. */
  expected_sha256?: string;
};

/** Job states as constrained in the ingest database (`ingest_job_status`). */
export type IngestJobStatus = "queued" | "running" | "completed" | "completed_with_errors" | "failed";

/**
 * Counters from `ScanResult.stats()`. Stored as a free dict upstream (`dict[str, Any]`), so every field is optional.
 */
export type IngestStats = {
  total_lines?: number;
  valid?: number;
  blank?: number;
  rejected?: number;
  error_samples?: { record_no: number; code: string }[];
};

/** `ImportResponse` (202). `created: false` means the same file was imported before and its existing job is returned. */
export type IngestAccepted = {
  job_id: string;
  source_id: string;
  file_sha256: string;
  status: IngestJobStatus;
  created: boolean;
  stats: IngestStats;
};

/** `JobResponse` of `GET /api/v1/ingest/jobs/{job_id}`. Upstream has no percentage; `last_record_no` is the last committed record. */
export type IngestJob = {
  job_id: string;
  source_id: string;
  file_sha256: string;
  status: IngestJobStatus;
  stats: IngestStats;
  last_record_no: number;
  error_code: string | null;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
};
