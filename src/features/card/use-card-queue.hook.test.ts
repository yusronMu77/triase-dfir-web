import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { queueItems } from "../../data/fixtures";
import { defaultQueueFilters, filterQueue, useCardQueue } from "./use-card-queue.hook";

describe("filterQueue", () => {
  it("returns everything by default", () => {
    expect(filterQueue(queueItems, defaultQueueFilters)).toHaveLength(queueItems.length);
  });
  it("searches title, asset and id case-insensitively", () => {
    expect(filterQueue(queueItems, { ...defaultQueueFilters, search: "SVC-BACKUP" })).toHaveLength(1);
    expect(filterQueue(queueItems, { ...defaultQueueFilters, search: "ws-fin-02" })).toHaveLength(1);
  });
  it("combines band, status and asset filters", () => {
    const rows = filterQueue(queueItems, { ...defaultQueueFilters, band: "high", status: "new" });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.band === "high" && row.status === "new")).toBe(true);
  });
  it("returns nothing for an unknown search", () => {
    expect(filterQueue(queueItems, { ...defaultQueueFilters, search: "tidak-ada" })).toEqual([]);
  });
});

describe("useCardQueue", () => {
  it("filters, counts by status and resets", () => {
    const { result } = renderHook(() => useCardQueue(queueItems));
    expect(result.current.total).toBe(queueItems.length);
    expect(result.current.countByStatus("all")).toBe(queueItems.length);
    act(() => result.current.setFilter("band", "low"));
    expect(result.current.filtered.every((row) => row.band === "low")).toBe(true);
    act(() => result.current.reset());
    expect(result.current.filtered).toHaveLength(queueItems.length);
  });
});
