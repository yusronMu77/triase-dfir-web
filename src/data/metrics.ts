import type { ChartDatum } from "@astria/ui";

export type MetricsRange = "7" | "30";

export const metricsByRange: Record<
  MetricsRange,
  {
    summary: { label: string; value: string; meta: string }[];
    byBand: ChartDatum[];
    byDay: ChartDatum[];
  }
> = {
  "7": {
    summary: [
      { label: "Kartu masuk", value: "142", meta: "7 hari terakhir" },
      { label: "Median waktu tinjau", value: "14 mnt", meta: "Target 30 mnt" },
      { label: "Kepatuhan SLA", value: "93%", meta: "132 dari 142 kartu" },
      { label: "Lolos pemeriksa", value: "100%", meta: "Setiap klaim menunjuk bukti" },
    ],
    byBand: [
      { label: "Kritis", value: 6, band: "critical" },
      { label: "Tinggi", value: 38, band: "high" },
      { label: "Sedang", value: 61, band: "medium" },
      { label: "Rendah", value: 37, band: "low" },
    ],
    byDay: [
      { label: "Sen", value: 18 },
      { label: "Sel", value: 24 },
      { label: "Rab", value: 21 },
      { label: "Kam", value: 19 },
      { label: "Jum", value: 26 },
      { label: "Sab", value: 14 },
      { label: "Min", value: 20 },
    ],
  },
  "30": {
    summary: [
      { label: "Kartu masuk", value: "611", meta: "30 hari terakhir" },
      { label: "Median waktu tinjau", value: "17 mnt", meta: "Target 30 mnt" },
      { label: "Kepatuhan SLA", value: "91%", meta: "556 dari 611 kartu" },
      { label: "Lolos pemeriksa", value: "100%", meta: "Setiap klaim menunjuk bukti" },
    ],
    byBand: [
      { label: "Kritis", value: 22, band: "critical" },
      { label: "Tinggi", value: 151, band: "high" },
      { label: "Sedang", value: 268, band: "medium" },
      { label: "Rendah", value: 170, band: "low" },
    ],
    byDay: [
      { label: "Mgg 1", value: 140 },
      { label: "Mgg 2", value: 163 },
      { label: "Mgg 3", value: 158 },
      { label: "Mgg 4", value: 150 },
    ],
  },
};
