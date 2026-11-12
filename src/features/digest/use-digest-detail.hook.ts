"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { digestService } from "../../services/digest.service";
import { toDigestDetail } from "./digest.mapper";

/** Digest metadata from `GET /digests/{id}`. */
export function useDigestDetail(id: string) {
  const query = useQuery({
    queryKey: queryKeys.digests.detail(id),
    queryFn: async ({ signal }) => toDigestDetail(await digestService.get(id, signal)),
  });
  return {
    data: query.data ?? null,
    loading: query.isPending && query.fetchStatus === "fetching",
    error: query.error,
    retry: () => void query.refetch(),
  };
}
