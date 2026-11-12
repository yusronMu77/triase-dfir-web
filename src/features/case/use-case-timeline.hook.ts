"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "../../lib/query/query-keys";
import { caseService } from "../../services/case.service";
import { isCaseId, toTimelineEvent } from "./case.mapper";

export const TIMELINE_PAGE_SIZE = 50;

/** Timeline of a case, loaded page by page with `next_cursor` ("muat lebih banyak"). */
export function useCaseTimeline(id: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.cases.timeline(id),
    queryFn: ({ pageParam, signal }) =>
      caseService.timeline(id, { cursor: pageParam, limit: TIMELINE_PAGE_SIZE }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled: isCaseId(id),
  });
  const events = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items.map(toTimelineEvent)),
    [query.data],
  );
  return {
    events,
    loading: query.isPending && query.fetchStatus === "fetching",
    error: query.error,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}
