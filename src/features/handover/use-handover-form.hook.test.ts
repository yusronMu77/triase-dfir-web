import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { handoverService } from "../../services/handover.service";
import { useHandoverForm } from "./use-handover-form.hook";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => toast,
}));
vi.mock("../../services/handover.service", () => ({
  handoverService: { current: vi.fn(), save: vi.fn() },
}));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }),
    },
    children,
  );

const form = (summary: string, open = "0") => {
  const data = new FormData();
  data.set("summary", summary);
  data.set("open", open);
  data.set("shift", "malam");
  return data;
};

describe("useHandoverForm", () => {
  beforeEach(() => {
    toast.mockClear();
    vi.mocked(handoverService.current).mockReset();
    vi.mocked(handoverService.save).mockReset();
  });

  it("prefills from the draft once it loads", async () => {
    vi.mocked(handoverService.current).mockResolvedValue({
      catatan: "Dua kartu masih terbuka",
      jumlah_terbuka: 2,
    });
    const { result } = renderHook(() => useHandoverForm(), { wrapper });
    await waitFor(() => expect(result.current.draft.loaded).toBe(true));
    expect(result.current.draft).toEqual({ summary: "Dua kartu masih terbuka", open: 2, loaded: true });
    expect(result.current.draftMissing).toBe(false);
    expect(result.current.draftError).toBeNull();
  });

  it("treats a missing draft (404) as empty values rather than an error", async () => {
    vi.mocked(handoverService.current).mockRejectedValue(new ApiError("", 404, "TIDAK_DITEMUKAN"));
    const { result } = renderHook(() => useHandoverForm(), { wrapper });
    await waitFor(() => expect(result.current.draftMissing).toBe(true));
    expect(result.current.draft).toEqual({ summary: "", open: 0, loaded: false });
    expect(result.current.draftError).toBeNull();
  });

  it("keeps other draft failures visible so the analyst can retry", async () => {
    vi.mocked(handoverService.current).mockRejectedValue(new ApiError("", 503, undefined));
    const { result } = renderHook(() => useHandoverForm(), { wrapper });
    await waitFor(() => expect(result.current.draftError).toBeInstanceOf(ApiError));
    expect(result.current.draftMissing).toBe(false);
  });

  it("throws on a short summary and does not call the API or toast", async () => {
    vi.mocked(handoverService.current).mockRejectedValue(new ApiError("", 404, "TIDAK_DITEMUKAN"));
    const { result } = renderHook(() => useHandoverForm(), { wrapper });
    await expect(result.current.submit(form("x"))).rejects.toThrow("minimal 10 karakter");
    expect(handoverService.save).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it("saves the handover, then acknowledges it with a toast", async () => {
    vi.mocked(handoverService.current).mockRejectedValue(new ApiError("", 404, "TIDAK_DITEMUKAN"));
    vi.mocked(handoverService.save).mockResolvedValue(undefined);
    const { result } = renderHook(() => useHandoverForm(), { wrapper });
    await act(async () => result.current.submit(form("Dua kartu masih terbuka", "2")));
    expect(handoverService.save).toHaveBeenCalledWith({
      catatan: "Dua kartu masih terbuka",
      jumlah_terbuka: 2,
      shift: "malam",
    });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Serah terima tercatat" }));
  });

  it("turns a failed save into a message the form can show", async () => {
    vi.mocked(handoverService.current).mockRejectedValue(new ApiError("", 404, "TIDAK_DITEMUKAN"));
    vi.mocked(handoverService.save).mockRejectedValue(new ApiError("", 503, undefined));
    const { result } = renderHook(() => useHandoverForm(), { wrapper });
    await expect(result.current.submit(form("Dua kartu masih terbuka"))).rejects.toThrow(
      "Layanan sedang tidak tersedia",
    );
    expect(toast).not.toHaveBeenCalled();
  });
});
