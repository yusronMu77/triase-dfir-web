"use client";
import {
  AstriaGuidance,
  Card,
  CardHeader,
  EmptyState,
  MetricsSummary,
  PageHeader,
  QueueTable,
} from "@astria/ui";
import Link from "next/link";
import { ErrorPanel, QueryBoundary } from "../shared/query-boundary.view";
import { useHome } from "./use-home.hook";

export function HomeView() {
  const home = useHome();

  return (
    <>
      <PageHeader title="Beranda" description="Ringkasan operasional" />
      <div className="a-stack">
        {home.sessionError && <ErrorPanel error={home.sessionError} onRetry={home.retrySession} />}
        <AstriaGuidance
          title="Mulai dari kartu terbaru"
          expression="analyze"
          action={
            home.cards.allowed ? (
              <Link className="showcase-link" href="/cards">
                Buka antrean
              </Link>
            ) : undefined
          }
        >
          Setiap klaim pada kartu menunjuk ID bukti. Skor dan keputusan dihitung deterministik; model hanya
          menulis narasi.
        </AstriaGuidance>

        {home.metrics.allowed ? (
          <QueryBoundary
            loading={home.metrics.loading}
            error={home.metrics.error}
            onRetry={home.metrics.retry}
            skeleton="cards"
          >
            {home.metrics.view && <MetricsSummary metrics={home.metrics.view.summary} />}
          </QueryBoundary>
        ) : (
          <EmptyState
            title="Ringkasan metrik tidak tersedia"
            description="Peran Anda tidak memiliki akses ke metrik. Gunakan menu untuk bagian yang tersedia."
          />
        )}

        <Card>
          <CardHeader
            title="Kartu terbaru"
            description="Empat kartu terbaru. Urutan mengikuti layanan tiket, bukan urutan SLA."
            action={home.cards.allowed ? <Link href="/cards">Lihat semua</Link> : undefined}
          />
          {home.cards.allowed ? (
            <QueryBoundary
              loading={home.cards.loading}
              error={home.cards.error}
              onRetry={home.cards.retry}
              empty={home.cards.items.length === 0}
              emptyState={
                <EmptyState
                  title="Belum ada kartu"
                  description="Kartu muncul setelah triase menghasilkannya."
                />
              }
            >
              <QueueTable items={home.cards.items} />
            </QueryBoundary>
          ) : (
            <EmptyState
              title="Antrean kartu tidak tersedia"
              description="Peran Anda tidak memiliki akses ke kartu."
            />
          )}
        </Card>
      </div>
    </>
  );
}
