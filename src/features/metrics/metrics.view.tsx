"use client";
import { Badge, Field, MetricChart, MetricsSummary, PageHeader, Select } from "@astria/ui";
import type { MetricsRange } from "../../data/metrics";
import { useMetrics } from "./use-metrics.hook";

export function MetricsView() {
  const { range, setRange, data } = useMetrics();
  return (
    <>
      <PageHeader
        title="Metrik"
        description="Kinerja triase dan kepatuhan SLA"
        action={<Badge tone="info">Data contoh</Badge>}
      />
      <div className="a-stack">
        <div className="showcase-toolbar">
          <Field label="Rentang waktu">
            {(props) => (
              <Select
                {...props}
                value={range}
                onChange={(event) => setRange(event.target.value as MetricsRange)}
              >
                <option value="7">7 hari terakhir</option>
                <option value="30">30 hari terakhir</option>
              </Select>
            )}
          </Field>
        </div>
        <MetricsSummary metrics={data.summary} />
        <div className="showcase-grid">
          <MetricChart
            title="Kartu per band"
            description="Jumlah kartu menurut band skor"
            data={data.byBand}
          />
          <MetricChart
            title="Kartu masuk per hari"
            description="Volume alert yang menjadi kartu"
            data={data.byDay}
          />
        </div>
      </div>
    </>
  );
}
