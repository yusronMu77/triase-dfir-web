import type { ChartDatum } from "@astria/ui";
import type { MetricsRange, TicketStats } from "./metrics.types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** `[now - days, now]` as ISO strings with `Z`. Pure: the caller passes `now`. */
export function metricsRange(days: number, now: Date): MetricsRange {
  return {
    dari: new Date(now.getTime() - days * DAY_MS).toISOString(),
    sampai: now.toISOString(),
  };
}

const BAND_ORDER = [
  { key: "KRITIS", label: "Kritis", band: "critical" },
  { key: "TINGGI", label: "Tinggi", band: "high" },
  { key: "SEDANG", label: "Sedang", band: "medium" },
  { key: "RENDAH", label: "Rendah", band: "low" },
] as const;

const FEEDBACK_ORDER = [
  { key: "benar", label: "Benar" },
  { key: "salah_positif", label: "Salah positif" },
  { key: "perlu_dfir", label: "Perlu DFIR" },
] as const;

const STATUS_ORDER = [
  { key: "baru", label: "Baru" },
  { key: "ditinjau", label: "Ditinjau" },
  { key: "diselidiki", label: "Diselidiki" },
  { key: "eskalasi", label: "Eskalasi" },
  { key: "selesai", label: "Selesai" },
] as const;

/** Missing keys count as zero, so every chart shows all of its buckets in a fixed order. */
const count = (values: Record<string, number>, key: string) => values[key] ?? 0;

/**
 * Turns the ticket statistics into what the metrics screen shows. Only numbers the statistics endpoint returns
 * are used: no median review time and no "lolos pemeriksa" rate, because the endpoint does not provide them.
 */
export function toMetricsView(stats: TicketStats) {
  const total = stats.total;
  const feedbackTotal = Object.values(stats.umpan_balik).reduce((sum, n) => sum + n, 0);
  return {
    summary: [
      { label: "Total kartu", value: String(total), meta: "Kartu yang masuk pada rentang" },
      {
        label: "SLA terlanggar",
        value: String(stats.sla_terlanggar),
        meta: total
          ? `${Math.round((stats.sla_terlanggar / total) * 100)}% dari total kartu`
          : "Belum ada kartu",
      },
      { label: "Kartu kritis", value: String(count(stats.per_band, "KRITIS")), meta: "Band KRITIS" },
      {
        label: "Umpan balik analis",
        value: String(feedbackTotal),
        meta: "Benar, salah positif, atau perlu DFIR",
      },
    ],
    byBand: BAND_ORDER.map(
      (b): ChartDatum => ({ label: b.label, value: count(stats.per_band, b.key), band: b.band }),
    ),
    byStatus: STATUS_ORDER.map(
      (s): ChartDatum => ({ label: s.label, value: count(stats.per_status, s.key) }),
    ),
    feedback: FEEDBACK_ORDER.map(
      (f): ChartDatum => ({ label: f.label, value: count(stats.umpan_balik, f.key) }),
    ),
  };
}

export type MetricsView = ReturnType<typeof toMetricsView>;
