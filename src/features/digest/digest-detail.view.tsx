"use client";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  MetricsSummary,
  PageHeader,
  type QueueItem,
  QueueTable,
} from "@astria/ui";
import Link from "next/link";
import type { DigestRow } from "../../data/digests";

export function DigestDetailView({ digest, items }: { digest: DigestRow; items: QueueItem[] }) {
  return (
    <>
      <div className="showcase-screen-title">
        <Link href="/digests">← Kembali ke daftar digest</Link>
        <span className="showcase-callout">Data contoh · Tanpa koneksi layanan</span>
      </div>
      <PageHeader
        title={digest.id}
        description={digest.period}
        action={<Badge tone={digest.status === "Terkirim" ? "success" : "neutral"}>{digest.status}</Badge>}
      />
      <div className="a-stack">
        <MetricsSummary
          metrics={[
            { label: "Kartu", value: digest.cards },
            { label: "Tinggi/kritis", value: digest.high },
            { label: "Dibuat", value: digest.created },
          ]}
        />
        <Card>
          <CardHeader title="Ringkasan" />
          <CardContent>
            <p>{digest.summary}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Kartu dalam digest" />
          {items.length ? (
            <QueueTable items={items} />
          ) : (
            <CardContent>
              <p className="a-muted">Tidak ada kartu pada periode ini.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
