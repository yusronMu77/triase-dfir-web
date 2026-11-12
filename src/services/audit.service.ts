import { api } from "../lib/http/api-client";
import type { AuditPage, VerifyResult } from "./audit.types";

export type AuditListQuery = {
  /** Inclusive lower bound on `seq`. Use `next_from_seq` from the previous page. */
  fromSeq?: number;
  /** Page size, 1 to 500. */
  limit?: number;
};

/** Audit trail and hash-chain verification. Reads need `audit:read`; verification needs `audit:verify`. */
export const auditService = {
  /** `GET /api/v1/audit?from_seq=&limit=` */
  list: (query: AuditListQuery = {}, signal?: AbortSignal) =>
    api.get<AuditPage>("/audit", { from_seq: query.fromSeq, limit: query.limit }, signal),
  /** `POST /api/v1/audit/verify`: starts a check of the whole chain. Returns 202 while running, 200 when done. */
  startVerify: (signal?: AbortSignal) => api.post<VerifyResult>("/audit/verify", undefined, { signal }),
  /** `GET /api/v1/audit/verify/{job_id}`: current state of a verification job. */
  verifyJob: (jobId: string, signal?: AbortSignal) =>
    api.get<VerifyResult>(`/audit/verify/${encodeURIComponent(jobId)}`, undefined, signal),
};
