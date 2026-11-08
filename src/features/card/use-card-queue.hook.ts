"use client";
import type { QueueItem } from "@astria/ui";
import { useMemo, useState } from "react";

export type QueueFilters = { search: string; band: string; status: string; asset: string };
export const defaultQueueFilters: QueueFilters = { search: "", band: "all", status: "all", asset: "all" };

export function filterQueue(items: QueueItem[], filters: QueueFilters) {
  const needle = filters.search.trim().toLowerCase();
  return items.filter(
    (row) =>
      (filters.band === "all" || row.band === filters.band) &&
      (filters.status === "all" || row.status === filters.status) &&
      (filters.asset === "all" || row.asset === filters.asset) &&
      `${row.id} ${row.title} ${row.asset} ${row.assignee || ""}`.toLowerCase().includes(needle),
  );
}

export function useCardQueue(items: QueueItem[]) {
  const [filters, setFilters] = useState<QueueFilters>(defaultQueueFilters);
  const filtered = useMemo(() => filterQueue(items, filters), [items, filters]);
  const setFilter = (key: keyof QueueFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const reset = () => setFilters(defaultQueueFilters);
  const countByStatus = (status: string) =>
    status === "all" ? items.length : items.filter((row) => row.status === status).length;
  return { filters, filtered, total: items.length, setFilter, reset, countByStatus };
}
