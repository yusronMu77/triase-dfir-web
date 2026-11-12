import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { digestService } from "../../services/digest.service";
import type { DigestDetailDto } from "../../services/digest.types";
import { useDigestDetail } from "./use-digest-detail.hook";

vi.mock("../../services/digest.service", () => ({ digestService: { get: vi.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

const dto: DigestDetailDto = {
  digest_id: "DG-20261112-0700",
  jenis: "harian",
  periode: "2026-11-11 07:00 WIB sampai 2026-11-12 07:00 WIB",
  periode_mulai: null,
  periode_selesai: null,
  status: "terbit",
  terlambat: false,
  terlambat_menit: null,
  dijadwalkan_pada: "2026-11-12T07:00:00+07:00",
  dijalankan_pada: "2026-11-12T07:00:05+07:00",
  percobaan: 1,
  mode_narasi: "templat",
  sha256: "c".repeat(64),
  versi_templat: "digest_harian-v1",
};

describe("useDigestDetail", () => {
  beforeEach(() => {
    vi.mocked(digestService.get).mockReset();
  });

  it("loads the digest and maps it for display", async () => {
    vi.mocked(digestService.get).mockResolvedValue(dto);
    const { result } = renderHook(() => useDigestDetail("DG-20261112-0700"), { wrapper });
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(digestService.get).toHaveBeenCalledWith("DG-20261112-0700", expect.any(AbortSignal));
    expect(result.current.data?.statusLabel).toBe("Terbit");
    expect(result.current.data?.dijalankanPada).toBe("2026-11-12 07:00:05 WIB");
  });

  it("exposes a 404 as an error", async () => {
    vi.mocked(digestService.get).mockRejectedValue(Object.assign(new Error("404"), { kind: "not-found" }));
    const { result } = renderHook(() => useDigestDetail("DG-20261112-9999"), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toBeNull();
  });
});
