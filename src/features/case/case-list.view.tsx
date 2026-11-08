"use client";
import { Badge, BandChip, CaseList, type Column, PageHeader } from "@astria/ui";
import Link from "next/link";
import type { CaseRow } from "../../data/cases";

const statusTone = { Diselidiki: "info", "Menunggu laporan": "warning", Selesai: "success" } as const;

const columns: Column<CaseRow>[] = [
  {
    id: "id",
    header: "Kasus",
    cell: (row) => (
      <>
        <Link className="a-table-title" href={`/cases/${row.id}`}>
          {row.title}
        </Link>
        <small className="a-muted a-block">{row.id}</small>
      </>
    ),
    sortValue: (row) => row.id,
  },
  {
    id: "band",
    header: "Band",
    cell: (row) => <BandChip band={row.band} score={row.score} />,
    sortValue: (row) => row.score,
  },
  { id: "asset", header: "Aset", cell: (row) => row.asset },
  { id: "owner", header: "Petugas", cell: (row) => row.owner },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
  },
  { id: "updated", header: "Diperbarui", cell: (row) => row.updated },
];

export function CaseListView({ rows }: { rows: CaseRow[] }) {
  return (
    <>
      <PageHeader title="Kasus DFIR" description="Penyelidikan dan tindak lanjut insiden" />
      <CaseList rows={rows} columns={columns} rowKey={(row) => row.id} />
    </>
  );
}
