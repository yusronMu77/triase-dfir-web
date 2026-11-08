"use client";
import { Badge, type Column, DigestList, PageHeader } from "@astria/ui";
import Link from "next/link";
import type { DigestRow } from "../../data/digests";

const columns: Column<DigestRow>[] = [
  {
    id: "id",
    header: "Digest",
    cell: (row) => <Link href={`/digests/${row.id}`}>{row.id}</Link>,
    sortValue: (row) => row.id,
  },
  { id: "period", header: "Periode", cell: (row) => row.period },
  { id: "created", header: "Dibuat", cell: (row) => row.created },
  { id: "cards", header: "Kartu", cell: (row) => row.cards, sortValue: (row) => row.cards },
  { id: "high", header: "Tinggi/kritis", cell: (row) => row.high, sortValue: (row) => row.high },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge tone={row.status === "Terkirim" ? "success" : "neutral"}>{row.status}</Badge>,
  },
];

export function DigestListView({ rows }: { rows: DigestRow[] }) {
  return (
    <>
      <PageHeader title="Digest" description="Ringkasan operasional per periode" />
      <DigestList rows={rows} columns={columns} rowKey={(row) => row.id} />
    </>
  );
}
