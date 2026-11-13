import type { TimelineEvent, Tone } from "@astria/ui";
import { formatWib } from "../../lib/format-wib";
import { describeError, isApiError } from "../../lib/http/api-error";
import type { CaseDto, CaseTimelineItemDto } from "../../services/case.types";

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

/** Explains a failed report download. 409 means no report exists yet, which is not a server fault. */
export function describeReportError(error: unknown): string {
  if (isApiError(error) && error.status === 409) return "Laporan belum dibuat untuk kasus ini.";
  return describeError(error);
}

export const CASE_ID_HINT = "Format ID kasus: CS-YYYYMMDD-NNN, contoh CS-20261112-001.";
