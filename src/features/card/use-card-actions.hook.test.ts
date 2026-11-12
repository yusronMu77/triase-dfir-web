import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { cardsService } from "../../services/cards.service";
import type { CardSummary } from "../../services/cards.types";
import { useCardActions } from "./use-card-actions.hook";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => toast,
}));
vi.mock("../../services/cards.service", () => ({
  cardsService: {
    update: vi.fn(),
    addEvent: vi.fn(),
    feedback: vi.fn(),
    deepDive: vi.fn(),
  },
  newIdempotencyKey: () => "key-1",
}));

const card: CardSummary = {
  card_id: "IC-1",
  judul: "Kartu uji",
  pola: "P-AKUN",
  band: "KRITIS",
  skor: 71,
  status: "baru",
  prioritas: "P1",
  prioritas_sumber: "band",
  pemilik: "analis01",
  kesimpulan: null,
  label: [],
  status_verifikasi: "lolos",
  versi: 1,
  row_version: 3,
  tanggapan_awal_target: null,
  tanggapan_awal_at: null,
  terlambat: false,
  dibuat_pada: null,
  diperbarui_pada: null,
};

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

function setup(current: CardSummary | null = card) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  const hook = renderHook(() => useCardActions(current), { wrapper });
  return { ...hook, invalidate };
}

