"use client";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CaseReport,
  CaseTimeline,
  EntityRow,
  InlineLoading,
  PageHeader,
} from "@astria/ui";
import Link from "next/link";
import { QueryBoundary } from "../shared/query-boundary.view";
import { CASE_ID_HINT, type CaseSummary, describeReportError, isCaseId } from "./case.mapper";
import { useCaseDetail } from "./use-case-detail.hook";
import { useCaseReport } from "./use-case-report.hook";
import { useCaseTimeline } from "./use-case-timeline.hook";

export function CaseDetailView({ id }: { id: string }) {
  const detail = useCaseDetail(id);
  const timeline = useCaseTimeline(id);
  const report = useCaseReport(id);
  const valid = isCaseId(id);

  return (
    <>
      <Link href="/cases">← Kembali ke daftar kasus</Link>
      <PageHeader
        title={id}
        description={detail.data ? `Kartu asal ${detail.data.cardId}` : undefined}
        action={
          detail.data ? <Badge tone={detail.data.statusTone}>{detail.data.statusLabel}</Badge> : undefined
        }
      />
      {!valid ? (
        <Alert tone="danger" title="ID kasus tidak valid">
          {CASE_ID_HINT}
        </Alert>
      ) : (
        <div className="a-stack">
          <QueryBoundary
            loading={detail.loading}
            error={detail.error}
            onRetry={detail.retry}
            skeleton="cards"
          >
            {detail.data && <SummaryCard summary={detail.data} />}
          </QueryBoundary>

          <QueryBoundary
            loading={timeline.loading}
            error={timeline.error}
            onRetry={timeline.retry}
            skeleton="rows"
          >
            <CaseTimeline events={timeline.events} />
          </QueryBoundary>
          {timeline.hasMore && (
            <div>
              <Button
                variant="secondary"
                onClick={timeline.loadMore}
                disabled={timeline.loadingMore}
                loading={timeline.loadingMore}
                loadingLabel="Memuat…"
              >
                Muat lebih banyak
              </Button>
            </div>
          )}

          {detail.data && <ReportCard summary={detail.data} caseId={id} report={report} />}
        </div>
      )}
    </>
  );
}

function SummaryCard({ summary }: { summary: CaseSummary }) {
  const rows = [
    {
      label: "Kartu asal",
      value: (
        <Link href={`/cards/${encodeURIComponent(summary.cardId)}`}>
          {summary.cardId} · versi {summary.cardVersion}
        </Link>
      ),
    },
    { label: "Diminta oleh", value: summary.requestedBy },
    { label: "Rentang waktu", value: summary.windowLabel },
    { label: "Dibuat", value: summary.createdAt },
    { label: "Diperbarui", value: summary.updatedAt },
  ];
  return (
    <Card>
      <CardHeader title="Ringkasan kasus" description={summary.id} />
      <CardContent>
        <div className="a-stack">
          {rows.map((row) => (
            <EntityRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
        <p>
          <strong>Keterbatasan</strong>
        </p>
        {summary.limitations.length ? (
          <ul>
            {summary.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="a-muted">Tidak ada keterbatasan yang dicatat.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReportCard({
  summary,
  caseId,
  report,
}: {
  summary: CaseSummary;
  caseId: string;
  report: ReturnType<typeof useCaseReport>;
}) {
  if (!summary.report) return <CaseReport />;
  return (
    <CaseReport
      action={
        report.url ? (
          <a
            className="a-button a-button-secondary a-button-sm"
            href={report.url}
            download={`${caseId}-laporan.html`}
          >
            Unduh HTML
          </a>
        ) : undefined
      }
    >
      {!report.requested ? (
        <div className="a-stack">
          <p>
            Laporan versi {summary.report.version} tersedia. SHA-256:{" "}
            <span className="a-mono">{summary.report.sha256}</span>
          </p>
          <div>
            <Button variant="secondary" onClick={report.request}>
              Tampilkan laporan
            </Button>
          </div>
        </div>
      ) : report.error ? (
        <Alert
          tone="danger"
          title="Laporan gagal dimuat"
          action={
            <Button variant="secondary" size="sm" onClick={report.retry}>
              Coba lagi
            </Button>
          }
        >
          {describeReportError(report.error)}
        </Alert>
      ) : report.url ? (
        // The report is HTML from the server. A sandboxed iframe with no `allow-scripts` renders it without running code.
        <iframe
          title={`Laporan kasus ${caseId}`}
          src={report.url}
          sandbox=""
          style={{ width: "100%", height: "70vh", border: 0 }}
        />
      ) : (
        <InlineLoading>Memuat laporan…</InlineLoading>
      )}
    </CaseReport>
  );
}
