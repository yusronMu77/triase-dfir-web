"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "../../lib/query/query-keys";
import { auditService } from "../../services/audit.service";
import { type AuditRowView, toAuditRow } from "./audit.mapper";

export const AUDIT_PAGE_SIZE = 50;

/** Audit records, loaded page by page with `next_from_seq` ("muat lebih banyak"). */
export function useAuditLog(pageSize = AUDIT_PAGE_SIZE) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.audit.list({ limit: pageSize }),
    queryFn: ({ pageParam, signal }) => auditService.list({ fromSeq: pageParam, limit: pageSize }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => last.next_from_seq ?? undefined,
  });

  const rows: AuditRowView[] = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items.map(toAuditRow)),
    [query.data],
  );

  return {
    rows,
    loading: query.isPending,
    error: query.error,
    empty: query.isSuccess && rows.length === 0,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}
