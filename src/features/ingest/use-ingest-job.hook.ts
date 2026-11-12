"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { queryKeys } from "../../lib/query/query-keys";
import { ingestService } from "../../services/ingest.service";
import type { IngestAccepted, IngestRequest } from "../../services/ingest.types";
import { useSession } from "../session/use-session.hook";
import {
  buildIngestRequest,
  EMPTY_INGEST_FORM,
  type IngestForm,
  type IngestFormErrors,
  isTerminalJobStatus,
  toJobView,
} from "./ingest.mapper";

/** Polling interval while a job runs. The SSE event `job.progress` also refetches the job; polling is the fallback. */
export const JOB_POLL_MS = 2000;

/**
 * Starts an ingest job and follows it until its status is final.
 * Only the path reference is sent; the browser does not upload the file.
 */
export function useIngestJob(pollMs = JOB_POLL_MS) {
  const { can } = useSession();
  const [form, setForm] = useState<IngestForm>(EMPTY_INGEST_FORM);
  const [errors, setErrors] = useState<IngestFormErrors>({});
  const [jobId, setJobId] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<IngestAccepted | null>(null);

  const start = useMutation({
    mutationFn: (body: IngestRequest) => ingestService.start(body),
    onSuccess: (data) => {
      setAccepted(data);
      setJobId(data.job_id);
    },
  });

  const job = useQuery({
    queryKey: queryKeys.ingest.job(jobId ?? ""),
    queryFn: ({ signal }) => ingestService.job(jobId ?? "", signal),
    enabled: jobId !== null,
    // Stop on a final status or after an error; the retry button refetches on demand.
    refetchInterval: (query) => {
      if (query.state.error) return false;
      return isTerminalJobStatus(query.state.data?.status) ? false : pollMs;
    },
  });

  const setField = useCallback((key: keyof IngestForm, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }, []);

  const submit = useCallback(() => {
    const result = buildIngestRequest(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    start.mutate(result.body);
  }, [form, start]);

  const reset = useCallback(() => {
    setJobId(null);
    setAccepted(null);
    start.reset();
  }, [start]);

  const data = job.data ? toJobView(job.data) : null;
  const jobLoading = jobId !== null && job.data === undefined && job.error === null;

  return {
    canWrite: can("ingest:write"),
    form,
    errors,
    setField,
    submit,
    reset,
    submitting: start.isPending,
    /** Error from starting the job (validation, forbidden, unavailable). Shown inline. */
    startError: start.error,
    /** True when the job exists but the first read is still in flight. */
    jobLoading,
    /** Error from reading the job. The boundary shows it with a retry. */
    jobError: jobId !== null && !job.data ? job.error : null,
    retryJob: () => void job.refetch(),
    /** `created: false` means this file was imported before and the existing job is shown. */
    alreadyImported: accepted !== null && !accepted.created,
    jobId,
    job: data,
  };
}
