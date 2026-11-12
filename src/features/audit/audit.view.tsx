"use client";
import {
  Alert,
  AuditBroken,
  AuditLog,
  AuditValid,
  Button,
  type Column,
  EmptyState,
  Icon,
  PageHeader,
} from "@astria/ui";
import { describeError } from "../../lib/http/api-error";
import { QueryBoundary } from "../shared/query-boundary.view";
import type { AuditRowView, VerifyView } from "./audit.mapper";
import { useAuditLog } from "./use-audit-log.hook";
import { useAuditVerify } from "./use-audit-verify.hook";

const columns: Column<AuditRowView>[] = [
  { id: "seq", header: "No", cell: (row) => row.seq, sortValue: (row) => row.seq },
  { id: "time", header: "Waktu", cell: (row) => row.time },
  { id: "actor", header: "Pelaku", cell: (row) => row.actor },
  { id: "action", header: "Tindakan", cell: (row) => row.action },
  { id: "subject", header: "Objek", cell: (row) => row.subject },
  {
    id: "hash",
    header: "Hash",
    cell: (row) => <code title={row.hashFull}>{row.hashShort}</code>,
  },
];

export function AuditView() {
  const log = useAuditLog();
  const verify = useAuditVerify();
  return (
    <>
      <PageHeader
        title="Audit"
        description="Riwayat tindakan dengan rantai hash"
        action={
          verify.canVerify ? (
            <Button onClick={verify.verify} disabled={verify.running}>
              <Icon name="shield-check" size={16} />
              {verify.running ? "Memeriksa…" : "Verifikasi rantai"}
            </Button>
          ) : undefined
        }
      />
      <div className="a-stack">
        <VerifyStatus view={verify.view} />
        {verify.error && (
          <Alert
            tone="danger"
            title="Verifikasi tidak selesai"
            action={
              <Button variant="secondary" onClick={verify.retry}>
                Coba lagi
              </Button>
            }
          >
            {describeError(verify.error)}
          </Alert>
        )}
        <QueryBoundary
          loading={log.loading}
          error={log.rows.length === 0 ? log.error : null}
          onRetry={log.retry}
          empty={log.empty}
          emptyState={
            <EmptyState
              title="Belum ada catatan audit"
              description="Tindakan yang tercatat akan muncul di sini."
            />
          }
        >
          <AuditLog rows={log.rows} columns={columns} rowKey={(row) => String(row.seq)} />
          {log.error !== null && log.rows.length > 0 && (
            <Alert
              tone="danger"
              title="Halaman berikutnya gagal dimuat"
              action={
                <Button variant="secondary" onClick={log.retry}>
                  Coba lagi
                </Button>
              }
            >
              {describeError(log.error)}
            </Alert>
          )}
          {log.hasMore && (
            <div className="a-row">
              <Button
                variant="secondary"
                onClick={log.loadMore}
                loading={log.loadingMore}
                loadingLabel="Memuat…"
              >
                Muat lebih banyak
              </Button>
            </div>
          )}
        </QueryBoundary>
      </div>
    </>
  );
}

function VerifyStatus({ view }: { view: VerifyView }) {
  return (
    <div role="status" aria-live="polite">
      {view.kind === "running" && (
        <Alert tone="info" title="Verifikasi sedang berjalan">
          Sudah diperiksa {view.checked} entri.
        </Alert>
      )}
      {view.kind === "valid" && (
        <AuditValid>
          {view.checked} entri diperiksa
          {view.toSeq !== null
            ? ` (nomor ${view.fromSeq} sampai ${view.toSeq})`
            : ` (mulai nomor ${view.fromSeq})`}
          . {view.anchorText}.
        </AuditValid>
      )}
      {view.kind === "broken" && (
        <AuditBroken>
          {view.firstBadSeq !== null
            ? `Entri nomor ${view.firstBadSeq} pertama kali tidak sesuai: ${view.reasonText}.`
            : `Pemeriksaan gagal: ${view.reasonText}.`}{" "}
          {view.checked} entri diperiksa. {view.anchorText}.
        </AuditBroken>
      )}
      {view.kind === "failed" && (
        <Alert tone="danger" title="Verifikasi gagal">
          Layanan audit tidak dapat menyelesaikan pemeriksaan. Coba lagi beberapa saat lagi.
        </Alert>
      )}
    </div>
  );
}
