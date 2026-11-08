"use client";
import { Badge, type Column, PageHeader, PairingCode, PairingList } from "@astria/ui";
import type { IdentityRow } from "../../data/admin";
import { usePairing } from "./use-pairing.hook";

const columns: Column<IdentityRow>[] = [
  { id: "user", header: "Pengguna", cell: (row) => row.user },
  { id: "channel", header: "Kanal", cell: (row) => row.channel },
  { id: "handle", header: "Akun chat", cell: (row) => row.handle },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge tone={row.status === "Terhubung" ? "success" : "neutral"}>{row.status}</Badge>,
  },
];

export function IdentitiesView({
  rows,
  initialPairing,
}: {
  rows: IdentityRow[];
  initialPairing: { code: string; expiresAt: string };
}) {
  const pairing = usePairing(initialPairing);
  return (
    <>
      <PageHeader title="Identitas dan pairing" description="Hubungkan akun chat dengan identitas Astria" />
      <div className="showcase-detail-grid">
        <PairingList rows={rows} columns={columns} rowKey={(row) => row.id} />
        <PairingCode code={pairing.code} expiresAt={pairing.expiresAt} onRegenerate={pairing.regenerate} />
      </div>
    </>
  );
}
