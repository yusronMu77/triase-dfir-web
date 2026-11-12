/*
 * Shapes of the `/api/v1/cards*` and `/api/v1/alerts/*` responses. The api proxies ticket, ingest, and dfir
 * payloads without a typed schema (OpenAPI leaves bodies open), so these types follow the upstream code:
 * ticket `layanan.py` (kepala, detail, aktivitas), `status.py`, `prioritas.py`; ingest `api.py` (EvidenceItem);
 * dfir `api.py` (_ringkas). Fields the UI does not read stay out.
 */

export type CardStatus = "baru" | "ditinjau" | "diselidiki" | "eskalasi" | "selesai";
export type CardBand = "KRITIS" | "TINGGI" | "SEDANG" | "RENDAH";
export type CardPriority = "P1" | "P2" | "P3" | "P4";
export type CardConclusion = "insiden_benar" | "bukan_insiden" | "ditutup_tanpa_tindakan";
export type CardFeedbackLabel = "benar" | "salah_positif" | "perlu_dfir";

/** Card header (`kepala` in ticket `layanan.py`): returned by the list, by PATCH, and inside the detail. */
export type CardSummary = {
  card_id: string;
  judul: string;
  pola: string;
  band: CardBand;
  skor: number;
  status: CardStatus;
  prioritas: CardPriority;
  prioritas_sumber: "band" | "analis";
  pemilik: string | null;
  kesimpulan: CardConclusion | null;
  label: string[];
  status_verifikasi: string;
  versi: number;
  /** Optimistic-lock version; every PATCH must send it back as `if_row_version`. */
  row_version: number;
  tanggapan_awal_target: string | null;
  tanggapan_awal_at: string | null;
  /** Computed by ticket (`sla.terlambat`), not by the browser. */
  terlambat: boolean;
  dibuat_pada: string | null;
  diperbarui_pada: string | null;
};

/** `GET /cards` (cursor paging; `next_cursor` is null on the last page). */
export type CardPage = {
  items: CardSummary[];
  next_cursor: string | null;
};

/** Query of `GET /cards`. `prioritas` is forwarded upstream as `priority`. */
export type CardListQuery = {
  status?: CardStatus;
  band?: CardBand;
  prioritas?: CardPriority;
  pemilik?: string;
  host?: string;
  dari?: string;
  sampai?: string;
  cursor?: string;
  limit?: number;
};

/** One item of `dokumen.kode` (the card document). Only the parts the UI shows are typed. */
export type CardDocument = {
  kode?: {
    judul?: string;
    pola?: string;
    skor?: number;
    band?: string;
    faktor?: { nama: string; nilai: number; alasan: string }[];
    entitas?: { jenis: string; nilai: string; peran?: string; bukti?: string[] }[];
    teknik_attack?: { id: string; taktik?: string }[];
    temuan_korelasi?: string[];
    bukti?: { id: string; sha256?: string }[];
  };
  [key: string]: unknown;
};

/** Row of the activity log (`aktivitas` in ticket `layanan.py`). `detail` keys depend on `jenis`. */
export type CardActivity = {
  id: number;
  ts: string | null;
  pelaku: string;
  jenis: string;
  detail: Record<string, unknown>;
};

/** Explanation of one rule from the `alert_penjelasan` catalog (config `catalogs.py`). */
export type PenjelasEntry = {
  judul: string;
  penjelasan: string;
  penyebab_jinak?: string[];
  yang_dicek?: string[];
  rujukan?: string[];
};

/** `GET /cards/{id}`: the card header plus document, activity, and explanations (`compose.card_detail`). */
export type CardDetail = CardSummary & {
  kesimpulan_catatan: string | null;
  /** Empty until triage publishes rule ids (ticket comment K6), so `penjelas` is `{}` for now. */
  rule_ids: string[];
  dokumen: CardDocument | null;
  aktivitas: CardActivity[];
  /** Keyed by rule id. Null when the config service could not be reached (see `bagian_tidak_tersedia`). */
  penjelas: Record<string, PenjelasEntry> | null;
  katalog: { versi: number | null; content_hash: string | null } | null;
  bagian_tidak_tersedia: string[];
};

/** Body of `PATCH /cards/{id}`. Only changed fields are sent; `pemilik: null` removes the owner. */
export type CardPatchBody = {
  if_row_version: number;
  status?: CardStatus;
  pemilik?: string | null;
  prioritas?: CardPriority;
  /** Only with `status: "selesai"`. */
  kesimpulan?: CardConclusion;
  kesimpulan_catatan?: string;
  /** Required whenever `prioritas` changes. */
  alasan?: string;
};

export type CardEventBody =
  | { tipe: "comment"; isi: string }
  | { tipe: "label"; label: string; aksi?: "tambah" | "hapus" };

/** Result of `POST /cards/{id}/events` (201; 200 when an Idempotency-Key replay returns the first result). */
export type CardEvent = {
  id: number;
  ts: string;
  pelaku: string;
  jenis: "comment" | "label";
  detail: Record<string, unknown>;
  row_version: number;
};

export type CardFeedbackBody = { label: CardFeedbackLabel; catatan?: string };

/** Result of `POST /cards/{id}/feedback`. */
export type CardFeedbackResult = {
  feedback_id: number;
  card_id: string;
  label: CardFeedbackLabel;
};

/** Result of `POST /cards/{id}/deep-dive` (202): the DFIR case that was queued (dfir `_ringkas`). */
export type DeepDiveResult = {
  case_id: string;
  status: string;
  card_id: string;
  card_version: number;
  links: Record<string, string>;
};

/** Evidence record (ingest `EvidenceItem`). `excerpt` and `fields` are already sanitized; raw data is never sent. */
export type EvidenceItem = {
  evidence_id: string;
  source_id: string;
  record_no: number;
  record_sha256: string;
  occurred_at: string;
  host: string;
  account: string | null;
  kind: string;
  fields: Record<string, string>;
  excerpt: string;
  sanitized: boolean;
  injection_suspect: boolean;
};

/**
 * `GET /cards/{id}/evidence`. Shape as documented for the api. See the report: the api currently reads the
 * ingest key `evidence`, but ingest answers with `items` and `not_found`.
 */
export type CardEvidence = {
  card_id: string;
  evidence: EvidenceItem[];
  tidak_ditemukan: string[];
};

/** `GET /alerts/{id}/explain` (`compose.alert_explain`). */
export type AlertExplain = {
  alert_id: string;
  rule_id: string | null;
  penjelas: PenjelasEntry | null;
  katalog: { versi: number | null; content_hash: string | null } | null;
  bagian_tidak_tersedia: string[];
};
