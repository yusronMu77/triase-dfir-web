import type { TimelineEvent, Tone } from "@astria/ui";
import { formatWib } from "../../lib/format-wib";
import { describeError, isApiError } from "../../lib/http/api-error";
import type {
  CaseCustodyDto,
  CaseDto,
  CaseTimelineItemDto,
  CustodyEntryDto,
} from "../../services/case.types";

/** Case IDs look like `CS-20261112-001` (dfir `CASE_ID_PATTERN`). */
export const CASE_ID_PATTERN = /^CS-[0-9]{8}-[0-9]{3,}$/;

export const isCaseId = (value: string): boolean => CASE_ID_PATTERN.test(value);

const CASE_STATUS: Record<string, { label: string; tone: Tone }> = {
  diminta: { label: "Diminta", tone: "info" },
  mengumpulkan: { label: "Mengumpulkan bukti", tone: "info" },
  linimasa_siap: { label: "Timeline siap", tone: "info" },
  draf_sebagian: { label: "Draf sebagian", tone: "warning" },
  gagal: { label: "Gagal", tone: "danger" },
};

export function caseStatusView(status: string): { label: string; tone: Tone } {
  return CASE_STATUS[status] ?? { label: status, tone: "neutral" };
}

export type CaseSummary = {
  id: string;
  status: string;
  statusLabel: string;
  statusTone: Tone;
  cardId: string;
  cardVersion: number;
  requestedBy: string;
  windowLabel: string;
  createdAt: string;
  updatedAt: string;
  limitations: string[];
  report: { version: number; sha256: string } | null;
};

export function toCaseSummary(dto: CaseDto): CaseSummary {
  const view = caseStatusView(dto.status);
  const start = dto.window?.start ?? null;
  const end = dto.window?.end ?? null;
  return {
    id: dto.case_id,
    status: dto.status,
    statusLabel: view.label,
    statusTone: view.tone,
    cardId: dto.card_id,
    cardVersion: dto.card_version,
    requestedBy: dto.requested_by,
    windowLabel: start || end ? `${formatWib(start)} sampai ${formatWib(end)}` : "-",
    createdAt: formatWib(dto.created_at, { seconds: true }),
    updatedAt: formatWib(dto.updated_at, { seconds: true }),
    limitations: dto.keterbatasan,
    report: dto.report ? { version: dto.report.version, sha256: dto.report.html_sha256 } : null,
  };
}

export function toTimelineEvent(item: CaseTimelineItemDto): TimelineEvent {
  const place = item.account ? `${item.host} (${item.account})` : item.host;
  const flag = item.injection_suspect ? " · Ditandai mencurigakan (kemungkinan injeksi)" : "";
  return {
    id: item.item_id,
    time: formatWib(item.ts_utc, { seconds: true }),
    dateTime: item.ts_utc,
    title: `${item.kind} · ${place}${flag}`,
    description: `${item.ringkasan || "Tanpa ringkasan."} Bukti: ${item.evidence_id}.`,
  };
}

/** Labels for the custody actions dfir writes (`cases.py`). Unknown actions show their raw code. */
const CUSTODY_ACTION: Record<string, { label: string; tone: Tone }> = {
  KASUS_DIBUAT: { label: "Kasus dibuat", tone: "info" },
  STATUS: { label: "Status berubah", tone: "neutral" },
  HASH_COCOK: { label: "Hash bukti cocok", tone: "success" },
  HASH_TIDAK_COCOK: { label: "Hash bukti tidak cocok", tone: "danger" },
  BUKTI_TIDAK_DITEMUKAN: { label: "Bukti tidak ditemukan", tone: "warning" },
  LINIMASA_DIBUAT: { label: "Timeline dibuat", tone: "info" },
  TULIS_LAPORAN: { label: "Laporan ditulis", tone: "info" },
};

export type CustodyRow = {
  key: string;
  seq: number;
  /** Timestamp as hashed by dfir (UTC text), plus a WIB rendering for reading. */
  ts: string;
  time: string;
  actor: string;
  action: string;
  actionLabel: string;
  actionTone: Tone;
  artifactId: string | null;
  sha256: string | null;
  detail: string | null;
  prevHash: string;
  entryHash: string;
};

export type CaseCustody = {
  rows: CustodyRow[];
  /** dfir's verdict over the whole chain. Never recomputed or inferred in the browser. */
  chainOk: boolean;
};

export function toCustodyRow(entry: CustodyEntryDto): CustodyRow {
  const view = CUSTODY_ACTION[entry.action] ?? { label: entry.action, tone: "neutral" as Tone };
  return {
    key: `${entry.case_id}-${entry.seq}`,
    seq: entry.seq,
    ts: entry.ts,
    time: formatWib(entry.ts, { seconds: true }),
    actor: entry.actor,
    action: entry.action,
    actionLabel: view.label,
    actionTone: view.tone,
    artifactId: entry.artifact_id,
    sha256: entry.sha256,
    detail: entry.detail,
    prevHash: entry.prev_hash,
    entryHash: entry.entry_hash,
  };
}

/** Keeps dfir's order (by `seq`) and hash values exactly as received; `chain_ok` must be a real boolean. */
export function toCaseCustody(dto: CaseCustodyDto): CaseCustody {
  return { rows: (dto.entries ?? []).map(toCustodyRow), chainOk: dto.chain_ok === true };
}

/** Short form of a SHA-256 for tables; the full value stays in the cell title and the copyable text. */
export const shortHash = (hash: string | null): string => (hash ? `${hash.slice(0, 12)}…` : "-");

/** Explains a failed report download. 409 means no report exists yet, which is not a server fault. */
export function describeReportError(error: unknown): string {
  if (isApiError(error) && error.status === 409) return "Laporan belum dibuat untuk kasus ini.";
  return describeError(error);
}

export const CASE_ID_HINT = "Format ID kasus: CS-YYYYMMDD-NNN, contoh CS-20261112-001.";
