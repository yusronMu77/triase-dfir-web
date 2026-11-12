import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { digestService } from "../../services/digest.service";
import type { DigestPageDto, DigestSummaryDto } from "../../services/digest.types";
import { DIGEST_PAGE_SIZE, useDigestList } from "./use-digest-list.hook";

vi.mock("../../services/digest.service", () => ({ digestService: { list: vi.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

const row = (id: string): DigestSummaryDto => ({
  digest_id: id,
  jenis: "harian",
  periode: "periode",
  periode_mulai: null,
  periode_selesai: null,
  status: "terbit",
  terlambat: false,
});

const firstPage: DigestPageDto = { items: [row("DG-20261112-0700")], next_cursor: "DG-20261112-0700" };
const secondPage: DigestPageDto = { items: [row("DG-20261111-0700")], next_cursor: null };

describe("useDigestList", () => {
  beforeEach(() => {
    vi.mocked(digestService.list).mockReset();
  });

  it("maps rows and follows the cursor to the next page", async () => {
    vi.mocked(digestService.list).mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);
    const { result } = renderHook(() => useDigestList(), { wrapper });
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(digestService.list).toHaveBeenNthCalledWith(
      1,
      { limit: DIGEST_PAGE_SIZE, cursor: undefined },
      expect.any(AbortSignal),
    );
    expect(result.current.rows[0]?.href).toBe("/digests/DG-20261112-0700");
    expect(result.current.hasMore).toBe(true);

    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.rows).toHaveLength(2));
    expect(digestService.list).toHaveBeenNthCalledWith(
      2,
      { limit: DIGEST_PAGE_SIZE, cursor: "DG-20261112-0700" },
      expect.any(AbortSignal),
    );
    expect(result.current.hasMore).toBe(false);
  });

  it("returns an error the view can show when the list fails", async () => {
    vi.mocked(digestService.list).mockImplementation(async () => {
      throw new Error("gagal");
    });
    const { result } = renderHook(() => useDigestList(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.rows).toEqual([]);
  });
});
