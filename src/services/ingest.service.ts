import { api } from "../lib/http/api-client";
import type { IngestAccepted, IngestJob, IngestRequest } from "./ingest.types";

/** Ingest jobs. The browser sends a path reference only; the service reads the file itself. */
export const ingestService = {
  /** `POST /api/v1/ingest`: starts an import (202). Needs `ingest:write`. */
  start: (body: IngestRequest, signal?: AbortSignal) => api.post<IngestAccepted>("/ingest", body, { signal }),
  /** `GET /api/v1/ingest/jobs/{job_id}`: job state, polled until the status is final. Needs `ingest:read`. */
  job: (jobId: string, signal?: AbortSignal) =>
    api.get<IngestJob>(`/ingest/jobs/${encodeURIComponent(jobId)}`, undefined, signal),
};
