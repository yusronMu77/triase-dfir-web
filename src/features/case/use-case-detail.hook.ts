"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { caseService } from "../../services/case.service";
import { isCaseId, toCaseSummary } from "./case.mapper";

/** Case summary from `GET /cases/{id}`. Disabled for a malformed ID, so no request leaves the browser. */
export function useCaseDetail(id: string) {
  const query = useQuery({
    queryKey: queryKeys.cases.detail(id),
    queryFn: async ({ signal }) => toCaseSummary(await caseService.get(id, signal)),
    enabled: isCaseId(id),
  });
  return {
    data: query.data ?? null,
    loading: query.isPending && query.fetchStatus === "fetching",
    error: query.error,
    retry: () => void query.refetch(),
  };
}
