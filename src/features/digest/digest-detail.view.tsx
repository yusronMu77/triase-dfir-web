"use client";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EntityRow,
  InlineLoading,
  MetricsSummary,
  PageHeader,
} from "@astria/ui";
import Link from "next/link";
import { QueryBoundary } from "../shared/query-boundary.view";
import { type DigestDetail, describeDocumentError, isPublished } from "./digest.mapper";
import { useDigestDetail } from "./use-digest-detail.hook";
import { useDigestDocument } from "./use-digest-document.hook";

export function DigestDetailView({ id }: { id: string }) {
  const detail = useDigestDetail(id);
  const doc = useDigestDocument(id, detail.data ? isPublished(detail.data.status) : false);

  return (
    <>
      <Link href="/digests">← Kembali ke daftar digest</Link>
      <PageHeader
        title={id}
        description={detail.data?.periode}
        action={
          detail.data ? <Badge tone={detail.data.statusTone}>{detail.data.statusLabel}</Badge> : undefined
        }
      />
      <QueryBoundary loading={detail.loading} error={detail.error} onRetry={detail.retry} skeleton="cards">
        {detail.data && <DigestBody digest={detail.data} doc={doc} />}
      </QueryBoundary>
    </>
  );
}

function DigestBody({ digest, doc }: { digest: DigestDetail; doc: ReturnType<typeof useDigestDocument> }) {
  const published = isPublished(digest.status);
  return (
    <div className="a-stack">
      <MetricsSummary
        metrics={[
          { label: "Jenis", value: digest.jenis },
          { label: "Percobaan", value: digest.percobaan },
          { label: "Terlambat", value: digest.terlambat ? `${digest.terlambatMenit ?? 0} menit` : "Tidak" },
        ]}
      />
      <Card>
        <CardHeader title="Metadata" />
        <CardContent>
          <div className="a-stack">
            <EntityRow label="Dijadwalkan" value={digest.dijadwalkanPada} />
            <EntityRow label="Dijalankan" value={digest.dijalankanPada} />
            <EntityRow label="Mode narasi" value={digest.modeNarasi} />
            <EntityRow label="Versi template" value={digest.versiTemplat ?? "-"} />
            <EntityRow label="SHA-256" value={<span className="a-mono">{digest.sha256 ?? "-"}</span>} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          title="Dokumen"
          action={
            doc.url ? (
              <a
                className="a-button a-button-secondary a-button-sm"
                href={doc.url}
                download={`${digest.id}.html`}
              >
                Unduh HTML
              </a>
            ) : undefined
          }
        />
        <CardContent>
          {!published ? (
            <p className="a-muted">
              Dokumen belum tersedia. Digest ini berstatus {digest.statusLabel.toLowerCase()}.
            </p>
          ) : doc.error ? (
            <Alert
              tone="danger"
              title="Dokumen gagal dimuat"
              action={
                <Button variant="secondary" size="sm" onClick={doc.retry}>
                  Coba lagi
                </Button>
              }
            >
              {describeDocumentError(doc.error)}
            </Alert>
          ) : doc.previewHtml ? (
            // Published HTML from the server, shown in a sandboxed iframe with no `allow-scripts`.
            <iframe
              title={`Dokumen digest ${digest.id}`}
              srcDoc={doc.previewHtml}
              sandbox=""
              style={{ width: "100%", height: "70vh", border: 0 }}
            />
          ) : (
            <InlineLoading>Memuat dokumen…</InlineLoading>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
