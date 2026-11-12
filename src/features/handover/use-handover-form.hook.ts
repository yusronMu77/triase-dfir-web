"use client";
import { useToast } from "@astria/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { describeError, isApiError } from "../../lib/http/api-error";
import { queryKeys } from "../../lib/query/query-keys";
import { handoverService } from "../../services/handover.service";
import type { HandoverRequest } from "../../services/handover.types";
import { toHandoverDraft, toHandoverRequest, validateHandover } from "./handover.mapper";

/**
 * Handover form state. The draft is optional: a 404 means no draft is available and the form stays usable
 * with empty values. Any other read error is shown beside the form with a retry action.
 */
export function useHandoverForm() {
  const toast = useToast();
  const client = useQueryClient();
  const draftQuery = useQuery({
    queryKey: queryKeys.handover,
    queryFn: ({ signal }) => handoverService.current(signal),
  });
  const mutation = useMutation({ mutationFn: (body: HandoverRequest) => handoverService.save(body) });
  const { mutateAsync } = mutation;

  const submit = useCallback(
    async (data: FormData) => {
      const problem = validateHandover(data);
      if (problem) throw new Error(problem);
      try {
        await mutateAsync(toHandoverRequest(data));
      } catch (error) {
        throw new Error(describeError(error));
      }
      toast({ title: "Serah terima tercatat", description: "Catatan disimpan untuk shift berikutnya." });
      void client.invalidateQueries({ queryKey: queryKeys.handover });
    },
    [client, mutateAsync, toast],
  );

  const draft = useMemo(() => toHandoverDraft(draftQuery.data), [draftQuery.data]);
  const draftMissing = isApiError(draftQuery.error) && draftQuery.error.kind === "not-found";

  return {
    draft,
    draftLoading: draftQuery.isPending && draftQuery.fetchStatus === "fetching",
    draftMissing,
    draftError: draftMissing ? null : draftQuery.error,
    retryDraft: () => void draftQuery.refetch(),
    submit,
    pending: mutation.isPending,
  };
}
