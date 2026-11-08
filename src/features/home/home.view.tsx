"use client";
import {
  AstriaGuidance,
  Badge,
  Card,
  CardHeader,
  MetricsSummary,
  PageHeader,
  type QueueItem,
  QueueTable,
} from "@astria/ui";
import Link from "next/link";

export function HomeView({
  items,
  metrics,
}: {
  items: QueueItem[];
  metrics: { label: string; value: string; meta: string }[];
}) {
  return (
    <>
      <PageHeader
        title="Beranda"
        description="Ringkasan operasional hari ini"
        action={<Badge tone="info">Data contoh</Badge>}
      />
      <div className="a-stack">
        <AstriaGuidance
          title="Mulai dari kartu dengan SLA terdekat"
          expression="analyze"
          action={
            <Link className="showcase-link" href="/cards">
              Buka antrean
            </Link>
          }
        >
          Setiap klaim pada kartu menunjuk ID bukti. Skor dan keputusan dihitung deterministik; model hanya
          menulis narasi.
        </AstriaGuidance>
        <MetricsSummary metrics={metrics} />
        <Card>
          <CardHeader
            title="Perlu ditinjau"
            description="Empat kartu teratas menurut sisa SLA, lalu skor"
            action={<Link href="/cards">Lihat semua</Link>}
          />
          <QueueTable items={items} />
        </Card>
      </div>
    </>
  );
}
