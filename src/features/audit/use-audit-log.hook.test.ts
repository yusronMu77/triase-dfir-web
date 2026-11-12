import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditService } from "../../services/audit.service";
import type { AuditEntry } from "../../services/audit.types";
import { useAuditLog } from "./use-audit-log.hook";

vi.mock("../../services/audit.service", () => ({
  auditService: { startVerify: vi.fn(), verifyJob: vi.fn(), list: vi.fn() },
}));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client }, children);

function entry(seq: number): AuditEntry {
  return {
    seq,
    occurred_at: "2026-11-12T01:00:00Z",
    recorded_at: "2026-11-12T01:00:00Z",
    actor: "analis01",
    actor_type: "user",
    action: "card.viewed",
    target_type: "card",
    target_id: `CARD-${seq}`,
    via: "sync",
    idempotency_key: `k-${seq}`,
    payload: {},
    payload_hash: "1".repeat(64),
    prev_hash: "2".repeat(64),
    entry_hash: String(seq).padStart(64, "3"),
  };
}

describe("useAuditLog", () => {
  beforeEach(() => {
    vi.mocked(auditService.list).mockReset();
    client.clear();
  });

  it("loads the first page and then follows next_from_seq", async () => {
    vi.mocked(auditService.list)
      .mockResolvedValueOnce({ items: [entry(1)], next_from_seq: 2 })
      .mockResolvedValueOnce({ items: [entry(2)], next_from_seq: null });
    const { result } = renderHook(() => useAuditLog(1), { wrapper });

    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(result.current.rows[0].seq).toBe(1);
    expect(result.current.hasMore).toBe(true);
    expect(vi.mocked(auditService.list).mock.calls[0][0]).toEqual({ fromSeq: 0, limit: 1 });

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.rows).toHaveLength(2));
    expect(vi.mocked(auditService.list).mock.calls[1][0]).toEqual({ fromSeq: 2, limit: 1 });
    expect(result.current.hasMore).toBe(false);
  });

  it("reports an empty chain as empty, not as an error", async () => {
    vi.mocked(auditService.list).mockResolvedValue({ items: [], next_from_seq: null });
    const { result } = renderHook(() => useAuditLog(), { wrapper });
    await waitFor(() => expect(result.current.empty).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it("surfaces a failed first page so the screen can offer a retry", async () => {
    vi.mocked(auditService.list).mockImplementation(() => Promise.reject(new Error("down")));
    const { result } = renderHook(() => useAuditLog(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.rows).toEqual([]);
    expect(result.current.empty).toBe(false);
  });
});
