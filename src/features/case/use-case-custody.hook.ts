"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { caseService } from "../../services/case.service";
import { isCaseId, toCaseCustody } from "./case.mapper";

/** Hash-chained custody log of a case (`GET /cases/{id}/custody`) with dfir's `chain_ok` verdict. */
export function useCaseCustody(id: string) {
  const query = useQuery({
    queryKey: queryKeys.cases.custody(id),
    queryFn: async ({ signal }) => toCaseCustody(await caseService.custody(id, signal)),
    enabled: isCaseId(id),
  });
  return {
    data: query.data ?? null,
    loading: query.isPending && query.fetchStatus === "fetching",
    error: query.error,
    retry: () => void query.refetch(),
  };
}
