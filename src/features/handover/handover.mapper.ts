import type { HandoverDraftDto, HandoverRequest } from "../../services/handover.types";

export const MIN_SUMMARY_LENGTH = 10;

export type HandoverDraft = { summary: string; open: number; loaded: boolean };

/** Prefill values. A missing draft or a missing field becomes an empty note and zero open cards. */
export function toHandoverDraft(dto: HandoverDraftDto | null | undefined): HandoverDraft {
  return {
    summary: dto?.catatan ?? "",
    open: typeof dto?.jumlah_terbuka === "number" && dto.jumlah_terbuka >= 0 ? dto.jumlah_terbuka : 0,
    loaded: dto !== null && dto !== undefined,
  };
}

export function validateHandover(data: FormData): string {
  const summary = String(data.get("summary") ?? "").trim();
  if (summary.length < MIN_SUMMARY_LENGTH)
    return `Ringkasan serah terima minimal ${MIN_SUMMARY_LENGTH} karakter.`;
  const open = String(data.get("open") ?? "").trim();
  const count = Number(open === "" ? "0" : open);
  if (!Number.isInteger(count) || count < 0)
    return "Jumlah kartu terbuka harus bilangan bulat, 0 atau lebih.";
  return "";
}

export function toHandoverRequest(data: FormData): HandoverRequest {
  return {
    catatan: String(data.get("summary") ?? "").trim(),
    jumlah_terbuka: Number(String(data.get("open") ?? "").trim() || "0"),
    shift: String(data.get("shift") ?? ""),
  };
}

/** Form fields for the handover panel, prefilled from the draft. */
export function handoverFields(draft: HandoverDraft) {
  return [
    {
      name: "shift",
      label: "Shift berikutnya",
      type: "select" as const,
      options: [
        { value: "siang", label: "Siang · 14:00" },
        { value: "malam", label: "Malam · 22:00" },
        { value: "pagi", label: "Pagi · 06:00" },
      ],
    },
    {
      name: "open",
      label: "Kartu masih terbuka",
      type: "number" as const,
      min: 0,
      defaultValue: String(draft.open),
    },
    {
      name: "summary",
      label: "Ringkasan",
      type: "textarea" as const,
      required: true,
      defaultValue: draft.summary,
    },
  ];
}
