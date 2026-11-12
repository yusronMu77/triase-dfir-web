import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cardsService } from "../../services/cards.service";
import type { CardSummary } from "../../services/cards.types";
import { metricsService } from "../../services/metrics.service";
import type { TicketStats } from "../../services/metrics.types";
import { useSession } from "../session/use-session.hook";
import { useHome } from "./use-home.hook";

vi.mock("../../services/cards.service", () => ({ cardsService: { list: vi.fn() } }));
vi.mock("../../services/metrics.service", () => ({ metricsService: { stats: vi.fn() } }));
vi.mock("../session/use-session.hook", () => ({ useSession: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

const card: CardSummary = {
  card_id: "IC-9",
  judul: "Kartu beranda",
  pola: "",
  band: "SEDANG",
  skor: 40,
  status: "ditinjau",
  prioritas: "P3",
  prioritas_sumber: "band",
  pemilik: null,
  kesimpulan: null,
  label: [],
  status_verifikasi: "lolos",
  versi: 1,
  row_version: 1,
  tanggapan_awal_target: null,
  tanggapan_awal_at: null,
  terlambat: false,
  dibuat_pada: null,
  diperbarui_pada: null,
};

const stats: TicketStats = {
  dari: null,
  sampai: null,
  total: 5,
  per_status: {},
  per_band: { SEDANG: 5 },
  per_prioritas: {},
  sla_terlanggar: 0,
  umpan_balik: {},
};

function session(can: string[]) {
  return {
    user: null,
    role: "analis",
    can: (permission: string) => can.includes(permission),
    loading: false,
    error: null,
    retry: vi.fn(),
  } as unknown as ReturnType<typeof useSession>;
}

describe("useHome", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(cardsService.list).mockResolvedValue({ items: [card], next_cursor: "x" });
    vi.mocked(metricsService.stats).mockResolvedValue(stats);
  });

  it("loads the newest cards and the 7-day summary for a role with both permissions", async () => {
    vi.mocked(useSession).mockReturnValue(session(["cards:read", "metrics:read"]));
    const { result } = renderHook(() => useHome(), { wrapper });
    await waitFor(() => expect(result.current.cards.items).toHaveLength(1));
    expect(cardsService.list).toHaveBeenCalledWith({ limit: 4 }, expect.anything());
    expect(result.current.cards.items[0]).toMatchObject({ id: "IC-9", band: "medium", href: "/cards/IC-9" });
    await waitFor(() => expect(result.current.metrics.view).not.toBeNull());
    expect(result.current.metrics.view?.summary[0].value).toBe("5");
  });

  it("requests nothing a role cannot read, and says so through the flags", async () => {
    vi.mocked(useSession).mockReturnValue(session(["session"]));
    const { result } = renderHook(() => useHome(), { wrapper });
    expect(result.current.cards.allowed).toBe(false);
    expect(result.current.metrics.allowed).toBe(false);
    expect(result.current.cards.loading).toBe(false);
    expect(cardsService.list).not.toHaveBeenCalled();
    expect(metricsService.stats).not.toHaveBeenCalled();
  });

  it("keeps the cards when only the metrics request fails", async () => {
    vi.mocked(useSession).mockReturnValue(session(["cards:read", "metrics:read"]));
    vi.mocked(metricsService.stats).mockRejectedValue(new Error("gagal"));
    const { result } = renderHook(() => useHome(), { wrapper });
    await waitFor(() => expect(result.current.metrics.error).toBeTruthy());
    expect(result.current.cards.items).toHaveLength(1);
    expect(result.current.metrics.view).toBeNull();
  });
});
