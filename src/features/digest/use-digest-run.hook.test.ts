import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { digestService } from "../../services/digest.service";
import { useDigestRun } from "./use-digest-run.hook";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => toast,
}));
vi.mock("../../services/digest.service", () => ({ digestService: { run: vi.fn() } }));

const client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client }, children);

const form = (alasan?: string) => {
  const data = new FormData();
  if (alasan !== undefined) data.set("alasan", alasan);
  return data;
};

describe("useDigestRun", () => {
  beforeEach(() => {
    toast.mockClear();
    vi.mocked(digestService.run).mockReset();
  });

  it("sends the run request and confirms with a toast", async () => {
    vi.mocked(digestService.run).mockResolvedValue({
      digest_id: "DG-20261112-0900",
      status: "terjadwal",
      terlambat: false,
    });
    const { result } = renderHook(() => useDigestRun(), { wrapper });
    await act(async () => result.current.submit(form("Uji ulang")));
    expect(digestService.run).toHaveBeenCalledWith({ jenis: "harian", alasan: "Uji ulang" });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Permintaan digest diterima" }));
  });

  it("throws the validation message without calling the API", async () => {
    const { result } = renderHook(() => useDigestRun(), { wrapper });
    await expect(result.current.submit(form("a".repeat(501)))).rejects.toThrow(
      "Alasan maksimal 500 karakter.",
    );
    expect(digestService.run).not.toHaveBeenCalled();
  });

  it("turns an API failure into a safe Indonesian message", async () => {
    vi.mocked(digestService.run).mockRejectedValue(new ApiError("", 403, "FORBIDDEN"));
    const { result } = renderHook(() => useDigestRun(), { wrapper });
    await expect(result.current.submit(form())).rejects.toThrow(
      "Peran Anda tidak diizinkan melakukan aksi ini.",
    );
    expect(toast).not.toHaveBeenCalled();
  });
});
