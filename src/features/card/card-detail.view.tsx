"use client";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CaseOverview,
  CaseTimeline,
  EntityRow,
  EvidenceChip,
  FactorRow,
  Hypothesis,
  PageHeader,
  type QueueItem,
  TechniqueChip,
  VerifierBadge,
} from "@astria/ui";
import Link from "next/link";
import { events, evidence } from "../../data/fixtures";
export function CardDetailView({ item }: { item: QueueItem }) {
  return (
    <>
      <div className="showcase-screen-title">
        <Link href="/cards">← Kembali ke antrean</Link>
        <span className="showcase-callout">Data contoh · Tanpa koneksi layanan</span>
      </div>
      <PageHeader
        title={item.id}
        description={item.title}
        action={<Badge tone="warning">TEMPLATE · narasi dari templat, bukan model</Badge>}
      />
      <div className="showcase-detail-grid">
        <div className="a-stack">
          <CaseOverview
            id={item.id}
            title="Ringkasan kartu"
            band={item.band}
            score={item.score}
            entities={[
              { label: "Aset", value: item.asset },
              { label: "Petugas", value: item.assignee || "Belum ada" },
            ]}
          >
            <div className="a-row">
              <TechniqueChip>T1110.001</TechniqueChip>
              <VerifierBadge result="pass">Contoh hasil pemeriksa</VerifierBadge>
            </div>
            <Hypothesis title="Hipotesis contoh" evidence={evidence}>
              Aktivitas autentikasi berulang perlu ditinjau bersama perubahan identitas.
            </Hypothesis>
          </CaseOverview>
          <CaseTimeline events={events} />
        </div>
        <div className="a-stack">
          <Card>
            <CardHeader title="Faktor skor contoh" />
            <CardContent>
              {(["L", "T", "A", "K", "R"] as const).map((factor, i) => (
                <FactorRow
                  key={factor}
                  factor={factor}
                  label={["Level", "Teknik", "Aset", "Korelasi", "Riwayat"][i]}
                  value={[18, 16, 15, 12, 10][i]}
                />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Bukti contoh" />
            <CardContent>
              {evidence.map((e, i) => (
                <div id={e.id} key={e.id}>
                  <EvidenceChip href={`#${e.id}`}>{e.id}</EvidenceChip>
                  <EntityRow label="Sumber" value="Hayabusa JSON" />
                  <p className="a-muted">{events[i].description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