describe("useCardActions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(cardsService.update).mockResolvedValue({ ...card, row_version: 4 });
    vi.mocked(cardsService.addEvent).mockResolvedValue({
      id: 1,
      ts: "2026-11-12T03:00:00Z",
      pelaku: "analis01",
      jenis: "comment",
      detail: {},
      row_version: 3,
    });
    vi.mocked(cardsService.feedback).mockResolvedValue({ feedback_id: 1, card_id: "IC-1", label: "benar" });
    vi.mocked(cardsService.deepDive).mockResolvedValue({
      case_id: "CS-1",
      status: "queued",
      card_id: "IC-1",
      card_version: 1,
      links: {},
    });
  });

  describe("status", () => {
    it("sends the status with the current row_version", async () => {
      const { result } = setup();
      let ok = false;
      await act(async () => {
        ok = await result.current.changeStatus(form({ status: "ditinjau" }));
      });
      expect(ok).toBe(true);
      expect(cardsService.update).toHaveBeenCalledWith("IC-1", { if_row_version: 3, status: "ditinjau" });
      expect(toast).toHaveBeenCalledWith({ title: "Status diperbarui" });
    });

    it("needs a conclusion before a card can be marked selesai", async () => {
      const { result } = setup({ ...card, status: "diselidiki" });
      await act(async () => {
        await result.current.changeStatus(form({ status: "selesai" }));
      });
      expect(cardsService.update).not.toHaveBeenCalled();
      expect(result.current.errorOf("status")).toBe("Pilih kesimpulan sebelum menandai kartu selesai.");
    });

    it("sends the conclusion and note only with selesai", async () => {
      const { result } = setup({ ...card, status: "diselidiki" });
      await act(async () => {
        await result.current.changeStatus(
          form({ status: "selesai", kesimpulan: "insiden_benar", catatan: " terkonfirmasi " }),
        );
      });
      expect(cardsService.update).toHaveBeenCalledWith("IC-1", {
        if_row_version: 3,
        status: "selesai",
        kesimpulan: "insiden_benar",
        kesimpulan_catatan: "terkonfirmasi",
      });
    });

    it("refuses a transition the state machine does not allow", async () => {
      const { result } = setup();
      await act(async () => {
        await result.current.changeStatus(form({ status: "selesai", kesimpulan: "bukan_insiden" }));
      });
      expect(cardsService.update).not.toHaveBeenCalled();
      expect(result.current.errorOf("status")).toBe("Pilih status tujuan.");
    });
  });

  describe("owner and priority", () => {
    it("removes the owner with null when the field is cleared", async () => {
      const { result } = setup();
      await act(async () => {
        await result.current.changeOwner(form({ pemilik: "" }));
      });
      expect(cardsService.update).toHaveBeenCalledWith("IC-1", { if_row_version: 3, pemilik: null });
    });

    it("rejects an unchanged or malformed owner without a request", async () => {
      const { result } = setup();
      await act(async () => {
        await result.current.changeOwner(form({ pemilik: "analis01" }));
      });
      expect(result.current.errorOf("owner")).toBe("Pemilik belum berubah.");
      await act(async () => {
        await result.current.changeOwner(form({ pemilik: "nama spasi" }));
      });
      expect(result.current.errorOf("owner")).toContain("hanya boleh");
      expect(cardsService.update).not.toHaveBeenCalled();
    });

    it("requires a reason for a priority change", async () => {
      const { result } = setup();
      await act(async () => {
        await result.current.changePriority(form({ prioritas: "P3", alasan: "" }));
      });
      expect(cardsService.update).not.toHaveBeenCalled();
      expect(result.current.errorOf("priority")).toBe("Alasan wajib diisi saat mengubah prioritas.");
    });

    it("sends the new priority with its reason", async () => {
      const { result } = setup();
      await act(async () => {
        await result.current.changePriority(form({ prioritas: "P3", alasan: "bukan serangan nyata" }));
      });
      expect(cardsService.update).toHaveBeenCalledWith("IC-1", {
        if_row_version: 3,
        prioritas: "P3",
        alasan: "bukan serangan nyata",
      });
    });
  });

  describe("conflict", () => {
    it("explains a 409 and reloads the cards so the next try has the new row_version", async () => {
      vi.mocked(cardsService.update).mockRejectedValue(
        new ApiError("data sudah berubah", 409, "VERSI_BENTROK", "trace-1", undefined, { row_version: 5 }),
      );
      const { result, invalidate } = setup();
      await act(async () => {
        await result.current.changePriority(form({ prioritas: "P3", alasan: "x" }));
      });
      await waitFor(() => expect(result.current.errorOf("priority")).toContain("dimuat ulang"));
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["cards"] });
    });
  });

  describe("comment and feedback", () => {
    it("does not send an empty comment", async () => {
      const { result } = setup();
      await act(async () => {
        await result.current.addComment(form({ isi: "   " }));
      });
      expect(cardsService.addEvent).not.toHaveBeenCalled();
      expect(result.current.errorOf("comment")).toBe("Komentar tidak boleh kosong.");
    });

    it("sends a comment with an idempotency key", async () => {
      const { result } = setup();
      let ok = false;
      await act(async () => {
        ok = await result.current.addComment(form({ isi: " Cek sesi " }));
      });
      expect(ok).toBe(true);
      expect(cardsService.addEvent).toHaveBeenCalledWith(
        "IC-1",
        { tipe: "comment", isi: "Cek sesi" },
        "key-1",
      );
    });

    it("needs a feedback label and sends the optional note", async () => {
      const { result } = setup();
      await act(async () => {
        await result.current.sendFeedback(form({ label: "tidak_ada" }));
      });
      expect(cardsService.feedback).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.sendFeedback(form({ label: "salah_positif", catatan: "" }));
      });
      expect(cardsService.feedback).toHaveBeenCalledWith(
        "IC-1",
        { label: "salah_positif", catatan: "" },
        "key-1",
      );
    });
  });

  describe("deep-dive", () => {
    it("requests a case and exposes its id", async () => {
      const { result } = setup();
      expect(result.current.deepDiveCaseId).toBeNull();
      await act(async () => {
        await result.current.requestDeepDive();
      });
      expect(cardsService.deepDive).toHaveBeenCalledWith("IC-1");
      await waitFor(() => expect(result.current.deepDiveCaseId).toBe("CS-1"));
    });

    it("does nothing while the card is not loaded", async () => {
      const { result } = setup(null);
      await act(async () => {
        await result.current.changeStatus(form({ status: "ditinjau" }));
      });
      expect(cardsService.update).not.toHaveBeenCalled();
    });
  });
});
