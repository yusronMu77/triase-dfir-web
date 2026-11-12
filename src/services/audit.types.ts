/**
 * Audit types. Source of truth: `contracts/gen/python/astria_contracts/openapi/audit_internal.py` (`Entry`,
 * `RecordPage`, `VerifyResult`), served by `audit/src/astria_audit/api.py` and proxied by the BFF.
 */

/** One chained audit record. Hashes are lowercase hex SHA-256 (64 characters). */
export type AuditEntry = {
  seq: number;
  occurred_at: string;
  recorded_at: string;
  actor: string;
  actor_type: string;
  action: string;
  target_type: string;
  target_id: string;
  via: string;
  idempotency_key: string;
  payload: Record<string, unknown>;
  payload_hash: string;
  prev_hash: string;
  entry_hash: string;
};

/** `GET /api/v1/audit`. Pass `next_from_seq` as the next `from_seq`; it is `null` on the last page. */
export type AuditPage = {
  items: AuditEntry[];
  next_from_seq: number | null;
};

export type VerifyStatus = "berjalan" | "selesai" | "gagal";

/** `VerifyResult`. `ok` is null while running or when the job failed; `reason` names the first broken check. */
export type VerifyResult = {
  job_id: string | null;
  status: VerifyStatus;
  from_seq: number;
  to_seq: number | null;
  checked: number;
  ok: boolean | null;
  first_bad_seq: number | null;
  reason: string | null;
  /** Null when no anchor falls inside the verified range. */
  anchor_match: boolean | null;
  started_at: string | null;
  finished_at: string | null;
};
