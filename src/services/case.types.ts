/**
 * DFIR case responses as returned through the api proxy (`/api/v1/cases/...`), which forwards dfir's
 * `/internal/v1/cases/...` bodies. Mirrors `dfir/src/astria_dfir/api.py` and `cases.py`.
 * The api exposes no case list endpoint; cases are opened by ID.
 */
export type CaseReportRef = { version: number; html_sha256: string };

/** `GET /cases/{case_id}`. The `links` field is dfir-internal and deliberately not typed. */
export type CaseDto = {
  case_id: string;
  status: string;
  card_id: string;
  card_version: number;
  requested_by: string;
  window: { start: string | null; end: string | null } | null;
  keterbatasan: string[];
  created_at: string;
  updated_at: string;
  report: CaseReportRef | null;
};

/** One row of `GET /cases/{case_id}/timeline`, from `timeline_item` in dfir. */
export type CaseTimelineItemDto = {
  item_id: string;
  case_id: string;
  ts_utc: string;
  evidence_id: string;
  source_id: string;
  host: string;
  account: string | null;
  kind: string;
  ringkasan: string;
  injection_suspect: boolean;
};

export type CaseTimelinePage = {
  case_id: string;
  status: string;
  items: CaseTimelineItemDto[];
  /** `item_id` of the last row of this page; `null` when there is no next page. */
  next_cursor: string | null;
};

export type CaseTimelineQuery = { cursor?: string; limit?: number };

/**
 * One entry of `GET /cases/{case_id}/custody`, from dfir `custody.Entri` (hash-chained, append-only).
 * `entry_hash = sha256(prev_hash + canonical_json(content))`; the first entry chains from a per-case genesis hash.
 */
export type CustodyEntryDto = {
  case_id: string;
  seq: number;
  /** UTC ISO-8601 with microseconds and `Z`; this exact text is hashed, so it is displayed as received. */
  ts: string;
  actor: string;
  action: string;
  artifact_id: string | null;
  sha256: string | null;
  detail: string | null;
  prev_hash: string;
  entry_hash: string;
};

/** `GET /cases/{case_id}/custody`. `chain_ok` is computed by dfir over every entry; the web never recomputes it. */
export type CaseCustodyDto = {
  case_id: string;
  entries: CustodyEntryDto[];
  chain_ok: boolean;
};
