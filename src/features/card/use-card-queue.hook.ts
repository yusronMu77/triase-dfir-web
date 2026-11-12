"use client";
import type { QueueItem } from "@astria/ui";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { queryKeys } from "../../lib/query/query-keys";
import { toQueueItem } from "../../services/cards.mapper";
import { cardsService } from "../../services/cards.service";
import type { CardBand, CardListQuery, CardPage, CardPriority, CardStatus } from "../../services/cards.types";
import { useSession } from "../session/use-session.hook";

export const PAGE_SIZE = 50;

export type QueueFilters = {
  status: "all" | CardStatus;
  band: "all" | CardBand;
  prioritas: "all" | CardPriority;
  pemilik: string;
  host: string;
  /** Free text. The server has no text search, so this only narrows the rows already loaded. */
  cari: string;
};

export const defaultQueueFilters: QueueFilters = {
  status: "all",
  band: "all",
  prioritas: "all",
  pemilik: "",
  host: "",
  cari: "",
};

/** Filters that the server answers. "all" and empty text are left out of the request. */
export function toServerQuery(filters: QueueFilters): CardListQuery {
  return {
    status: filters.status === "all" ? undefined : filters.status,
    band: filters.band === "all" ? undefined : filters.band,
    prioritas: filters.prioritas === "all" ? undefined : filters.prioritas,
    pemilik: filters.pemilik.trim() || undefined,
    host: filters.host.trim() || undefined,
    limit: PAGE_SIZE,
  };
}

/** Case-insensitive match on id, title, owner, and pattern. An empty text keeps every row. */
export function filterByText(items: QueueItem[], text: string): QueueItem[] {
  const needle = text.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((row) =>
    `${row.id} ${row.title} ${row.assignee ?? ""} ${row.meta ?? ""}`.toLowerCase().includes(needle),
  );
}

/** Queue state: server filters, cursor paging ("muat lebih banyak"), and the text search on loaded rows. */
export function useCardQueue() {
  const session = useSession();
  const allowed = session.can("cards:read");
  const [filters, setFilters] = useState<QueueFilters>(defaultQueueFilters);
  // Ticks once a minute so the SLA text does not go stale on a screen left open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const serverQuery = useMemo(() => toServerQuery(filters), [filters]);
  const query = useInfiniteQuery({
    queryKey: queryKeys.cards.list(serverQuery),
    queryFn: ({ pageParam, signal }) => cardsService.list({ ...serverQuery, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: CardPage) => last.next_cursor ?? undefined,
    enabled: allowed,
  });

  const rows = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items), [query.data]);
  const items = useMemo(
    () =>
      filterByText(
        rows.map((card) => toQueueItem(card, now)),
        filters.cari,
      ),
    [rows, now, filters.cari],
  );
  const loading = session.loading || (allowed && query.isPending);
  const error = session.error ?? (rows.length === 0 ? query.error : null);

  return {
    allowed,
    filters,
    setFilter: <K extends keyof QueueFilters>(key: K, value: QueueFilters[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    reset: () => setFilters(defaultQueueFilters),
    items,
    loadedCount: rows.length,
    loading,
    error: error ?? null,
    /** Set when a later page or a background refresh failed while earlier rows are still on screen. */
    refreshError: rows.length > 0 && query.isError ? query.error : null,
    empty: !loading && !error && rows.length === 0,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    retry: () => {
      if (session.error) session.retry();
      else void query.refetch();
    },
  };
}
