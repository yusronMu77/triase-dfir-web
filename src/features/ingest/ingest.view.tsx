"use client";
import { AstriaGuidance, PageHeader, UploadPanel } from "@astria/ui";
import { useIngestJob } from "./use-ingest-job.hook";

export function IngestView() {
  const job = useIngestJob();
  return (
    <>
      <PageHeader title="Unggah alert" description="Berkas Hayabusa JSON atau JSONL bertag ATT&CK" />
      <div className="a-stack">
        <AstriaGuidance title="Sumber alert demo berupa berkas" expression="guide">
          Pilih berkas hasil Hayabusa. Batas ukuran 20 MB. Pemrosesan di halaman ini hanya simulasi lokal.
        </AstriaGuidance>
        <UploadPanel
          state={job.state}
          file={job.file}
          progress={job.progress}
          error={job.error}
          summary={job.summary}
          onFileSelect={job.select}
          onSubmit={job.submit}
          onReset={job.reset}
        />
      </div>
    </>
  );
}
