"use client";
import { AuditBroken, AuditLog, AuditValid, Button, type Column, Icon, PageHeader } from "@astria/ui";
import type { AuditRow } from "../../data/audit";
import { useAuditVerify } from "./use-audit-verify.hook";

const columns: Column<AuditRow>[] = [
  { id: "seq", header: "No", cell: (row) => row.seq, sortValue: (row) => row.seq },
  { id: "time", header: "Waktu", cell: (row) => row.time },
  { id: "actor", header: "Pelaku", cell: (row) => row.actor },
  { id: "action", header: "Tindakan", cell: (row) => row.action },
  { id: "subject", header: "Objek", cell: (row) => row.subject },
  { id: "hash", header: "Hash", cell: (row) => <code>{row.hash}</code> },
];

export function AuditView({ rows }: { rows: AuditRow[] }) {
  const audit = useAuditVerify(rows);
  return (
    <>
      <PageHeader
        title="Audit"
        description="Riwayat tindakan dengan rantai hash"
        action={
          <Button onClick={audit.verify} disabled={audit.status === "checking"}>
            <Icon name="shield-check" size={16} />
            {audit.status === "checking" ? "Memeriksa…" : "Verifikasi rantai"}
          </Button>
        }
      />
      <div className="a-stack">
        <div role="status" aria-live="polite">
          {audit.status === "valid" && <AuditValid />}
          {audit.status === "broken" && (
            <AuditBroken>Rantai terputus pada entri nomor {audit.brokenAt}.</AuditBroken>
          )}
        </div>
        <AuditLog rows={rows} columns={columns} rowKey={(row) => String(row.seq)} />
      </div>
    </>
  );
}
