import {
  type QueueItem,
  type Severity,
  severityLabels,
  statusLabels,
  type TicketStatus,
  type TimelineEvent,
  type Tone,
} from "@astria/ui";
import type {
  CardActivity,
  CardBand,
  CardConclusion,
  CardDocument,
  CardPriority,
  CardStatus,
  CardSummary,
} from "./cards.types";

/** Server band (ticket `prioritas.py`) to the severity the UI shows. */
export const bandToSeverity: Record<CardBand, Severity> = {
  KRITIS: "critical",
  TINGGI: "high",
  SEDANG: "medium",
  RENDAH: "low",
};

/** Server status (ticket `status.py`) to the UI status used by `StatusBadge`. */
export const statusToTicket: Record<CardStatus, TicketStatus> = {
  baru: "new",
  ditinjau: "reviewed",
  diselidiki: "investigating",
  eskalasi: "escalated",
  selesai: "done",
};

/**
 * Allowed next statuses: a copy of `TRANSISI` in ticket `status.py`. It only limits the choices shown; the server
 * decides. `selesai` is reopened by the system when a new card version arrives, never by a user.
 */
export const nextStatuses: Record<CardStatus, CardStatus[]> = {
  baru: ["ditinjau"],
  ditinjau: ["diselidiki", "selesai"],
  diselidiki: ["eskalasi", "selesai"],
  eskalasi: ["diselidiki", "selesai"],
  selesai: [],
};

export const conclusionLabels: Record<CardConclusion, string> = {
  insiden_benar: "Insiden benar",
  bukan_insiden: "Bukan insiden",
  ditutup_tanpa_tindakan: "Ditutup tanpa tindakan",
};

export const bandOptions: { value: CardBand; label: string }[] = [
  { value: "KRITIS", label: severityLabels.critical },
  { value: "TINGGI", label: severityLabels.high },
  { value: "SEDANG", label: severityLabels.medium },
  { value: "RENDAH", label: severityLabels.low },
];

export const priorityOptions: { value: CardPriority; label: string }[] = [
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
  { value: "P4", label: "P4" },
];

export const statusFilterOptions: { value: CardStatus; label: string }[] = (
  ["baru", "ditinjau", "diselidiki", "eskalasi", "selesai"] as const
).map((value) => ({ value, label: statusLabels[statusToTicket[value]] }));

export function statusLabel(status: string | null | undefined): string {
  if (status && status in statusToTicket) return statusLabels[statusToTicket[status as CardStatus]];
  return status || "-";
}

/** Indonesian date and time in WIB. Returns "-" for a missing or unreadable value. */
export function formatWaktu(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  const text = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
  return `${text} WIB`;
}

