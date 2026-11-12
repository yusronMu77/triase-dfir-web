"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "../../lib/query/query-keys";
import { digestService } from "../../services/digest.service";
import { type DigestListItem, toDigestListItem } from "./digest.mapper";

export const DIGEST_PAGE_SIZE = 20;

/** Digest list, newest first, loaded page by page with `next_cursor`. */
export function useDigestList() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.digests.list({ limit: DIGEST_PAGE_SIZE }),
    queryFn: ({ pageParam, signal }) =>
      digestService.list({ limit: DIGEST_PAGE_SIZE, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const rows: DigestListItem[] = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items.map(toDigestListItem)),
    [query.data],
  );
  return {
    rows,
    loading: query.isPending && query.fetchStatus === "fetching",
    error: query.error,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch(),
  };
}
