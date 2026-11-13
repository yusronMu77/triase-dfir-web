"use client";
import {
  Alert,
  AstriaGuidance,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  StatTile,
} from "@astria/ui";
import { describeError } from "../../lib/http/api-error";
import { QueryBoundary } from "../shared/query-boundary.view";
import type { JobView } from "./ingest.mapper";
import { useIngestJob } from "./use-ingest-job.hook";

export function IngestView() {
  const ingest = useIngestJob();
  return (
    <>
      <PageHeader title="Unggah alert" description="Impor file Hayabusa JSON atau JSONL bertag ATT&CK" />
      <div className="a-stack">
        <AstriaGuidance
          title="File dibaca langsung oleh layanan, bukan diunggah dari browser"
          expression="guide"
        >
          Masukkan path berkas yang sudah ada di folder impor server. Halaman ini tidak mengirim isi berkas.
          Progres diperbarui otomatis sampai impor selesai.
        </AstriaGuidance>

        <Card>
          <CardHeader title="Impor alert" description="Adapter dan path file di server" />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (ingest.canWrite) ingest.submit();
            }}
          >
            <CardContent>
              <Field label="Adapter" hint="Format file. Saat ini hanya Hayabusa.">
                {(props) => (
                  <Select {...props} defaultValue="hayabusa" disabled={!ingest.canWrite || ingest.submitting}>
                    <option value="hayabusa">Hayabusa (JSON / JSONL)</option>
                  </Select>
                )}
              </Field>
              <Field
                label="Path file di server"
                required
                hint="Relatif terhadap folder impor yang diizinkan. Tanpa '..'. Maksimal 300 karakter."
                error={ingest.errors.pathRef}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={ingest.form.pathRef}
                    placeholder="hayabusa/contoh-alert.jsonl"
                    maxLength={300}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={!ingest.canWrite || ingest.submitting}
                    onChange={(event) => ingest.setField("pathRef", event.target.value)}
                  />
                )}
              </Field>
              <Field
                label="SHA-256 file (opsional)"
                hint="Jika diisi, layanan menolak file yang tidak cocok. 64 karakter hex."
                error={ingest.errors.expectedSha256}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={ingest.form.expectedSha256}
                    placeholder="64 karakter hex"
                    maxLength={64}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={!ingest.canWrite || ingest.submitting}
                    onChange={(event) => ingest.setField("expectedSha256", event.target.value)}
                  />
                )}
              </Field>
              {!ingest.canWrite && (
                <Alert tone="info" title="Impor hanya untuk peran analis dan admin">
                  Peran Anda hanya dapat melihat status impor.
                </Alert>
              )}
              {ingest.startError !== null && (
                <Alert tone="danger" title="Impor tidak dimulai">
                  {describeError(ingest.startError)}
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={!ingest.canWrite}
                loading={ingest.submitting}
                loadingLabel="Mengirim…"
              >
                Mulai impor
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader title="Status impor" description="Job terakhir yang Anda mulai di sesi ini" />
          <CardContent>
            <QueryBoundary
              loading={ingest.jobLoading}
              error={ingest.jobError}
              onRetry={ingest.retryJob}
              empty={ingest.jobId === null}
              emptyState={
                <EmptyState
                  title="Belum ada impor"
                  description="Isi path file lalu mulai impor. Status akan tampil di sini."
                />
              }
            >
              {ingest.job ? <JobDetails job={ingest.job} alreadyImported={ingest.alreadyImported} /> : null}
            </QueryBoundary>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function JobDetails({ job, alreadyImported }: { job: JobView; alreadyImported: boolean }) {
  return (
    <div className="a-stack">
      <div role="status" aria-live="polite">
        <Badge tone={job.tone}>{job.statusLabel}</Badge> <small className="a-muted">ID job {job.jobId}</small>
      </div>
      {alreadyImported && (
        <Alert tone="info" title="File ini sudah pernah diimpor">
          Layanan menampilkan job yang sudah ada, tidak membuat impor baru.
        </Alert>
      )}
      {job.progress !== null && !job.terminal && (
        <progress max={100} value={job.progress} aria-label="Perkiraan progres impor" />
      )}
      {job.progress === null && !job.terminal && <progress aria-label="Progres impor belum diketahui" />}
      {job.terminal && job.succeeded && (
        <Alert tone="success" title="Impor selesai">
          Seluruh baris valid tercatat.
        </Alert>
      )}
      {job.status === "completed_with_errors" && (
        <Alert tone="warning" title="Impor selesai dengan baris ditolak">
          Baris yang gagal dibaca tidak masuk ke triase. Lihat contohnya di bawah.
        </Alert>
      )}
      {job.status === "failed" && (
        <Alert tone="danger" title="Impor gagal">
          {job.errorText ?? "Layanan tidak dapat menyelesaikan impor. Periksa file lalu coba lagi."}
        </Alert>
      )}
      <div className="a-stat-grid">
        <StatTile label="Baris valid" value={job.valid ?? "-"} />
        <StatTile label="Baris ditolak" value={job.rejected ?? "-"} />
        <StatTile label="Baris kosong" value={job.blank ?? "-"} />
        <StatTile label="Total baris" value={job.totalLines ?? "-"} />
      </div>
      {!job.terminal && job.progress !== null && (
        <small className="a-muted">
          Perkiraan {job.progress}% berdasarkan baris terakhir ({job.lastRecord} dari {job.totalLines}).
        </small>
      )}
      {job.errorSamples.length > 0 && (
        <div className="a-stack">
          <strong>Contoh baris ditolak</strong>
          <ul>
            {job.errorSamples.map((sample) => (
              <li key={`${sample.recordNo}-${sample.code}`}>
                Baris {sample.recordNo}: <code>{sample.code}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
      <small className="a-muted">
        SHA-256 <code title={job.fileSha256}>{job.fileSha256.slice(0, 12)}…</code>
      </small>
    </div>
  );
}