/** Hours and minutes, for example "2 j 15 m" or "40 m". */
export function formatDurasi(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} j ${minutes % 60} m` : `${minutes} m`;
}

/**
 * SLA text and state for a card. `now` is passed in so the function stays pure. "warning" means at most a quarter
 * of the response window is left. That threshold is a display choice, not a server rule.
 */
export function slaOf(card: CardSummary, now: number): { sla: string; slaState: QueueItem["slaState"] } {
  if (card.tanggapan_awal_at) {
    return card.terlambat
      ? { sla: "Ditanggapi terlambat", slaState: "breached" }
      : { sla: "Sudah ditanggapi", slaState: "ok" };
  }
  const target = card.tanggapan_awal_target ? Date.parse(card.tanggapan_awal_target) : Number.NaN;
  if (Number.isNaN(target)) return { sla: "Tenggat belum ada", slaState: "ok" };
  if (card.terlambat || now > target) return { sla: "Terlambat", slaState: "breached" };
  const left = target - now;
  const start = card.dibuat_pada ? Date.parse(card.dibuat_pada) : Number.NaN;
  const window = target - start;
  const nearing = Number.isFinite(window) && window > 0 && left <= window * 0.25;
  return { sla: `Sisa ${formatDurasi(left)}`, slaState: nearing ? "warning" : "ok" };
}

/** One card of the queue as the `QueueTable` of `@astria/ui` shows it. */
export function toQueueItem(card: CardSummary, now: number): QueueItem {
  const sla = slaOf(card, now);
  return {
    id: card.card_id,
    title: card.judul,
    band: bandToSeverity[card.band],
    score: card.skor,
    // The list response has no asset (host) field, so the column shows a dash instead of a guess.
    asset: "-",
    status: statusToTicket[card.status],
    sla: sla.sla,
    slaState: sla.slaState,
    assignee: card.pemilik ?? undefined,
    meta: card.pola || undefined,
    href: `/cards/${encodeURIComponent(card.card_id)}`,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const asText = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
const asList = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];
const asTextList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];

const ACTIVITY_TITLES: Record<string, string> = {
  comment: "Komentar",
  label: "Label",
  status_changed: "Status diubah",
  assigned: "Pemilik diubah",
  priority_changed: "Prioritas diubah",
};

/** Human text for one activity row. Unknown `jenis` values get no text. */
export function activityDescription(activity: CardActivity): string | undefined {
  const d = activity.detail;
  const alasan = asText(d.alasan);
  let text: string | undefined;
  switch (activity.jenis) {
    case "comment":
      text = asText(d.isi);
      break;
    case "label":
      text = `${asText(d.aksi) === "hapus" ? "Label dihapus" : "Label ditambahkan"}: ${asText(d.label) ?? "-"}`;
      break;
    case "status_changed": {
      const kesimpulan = asText(d.kesimpulan);
      text = `Status ${statusLabel(asText(d.dari))} menjadi ${statusLabel(asText(d.ke))}`;
      if (kesimpulan && kesimpulan in conclusionLabels) {
        text += `. Kesimpulan: ${conclusionLabels[kesimpulan as CardConclusion]}`;
      }
      break;
    }
    case "assigned":
      text = `Pemilik ${asText(d.dari) ?? "kosong"} menjadi ${asText(d.ke) ?? "kosong"}`;
      break;
    case "priority_changed":
      text = `Prioritas ${asText(d.dari) ?? "-"} menjadi ${asText(d.ke) ?? "-"}`;
      break;
    default:
      text = undefined;
  }
  const parts = [text, alasan ? `Alasan: ${alasan}` : undefined].filter(Boolean);
  return parts.length ? parts.join(". ") : undefined;
}

/** Activity log as `CaseTimeline` expects it. The order is the server's (newest first). */
export function toTimelineEvents(items: CardActivity[]): TimelineEvent[] {
  return items.map((activity) => ({
    id: String(activity.id),
    time: formatWaktu(activity.ts),
    dateTime: activity.ts ?? undefined,
    title: `${ACTIVITY_TITLES[activity.jenis] ?? "Aktivitas"} oleh ${activity.pelaku}`,
    description: activityDescription(activity),
  }));
}

/** Anchor id of one evidence record on the detail screen. */
export const evidenceAnchor = (evidenceId: string) => `ev-${evidenceId}`;

export type CardFacts = {
  faktor: { nama: string; nilai: number; alasan: string }[];
  entitas: { jenis: string; nilai: string; peran?: string; bukti: string[] }[];
  teknik: { id: string; taktik?: string }[];
  korelasi: string[];
  /** Unique evidence ids named by the card, in order of first appearance. */
  buktiIds: string[];
};

/**
 * Reads the parts of `dokumen.kode` that the detail screen shows. Every field is checked, because the document is
 * stored as JSON by ticket and is not validated against a schema here.
 */
export function toCardFacts(dokumen: CardDocument | null): CardFacts {
  const kode = isRecord(dokumen?.kode) ? dokumen.kode : undefined;
  const faktor = asList(kode?.faktor).flatMap((f) => {
    const nama = asText(f.nama);
    return nama && typeof f.nilai === "number"
      ? [{ nama, nilai: f.nilai, alasan: asText(f.alasan) ?? "" }]
      : [];
  });
  const entitas = asList(kode?.entitas).flatMap((e) => {
    const jenis = asText(e.jenis);
    const nilai = asText(e.nilai);
    return jenis && nilai ? [{ jenis, nilai, peran: asText(e.peran), bukti: asTextList(e.bukti) }] : [];
  });
  const teknik = asList(kode?.teknik_attack).flatMap((t) => {
    const id = asText(t.id);
    return id ? [{ id, taktik: asText(t.taktik) }] : [];
  });
  const ids = [...asList(kode?.bukti).map((b) => asText(b.id)), ...entitas.flatMap((e) => e.bukti)].filter(
    (id): id is string => Boolean(id),
  );
  return {
    faktor,
    entitas,
    teknik,
    korelasi: asTextList(kode?.temuan_korelasi),
    buktiIds: [...new Set(ids)],
  };
}

/**
 * Verifier outcome (verifier `policy.py` `putuskan`). The web only labels the status it receives; it never infers a
 * status from the narrative.
 */
const VERIFICATION: Record<string, { label: string; tone: Tone; description: string }> = {
  LULUS: {
    label: "Lulus pemeriksa",
    tone: "success",
    description: "Semua klaim narasi lolos pemeriksa dan menunjuk ID bukti yang ada.",
  },
  SEBAGIAN: {
    label: "Sebagian lulus",
    tone: "warning",
    description: "Sebagian klaim ditolak pemeriksa dan sudah dibuang; yang tampil hanya klaim yang lolos.",
  },
  TEMPLAT: {
    label: "Templat (narasi model ditolak)",
    tone: "neutral",
    description: "Narasi model tidak dipakai. Kartu hanya memuat fakta deterministik di bawah.",
  },
};

export function verificationView(status: string): { label: string; tone: Tone; description: string } {
  return (
    VERIFICATION[status] ?? {
      label: status || "Belum diverifikasi",
      tone: "neutral",
      description: "Status pemeriksa tidak dikenal; narasi ditampilkan apa adanya dari dokumen kartu.",
    }
  );
}

export type CardNarrative = {
  /** Claims in the order the document lists them, each with the evidence IDs it names (as stored). */
  claims: { text: string; evidence: string[] }[];
  hypothesis: { text: string; evidence: string[] } | null;
  counter: { text: string; rebuttal?: string }[];
  unknowns: string[];
  /** True when the document holds no narrative (for example `TEMPLAT`, where the verifier stores `{}`). */
  empty: boolean;
};

/** Reads `dokumen.model`. Every field is checked; claims without text are dropped, evidence IDs are not invented. */
export function toCardNarrative(dokumen: CardDocument | null): CardNarrative {
  const model = isRecord(dokumen?.model) ? dokumen.model : undefined;
  const claims = asList(model?.ringkasan).flatMap((c) => {
    const text = asText(c.klaim);
    return text ? [{ text, evidence: asTextList(c.bukti) }] : [];
  });
  const utama = isRecord(model?.hipotesis_utama) ? model.hipotesis_utama : undefined;
  const hypothesisText = asText(utama?.teks);
  const counter = asList(model?.hipotesis_tandingan).flatMap((h) => {
    const text = asText(h.teks);
    return text ? [{ text, rebuttal: asText(h.pembantah) }] : [];
  });
  const unknowns = asTextList(model?.belum_diketahui);
  const hypothesis = hypothesisText ? { text: hypothesisText, evidence: asTextList(utama?.bukti) } : null;
  return {
    claims,
    hypothesis,
    counter,
    unknowns,
    empty: !claims.length && !hypothesis && !counter.length && !unknowns.length,
  };
}
