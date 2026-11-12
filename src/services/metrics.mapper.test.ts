import { describe, expect, it } from "vitest";
import { metricsRange, toMetricsView } from "./metrics.mapper";
import type { TicketStats } from "./metrics.types";

const stats: TicketStats = {
  dari: "2026-11-05T03:00:00Z",
  sampai: "2026-11-12T03:00:00Z",
  total: 40,
  per_status: { baru: 10, selesai: 5 },
  per_band: { KRITIS: 4, SEDANG: 20 },
  per_prioritas: { P1: 4, P3: 20 },
  sla_terlanggar: 8,
  umpan_balik: { benar: 3, salah_positif: 1 },
};

describe("metricsRange", () => {
  it("returns the last N days as ISO strings with Z", () => {
    const now = new Date("2026-11-12T03:00:00.000Z");
    expect(metricsRange(7, now)).toEqual({
      dari: "2026-11-05T03:00:00.000Z",
      sampai: "2026-11-12T03:00:00.000Z",
    });
    expect(metricsRange(30, now).dari).toBe("2026-10-13T03:00:00.000Z");
  });
});

describe("toMetricsView", () => {
  const view = toMetricsView(stats);

  it("shows only figures the statistics endpoint returns", () => {
    const labels = view.summary.map((m) => m.label);
    expect(labels).toEqual(["Total kartu", "SLA terlanggar", "Kartu kritis", "Umpan balik analis"]);
    expect(view.summary[0].value).toBe("40");
    expect(view.summary[1]).toMatchObject({ value: "8", meta: "20% dari total kartu" });
    expect(view.summary[2].value).toBe("4");
    expect(view.summary[3].value).toBe("4");
  });

  it("keeps every band in a fixed order, with zero for missing bands", () => {
    expect(view.byBand).toEqual([
      { label: "Kritis", value: 4, band: "critical" },
      { label: "Tinggi", value: 0, band: "high" },
      { label: "Sedang", value: 20, band: "medium" },
      { label: "Rendah", value: 0, band: "low" },
    ]);
  });

  it("maps statuses and feedback labels, zero for missing buckets", () => {
    expect(view.byStatus.map((d) => [d.label, d.value])).toEqual([
      ["Baru", 10],
      ["Ditinjau", 0],
      ["Diselidiki", 0],
      ["Eskalasi", 0],
      ["Selesai", 5],
    ]);
    expect(view.feedback.map((d) => [d.label, d.value])).toEqual([
      ["Benar", 3],
      ["Salah positif", 1],
      ["Perlu DFIR", 0],
    ]);
  });

  it("does not invent a rate when there are no cards", () => {
    const empty = toMetricsView({ ...stats, total: 0, sla_terlanggar: 0, umpan_balik: {} });
    expect(empty.summary[1].meta).toBe("Belum ada kartu");
    expect(empty.summary[3].value).toBe("0");
  });
});
