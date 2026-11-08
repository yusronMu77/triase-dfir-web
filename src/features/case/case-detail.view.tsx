"use client";
import {
  Badge,
  CaseOverview,
  CaseReport,
  CaseTimeline,
  EvidenceChip,
  NarrationBadge,
  PageHeader,
  type TimelineEvent,
} from "@astria/ui";
import Link from "next/link";
import type { CaseRow } from "../../data/cases";

export function CaseDetailView({
  row,
  events,
  evidence,
}: {
  row: CaseRow;
  events: TimelineEvent[];
  evidence: { id: string; href: string }[];
}) {
  return (
    <>
      <div className="showcase-screen-title">
        <Link href="/cases">← Kembali ke kasus</Link>
        <span className="showcase-callout">Data contoh · Tanpa koneksi layanan</span>
      </div>
      <PageHeader
        title={row.id}
        description={row.title}
        action={<Badge tone="warning">TEMPLATE · narasi dari templat</Badge>}
      />
      <div className="showcase-detail-grid">
        <div className="a-stack">
          <CaseOverview
            id={row.id}
            title="Ringkasan kasus"
            band={row.band}
            score={row.score}
            entities={[
              { label: "Aset", value: row.asset },
              { label: "Petugas", value: row.owner },
              { label: "Status", value: row.status },
              { label: "Kartu asal", value: <Link href={`/cards/${row.cardId}`}>{row.cardId}</Link> },
            ]}
          />
          <CaseTimeline events={events} />
        </div>
        <div className="a-stack">
          <CaseReport verified>
            <NarrationBadge>Narasi templat deterministik</NarrationBadge>
            <p>
              Akun layanan dipakai dari aset yang tidak biasa, lalu akun lokal baru dibuat. Setiap klaim
              menunjuk bukti:{" "}
              {evidence.map((item) => (
                <EvidenceChip key={item.id} href={item.href}>
                  {item.id}
                </EvidenceChip>
              ))}
            </p>
          </CaseReport>
        </div>
      </div>
    </>
  );
}
