"use client";
import { Badge, Button, type Column, DigestList, EmptyState, FormPanel, PageHeader } from "@astria/ui";
import Link from "next/link";
import { useSession } from "../session/use-session.hook";
import { QueryBoundary } from "../shared/query-boundary.view";
import type { DigestListItem } from "./digest.mapper";
import { useDigestList } from "./use-digest-list.hook";
import { useDigestRun } from "./use-digest-run.hook";

const columns: Column<DigestListItem>[] = [
  {
    id: "id",
    header: "Digest",
    cell: (row) => <Link href={row.href}>{row.id}</Link>,
    sortValue: (row) => row.id,
  },
  { id: "jenis", header: "Jenis", cell: (row) => row.jenis },
  { id: "periode", header: "Periode", cell: (row) => row.periode },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge tone={row.statusTone}>{row.statusLabel}</Badge>,
  },
  { id: "terlambat", header: "Terlambat", cell: (row) => (row.terlambat ? "Ya" : "Tidak") },
];

export function DigestListView() {
  const list = useDigestList();
  const run = useDigestRun();
  const session = useSession();

  return (
    <>
      <PageHeader title="Digest" description="Ringkasan operasional per periode" />
      <div className="a-stack">
        {session.can("digests:run") && (
          <FormPanel
            title="Jalankan digest manual"
            description="Susun digest sekarang, di luar jadwal."
            fields={[
              {
                name: "alasan",
                label: "Alasan (opsional)",
                type: "textarea",
                hint: "Maksimal 500 karakter.",
              },
            ]}
            submitLabel="Jalankan digest"
            confirmation={{
              title: "Jalankan digest sekarang?",
              description: "Digest akan disusun untuk periode terbaru dan permintaan ini dicatat di audit.",
            }}
            successMessage="Permintaan digest diterima. Daftar akan diperbarui."
            onSubmit={run.submit}
          />
        )}
        <QueryBoundary
          loading={list.loading}
          error={list.error}
          onRetry={list.retry}
          empty={list.rows.length === 0}
          emptyState={
            <EmptyState
              title="Belum ada digest"
              description="Digest terbit sesuai jadwal harian dan akan muncul di sini."
            />
          }
          skeleton="rows"
        >
          <DigestList rows={list.rows} columns={columns} rowKey={(row) => row.id} />
        </QueryBoundary>
        {list.hasMore && (
          <div>
            <Button
              variant="secondary"
              onClick={list.loadMore}
              disabled={list.loadingMore}
              loading={list.loadingMore}
              loadingLabel="Memuat…"
            >
              Muat lebih banyak
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
