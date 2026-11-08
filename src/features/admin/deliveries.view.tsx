"use client";
import { Badge, type Column, DeliveryLog, PageHeader } from "@astria/ui";
import type { DeliveryRow } from "../../data/admin";

const columns: Column<DeliveryRow>[] = [
  { id: "time", header: "Waktu", cell: (row) => row.time },
  { id: "channel", header: "Kanal", cell: (row) => row.channel },
  { id: "subject", header: "Perihal", cell: (row) => row.subject },
  {
    id: "result",
    header: "Hasil",
    cell: (row) => <Badge tone={row.result === "Terkirim" ? "success" : "danger"}>{row.result}</Badge>,
  },
  { id: "note", header: "Catatan", cell: (row) => row.note },
];

export function DeliveriesView({ rows }: { rows: DeliveryRow[] }) {
  return (
    <>
      <PageHeader title="Log pengiriman" description="Hasil pengiriman notifikasi per kanal" />
      <DeliveryLog rows={rows} columns={columns} rowKey={(row) => row.id} />
    </>
  );
}
