import type { AuditEntry, VerifyResult } from "../../services/audit.types";

const TIME_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Jakarta",
});

/** Shows a timestamp in WIB. Returns the raw text when it is not a valid date. */
export function formatAuditTime(iso: string): string {
  const time = new Date(iso);
  return Number.isNaN(time.getTime()) ? iso : `${TIME_FORMAT.format(time)} WIB`;
}

/** Shortens a hash for display: first 10 and last 6 characters. The full value stays in `hashFull`. */
export function shortHash(hash: string): string {
  return hash.length > 20 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash;
}

export type AuditRowView = {
  seq: number;
  time: string;
  actor: string;
  action: string;
  subject: string;
  hashShort: string;
  hashFull: string;
};

export function toAuditRow(entry: AuditEntry): AuditRowView {
  return {
    seq: entry.seq,
    time: formatAuditTime(entry.occurred_at),
    actor: entry.actor,
    action: entry.action,
    subject: `${entry.target_type}: ${entry.target_id}`,
    hashShort: shortHash(entry.entry_hash),
    hashFull: entry.entry_hash,
  };
}

const REASON_TEXT: Record<string, string> = {
  nomor_urut_berlubang: "nomor urut berlubang",
  prev_hash_tidak_cocok: "hash sebelumnya tidak cocok",
  payload_hash_tidak_cocok: "hash isi tidak cocok",
  entry_hash_tidak_cocok: "hash entri tidak cocok",
};

export type VerifyView =
  | { kind: "idle" }
  | { kind: "running"; checked: number }
  | {
      kind: "valid";
      checked: number;
      fromSeq: number;
      toSeq: number | null;
      anchorText: string;
      finishedAt: string | null;
    }
  | { kind: "broken"; checked: number; firstBadSeq: number | null; reasonText: string; anchorText: string }
  | { kind: "failed"; checked: number };

function anchorText(match: boolean | null): string {
  if (match === null) return "Tidak ada jangkar dalam rentang ini";
  return match ? "Cocok dengan jangkar" : "Tidak cocok dengan jangkar";
}

/** Turns a `VerifyResult` into the state the screen shows. `null` means no verification has been started. */
export function toVerifyView(result: VerifyResult | null): VerifyView {
  if (!result) return { kind: "idle" };
  if (result.status === "berjalan") return { kind: "running", checked: result.checked };
  if (result.status === "gagal") return { kind: "failed", checked: result.checked };
  if (result.ok === false) {
    return {
      kind: "broken",
      checked: result.checked,
      firstBadSeq: result.first_bad_seq,
      reasonText: result.reason
        ? (REASON_TEXT[result.reason] ?? result.reason)
        : "alasan tidak dikirim layanan",
      anchorText: anchorText(result.anchor_match),
    };
  }
  return {
    kind: "valid",
    checked: result.checked,
    fromSeq: result.from_seq,
    toSeq: result.to_seq,
    anchorText: anchorText(result.anchor_match),
    finishedAt: result.finished_at,
  };
}
