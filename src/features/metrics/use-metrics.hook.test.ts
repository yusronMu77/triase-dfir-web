import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { metricsService } from "../../services/metrics.service";
import type { TicketStats } from "../../services/metrics.types";
import { useSession } from "../session/use-session.hook";
import { useMetrics } from "./use-metrics.hook";

vi.mock("../../services/metrics.service", () => ({ metricsService: { stats: vi.fn() } }));
vi.mock("../session/use-session.hook", () => ({ useSession: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

const stats: TicketStats = {
  dari: null,
  sampai: null,
  total: 12,
  per_status: { baru: 12 },
  per_band: { KRITIS: 2 },
  per_prioritas: {},
  sla_terlanggar: 1,
  umpan_balik: {},
};

function session(can: string[] = ["metrics:read"]) {
  return {
    user: null,
    role: null,
    can: (permission: string) => can.includes(permission),
    loading: false,
    error: null,
    retry: vi.fn(),
  } as unknown as ReturnType<typeof useSession>;
}

describe("useMetrics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useSession).mockReturnValue(session());
    vi.mocked(metricsService.stats).mockResolvedValue(stats);
  });

  it("loads the last 7 days by default and maps the statistics", async () => {
    const { result } = renderHook(() => useMetrics(), { wrapper });
    await waitFor(() => expect(result.current.view).not.toBeNull());
    expect(result.current.days).toBe(7);
    expect(result.current.view?.summary[0].value).toBe("12");
    const [range] = vi.mocked(metricsService.stats).mock.calls[0];
    const span = Date.parse(range.sampai) - Date.parse(range.dari);
    expect(span).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("requests a new 30-day range when the period changes", async () => {
    const { result } = renderHook(() => useMetrics(), { wrapper });
    await waitFor(() => expect(result.current.view).not.toBeNull());
    act(() => result.current.setDays(30));
    await waitFor(() => expect(metricsService.stats).toHaveBeenCalledTimes(2));
    const [range] = vi.mocked(metricsService.stats).mock.calls[1];
    expect(Date.parse(range.sampai) - Date.parse(range.dari)).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("does not request metrics without metrics:read", async () => {
    vi.mocked(useSession).mockReturnValue(session([]));
    const { result } = renderHook(() => useMetrics(), { wrapper });
    expect(result.current.allowed).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(metricsService.stats).not.toHaveBeenCalled();
  });

  it("reports an error when no statistics could be loaded", async () => {
    vi.mocked(metricsService.stats).mockRejectedValue(new Error("gagal"));
    const { result } = renderHook(() => useMetrics(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.view).toBeNull();
  });
});
