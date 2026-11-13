import type { Tone } from "@astria/ui";
import { formatWib } from "../../lib/format-wib";
import { describeError, isApiError } from "../../lib/http/api-error";
import type { DigestDetailDto, DigestRunRequest, DigestSummaryDto } from "../../services/digest.types";

const DIGEST_STATUS: Record<string, { label: string; tone: Tone }> = {
  terjadwal: { label: "Dijadwalkan", tone: "info" },
  berjalan: { label: "Berjalan", tone: "info" },
  terbit: { label: "Terbit", tone: "success" },
  gagal: { label: "Gagal, akan dicoba lagi", tone: "warning" },
  terlewat: { label: "Terlewat", tone: "warning" },
  mati: { label: "Gagal permanen", tone: "danger" },
};

const NARRATION_MODE: Record<string, string> = {
  online: "Narasi model (online)",
  lokal: "Narasi model (lokal)",
  replay: "Narasi dari rekaman (replay)",
  templat: "Narasi dari template",
};

export function digestStatusView(status: string): { label: string; tone: Tone } {
  return DIGEST_STATUS[status] ?? { label: status, tone: "neutral" };
}

export function narrationModeLabel(mode: string | null): string {
  if (!mode) return "-";
  return NARRATION_MODE[mode] ?? mode;
}

export type DigestListItem = {
  id: string;
  jenis: string;
  periode: string;
  status: string;
  statusLabel: string;
  statusTone: Tone;
  terlambat: boolean;
  href: string;
};

export function toDigestListItem(dto: DigestSummaryDto): DigestListItem {
  const view = digestStatusView(dto.status);
  return {
    id: dto.digest_id,
    jenis: dto.jenis === "harian" ? "Harian" : dto.jenis,
    periode: dto.periode,
    status: dto.status,
    statusLabel: view.label,
    statusTone: view.tone,
    terlambat: dto.terlambat,
    href: `/digests/${encodeURIComponent(dto.digest_id)}`,
  };
}

export type DigestDetail = DigestListItem & {
  dijadwalkanPada: string;
  dijalankanPada: string;
  terlambatMenit: number | null;
  percobaan: number;
  modeNarasi: string;
  sha256: string | null;
  versiTemplat: string | null;
};

export function toDigestDetail(dto: DigestDetailDto): DigestDetail {
  return {
    ...toDigestListItem(dto),
    dijadwalkanPada: formatWib(dto.dijadwalkan_pada, { seconds: true }),
    dijalankanPada: formatWib(dto.dijalankan_pada, { seconds: true }),
    terlambatMenit: dto.terlambat_menit,
    percobaan: dto.percobaan,
    modeNarasi: narrationModeLabel(dto.mode_narasi),
    sha256: dto.sha256,
    versiTemplat: dto.versi_templat,
  };
}

/** The digest document exists only once it is published (`terbit`). */
export function isPublished(status: string): boolean {
  return status === "terbit";
}

/** Explains a failed document download. 409 means the digest is not published yet. */
export function describeDocumentError(error: unknown): string {
  if (isApiError(error) && error.status === 409) return "Dokumen digest belum terbit.";
  return describeError(error);
}

export const MAX_RUN_REASON_LENGTH = 500;

/** Validates the manual-run form. The reason is optional, but when present it is capped at 500 characters. */
export function validateDigestRun(data: FormData): string {
  const reason = String(data.get("alasan") ?? "").trim();
  if (reason.length > MAX_RUN_REASON_LENGTH) return `Alasan maksimal ${MAX_RUN_REASON_LENGTH} karakter.`;
  return "";
}

export function toDigestRunRequest(data: FormData): DigestRunRequest {
  const reason = String(data.get("alasan") ?? "").trim();
  return reason ? { jenis: "harian", alasan: reason } : { jenis: "harian" };
}
