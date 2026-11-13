"use client";
import { Badge, EmptyState, Field, MetricChart, MetricsSummary, PageHeader, Select } from "@astria/ui";
import { QueryBoundary } from "../shared/query-boundary.view";
import { useMetrics } from "./use-metrics.hook";

export function MetricsView() {
  const metrics = useMetrics();
  const { view } = metrics;

  return (
    <>
      <PageHeader
        title="Metrik"
        description="Ringkasan kartu dan SLA, dihitung oleh layanan tiket"
        action={<Badge tone="info">{metrics.days} hari terakhir</Badge>}
      />
      <div className="a-stack">
        <div className="showcase-toolbar">
          <Field label="Rentang waktu">
            {(props) => (
              <Select
                {...props}
                value={String(metrics.days)}
                onChange={(event) => metrics.setDays(event.target.value === "30" ? 30 : 7)}
              >
                <option value="7">7 hari terakhir</option>
                <option value="30">30 hari terakhir</option>
              </Select>
            )}
          </Field>
        </div>
        {!metrics.allowed && !metrics.loading && !metrics.error ? (
          <EmptyState
            title="Metrik tidak tersedia"
            description="Peran Anda tidak memiliki akses ke metrik."
          />
        ) : (
          <QueryBoundary
            loading={metrics.loading}
            error={metrics.error}
            onRetry={metrics.retry}
            skeleton="cards"
          >
            {view && (
              <>
                <MetricsSummary metrics={view.summary} />
                <div className="showcase-grid">
                  <MetricChart
                    title="Kartu per band"
                    description="Jumlah kartu menurut band skor"
                    data={view.byBand}
                  />
                  <MetricChart
                    title="Kartu per status"
                    description="Posisi kartu saat ini"
                    data={view.byStatus}
                  />
                  <MetricChart
                    title="Feedback analis"
                    description="Penilaian analis terhadap alert"
                    data={view.feedback}
                    unit="feedback"
                  />
                </div>
              </>
            )}
          </QueryBoundary>
        )}
      </div>
    </>
  );
}
