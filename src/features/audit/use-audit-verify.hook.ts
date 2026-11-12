"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { auditService } from "../../services/audit.service";
import type { VerifyResult } from "../../services/audit.types";
import { useSession } from "../session/use-session.hook";
import { toVerifyView } from "./audit.mapper";

/** Polling interval for a running verification. */
export const VERIFY_POLL_MS = 1000;

/** Key prefix `["audit", ...]` so that `queryKeys.audit.all` invalidation also covers verification jobs. */
const verifyKey = (jobId: string) => ["audit", "verify", jobId] as const;

/**
 * Starts a full-chain verification (requires `audit:verify`) and polls the job until it is no longer running.
 * The button is hidden for other roles; the server still enforces the permission.
 */
export function useAuditVerify(pollMs = VERIFY_POLL_MS) {
  const { can } = useSession();
  const start = useMutation({ mutationFn: () => auditService.startVerify() });

  const startedJob = start.data?.status === "berjalan" ? start.data.job_id : null;
  const poll = useQuery({
    queryKey: verifyKey(startedJob ?? ""),
    queryFn: ({ signal }) => auditService.verifyJob(startedJob ?? "", signal),
    enabled: startedJob !== null,
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const status = query.state.data?.status;
      return status === undefined || status === "berjalan" ? pollMs : false;
    },
  });

  const current: VerifyResult | null = poll.data ?? start.data ?? null;
  const view = toVerifyView(current);
  const error = start.error ?? (startedJob !== null && !poll.data ? poll.error : null);

  return {
    canVerify: can("audit:verify"),
    view,
    running: start.isPending || view.kind === "running",
    error,
    verify: () => start.mutate(),
    retry: () => (start.isError ? start.mutate() : void poll.refetch()),
  };
}
