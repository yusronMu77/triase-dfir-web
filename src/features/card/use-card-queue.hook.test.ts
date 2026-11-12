import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cardsService } from "../../services/cards.service";
import type { CardSummary } from "../../services/cards.types";
import { useSession } from "../session/use-session.hook";
import {
  defaultQueueFilters,
  filterByText,
  PAGE_SIZE,
  toServerQuery,
  useCardQueue,
} from "./use-card-queue.hook";

vi.mock("../../services/cards.service", () => ({ cardsService: { list: vi.fn() } }));
vi.mock("../session/use-session.hook", () => ({ useSession: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

function card(id: string, overrides: Partial<CardSummary> = {}): CardSummary {
  return {
    card_id: id,
    judul: `Kartu ${id}`,
    pola: "P-AKUN",
    band: "TINGGI",
    skor: 55,
    status: "baru",
    prioritas: "P2",
    prioritas_sumber: "band",
    pemilik: null,
    kesimpulan: null,
    label: [],
    status_verifikasi: "lolos",
    versi: 1,
    row_version: 1,
    tanggapan_awal_target: new Date(Date.now() + 60 * 60_000).toISOString(),
    tanggapan_awal_at: null,
    terlambat: false,
    dibuat_pada: new Date().toISOString(),
    diperbarui_pada: new Date().toISOString(),
    ...overrides,
  };
}

function session(can: string[] = ["cards:read"]) {
  return {
    user: null,
    role: null,
    can: (permission: string) => can.includes(permission),
    loading: false,
    error: null,
    retry: vi.fn(),
  } as unknown as ReturnType<typeof useSession>;
}

describe("toServerQuery", () => {
  it("leaves out 'all' and blank text, trims the owner, and sets the page size", () => {
    expect(toServerQuery({ ...defaultQueueFilters, pemilik: "  analis01 " })).toEqual({
      status: undefined,
      band: undefined,
      prioritas: undefined,
      pemilik: "analis01",
      host: undefined,
      limit: PAGE_SIZE,
    });
  });

  it("passes the chosen server values through", () => {
    expect(
      toServerQuery({
        ...defaultQueueFilters,
        status: "eskalasi",
        band: "KRITIS",
        prioritas: "P1",
        host: "WS-01",
      }),
    ).toMatchObject({ status: "eskalasi", band: "KRITIS", prioritas: "P1", host: "WS-01" });
  });
});

describe("filterByText", () => {
  const items = [
    { id: "IC-1", title: "Akun svc-backup", assignee: "analis01", meta: "P-AKUN" },
    { id: "IC-2", title: "Malware di WS-02", assignee: undefined, meta: undefined },
  ] as Parameters<typeof filterByText>[0];

  it("keeps every row for an empty text and matches id, title, owner, and pattern", () => {
    expect(filterByText(items, "  ")).toHaveLength(2);
    expect(filterByText(items, "ic-2")).toHaveLength(1);
    expect(filterByText(items, "SVC-BACKUP")).toHaveLength(1);
    expect(filterByText(items, "analis01")[0].id).toBe("IC-1");
    expect(filterByText(items, "p-akun")[0].id).toBe("IC-1");
    expect(filterByText(items, "tidak-ada")).toEqual([]);
  });
});

describe("useCardQueue", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useSession).mockReturnValue(session());
  });

  it("loads the first page with the default filters and maps the rows", async () => {
    vi.mocked(cardsService.list).mockResolvedValue({ items: [card("IC-1")], next_cursor: null });
    const { result } = renderHook(() => useCardQueue(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(cardsService.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: PAGE_SIZE }),
      expect.anything(),
    );
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({ id: "IC-1", band: "high", href: "/cards/IC-1" });
    expect(result.current.empty).toBe(false);
  });

  it("sends a changed filter to the server and reloads", async () => {
    vi.mocked(cardsService.list).mockResolvedValue({ items: [], next_cursor: null });
    const { result } = renderHook(() => useCardQueue(), { wrapper });
    await waitFor(() => expect(result.current.empty).toBe(true));
    act(() => result.current.setFilter("band", "KRITIS"));
    await waitFor(() =>
      expect(cardsService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ band: "KRITIS" }),
        expect.anything(),
      ),
    );
    act(() => result.current.reset());
    expect(result.current.filters).toEqual(defaultQueueFilters);
  });

  it("loads the next page with its cursor", async () => {
    vi.mocked(cardsService.list)
      .mockResolvedValueOnce({ items: [card("IC-1")], next_cursor: "cur-1" })
      .mockResolvedValueOnce({ items: [card("IC-2")], next_cursor: null });
    const { result } = renderHook(() => useCardQueue(), { wrapper });
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadedCount).toBe(2));
    expect(cardsService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: "cur-1" }),
      expect.anything(),
    );
    expect(result.current.hasMore).toBe(false);
    expect(result.current.items.map((row) => row.id)).toEqual(["IC-1", "IC-2"]);
  });

  it("filters the loaded rows by text without another request", async () => {
    vi.mocked(cardsService.list).mockResolvedValue({
      items: [card("IC-1"), card("IC-2")],
      next_cursor: null,
    });
    const { result } = renderHook(() => useCardQueue(), { wrapper });
    await waitFor(() => expect(result.current.loadedCount).toBe(2));
    act(() => result.current.setFilter("cari", "IC-2"));
    expect(result.current.items.map((row) => row.id)).toEqual(["IC-2"]);
    expect(cardsService.list).toHaveBeenCalledTimes(1);
  });

  it("does not load anything without cards:read and reports that instead", async () => {
    vi.mocked(useSession).mockReturnValue(session([]));
    const { result } = renderHook(() => useCardQueue(), { wrapper });
    expect(result.current.allowed).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(cardsService.list).not.toHaveBeenCalled();
  });

  it("surfaces an error when there are no rows to show", async () => {
    vi.mocked(cardsService.list).mockRejectedValue(new Error("gagal"));
    const { result } = renderHook(() => useCardQueue(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.items).toEqual([]);
    expect(result.current.empty).toBe(false);
  });
});
