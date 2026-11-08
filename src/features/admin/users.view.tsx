"use client";
import { Badge, type Column, ListPanel, PageHeader, RoleChip } from "@astria/ui";
import type { UserRow } from "../../data/admin";

const columns: Column<UserRow>[] = [
  { id: "name", header: "Nama", cell: (row) => row.name, sortValue: (row) => row.name },
  { id: "role", header: "Peran", cell: (row) => <RoleChip role={row.role} /> },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge tone={row.status === "Aktif" ? "success" : "neutral"}>{row.status}</Badge>,
  },
  { id: "seen", header: "Terakhir aktif", cell: (row) => row.lastSeen },
];

export function UsersView({ rows }: { rows: UserRow[] }) {
  return (
    <>
      <PageHeader title="Pengguna dan peran" description="Akun dan peran akses Astria" />
      <ListPanel
        title="Pengguna dan peran"
        description="Peran menentukan menu dan tindakan yang tersedia."
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
      />
    </>
  );
}
