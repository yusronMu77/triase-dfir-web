"use client";
import { useToast } from "@astria/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { describeError } from "../../lib/http/api-error";
import { queryKeys } from "../../lib/query/query-keys";
import { digestService } from "../../services/digest.service";
import type { DigestRunRequest, DigestRunResultDto } from "../../services/digest.types";
import { digestStatusView, toDigestRunRequest, validateDigestRun } from "./digest.mapper";

/** Manual digest run (admin). The form shows the thrown message; success is confirmed with a toast. */
export function useDigestRun() {
  const toast = useToast();
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: (body: DigestRunRequest) => digestService.run(body) });
  const { mutateAsync } = mutation;

  const submit = useCallback(
    async (data: FormData) => {
      const problem = validateDigestRun(data);
      if (problem) throw new Error(problem);
      let result: DigestRunResultDto;
      try {
        result = await mutateAsync(toDigestRunRequest(data));
      } catch (error) {
        throw new Error(describeError(error));
      }
      toast({
        title: "Permintaan digest diterima",
        description: `Digest ${result.digest_id}, status ${digestStatusView(result.status).label}.`,
      });
      void client.invalidateQueries({ queryKey: queryKeys.digests.all });
    },
    [client, mutateAsync, toast],
  );

  return { submit, pending: mutation.isPending };
}
