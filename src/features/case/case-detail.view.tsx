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
  type Column,
  DataTable,
  EmptyState,
  EntityRow,
  InlineLoading,
  PageHeader,
} from "@astria/ui";
import Link from "next/link";
import { QueryBoundary } from "../shared/query-boundary.view";
import {
  CASE_ID_HINT,
  type CaseCustody,
  type CaseSummary,
  type CustodyRow,
  describeReportError,
  isCaseId,
  shortHash,
} from "./case.mapper";
import { useCaseCustody } from "./use-case-custody.hook";
import { useCaseDetail } from "./use-case-detail.hook";
import { useCaseReport } from "./use-case-report.hook";
import { useCaseTimeline } from "./use-case-timeline.hook";

export function CaseDetailView({ id }: { id: string }) {
  const detail = useCaseDetail(id);
  const timeline = useCaseTimeline(id);
  const custody = useCaseCustody(id);
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

          <QueryBoundary
            loading={custody.loading}
            error={custody.error}
            onRetry={custody.retry}
            skeleton="rows"
          >
            {custody.data && <CustodyCard custody={custody.data} />}
          </QueryBoundary>

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

const HashCell = ({ value }: { value: string | null }) =>
  value ? (
    <span className="a-mono" title={value}>
      {shortHash(value)}
    </span>
  ) : (
    "-"
  );

const CUSTODY_COLUMNS: Column<CustodyRow>[] = [
  { id: "seq", header: "No", cell: (r) => r.seq },
  {
    id: "time",
    header: "Waktu (WIB)",
    cell: (r) => (
      <time dateTime={r.ts} title={r.ts}>
        {r.time}
      </time>
    ),
  },
  { id: "actor", header: "Aktor", cell: (r) => <span className="a-mono">{r.actor}</span> },
  {
    id: "action",
    header: "Aksi",
    cell: (r) => (
      <Badge tone={r.actionTone} title={r.action}>
        {r.actionLabel}
      </Badge>
    ),
  },
  {
    id: "artifact",
    header: "Artefak",
    cell: (r) =>
      r.artifactId || r.detail ? (
        <span>
          {r.artifactId && <span className="a-mono">{r.artifactId}</span>}
          {r.artifactId && r.detail ? " · " : null}
          {r.detail}
        </span>
      ) : (
        "-"
      ),
  },
  { id: "sha256", header: "SHA-256 artefak", cell: (r) => <HashCell value={r.sha256} /> },
  { id: "entry", header: "Hash entri", cell: (r) => <HashCell value={r.entryHash} /> },
];

/** Custody log as stored by dfir. The integrity verdict is dfir's `chain_ok`; the browser does not recompute it. */
function CustodyCard({ custody }: { custody: CaseCustody }) {
  if (!custody.rows.length) {
    return (
      <Card>
        <CardHeader title="Rantai custody" />
        <CardContent>
          <EmptyState title="Belum ada entri custody" description="dfir belum mencatat penanganan bukti." />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader
        title="Rantai custody"
        description={`${custody.rows.length} entri berantai hash, urut menurut nomor`}
      />
      <CardContent>
        <div className="a-stack">
          {custody.chainOk ? (
            <Alert tone="success" title="Rantai custody utuh">
              Hasil cek layanan dfir atas seluruh entri: setiap hash entri cocok dengan entri sebelumnya.
            </Alert>
          ) : (
            <Alert tone="danger" title="Rantai custody terputus">
              Layanan dfir menemukan entri yang tidak cocok dengan rantai hash. Jangan pakai bukti kasus ini
              sebelum diperiksa.
            </Alert>
          )}
          <DataTable
            caption="Rantai custody kasus"
            columns={CUSTODY_COLUMNS}
            rows={custody.rows}
            rowKey={(r) => r.key}
          />
        </div>
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
