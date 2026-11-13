import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import type { WhatsAppLink } from "../../services/channels.types";
import { useWhatsAppLink } from "./use-whatsapp-link.hook";

const mocks = vi.hoisted(() => ({ whatsappLink: vi.fn(), unlinkWhatsapp: vi.fn(), toast: vi.fn() }));

vi.mock("../../services/channels.service", () => ({
  channelsService: { whatsappLink: mocks.whatsappLink, unlinkWhatsapp: mocks.unlinkWhatsapp },
}));
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => mocks.toast,
}));

const unlinked: WhatsAppLink = {
  terhubung: false,
  perlu_scan: true,
  nomor_tersamar: null,
  qr: "data:image/png;base64,iVBORw0KGgo=",
};
const linked: WhatsAppLink = {
  terhubung: true,
  perlu_scan: false,
  nomor_tersamar: "62822****7146",
  qr: null,
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useWhatsAppLink(), { wrapper });
}

describe("useWhatsAppLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the QR while the bot is not linked", async () => {
    mocks.whatsappLink.mockResolvedValue(unlinked);
    const hook = setup();
    await waitFor(() => expect(hook.result.current.link).toEqual(unlinked));
    expect(hook.result.current.unavailable).toBe(false);
    expect(hook.result.current.error).toBeNull();
  });

  it("hides the card when the gateway has no WhatsApp bridge (404)", async () => {
    mocks.whatsappLink.mockRejectedValue(new ApiError("data tidak ditemukan", 404, "TIDAK_DITEMUKAN"));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.unavailable).toBe(true));
    expect(hook.result.current.error).toBeNull();
    expect(hook.result.current.loading).toBe(false);
  });

  it("shows other failures as an error", async () => {
    mocks.whatsappLink.mockRejectedValue(
      new ApiError("layanan tidak tersedia", 503, "LAYANAN_TIDAK_TERSEDIA"),
    );
    const hook = setup();
    await waitFor(() => expect(hook.result.current.error).not.toBeNull());
    expect(hook.result.current.unavailable).toBe(false);
  });

  it("unlinks after confirmation and refetches the status", async () => {
    mocks.whatsappLink.mockResolvedValueOnce(linked).mockResolvedValue(unlinked);
    mocks.unlinkWhatsapp.mockResolvedValue({ status: "keluar" });
    const hook = setup();
    await waitFor(() => expect(hook.result.current.link).toEqual(linked));

    act(() => hook.result.current.openConfirm());
    expect(hook.result.current.confirming).toBe(true);
    await act(() => hook.result.current.unlink());

    expect(mocks.unlinkWhatsapp).toHaveBeenCalledOnce();
    expect(hook.result.current.confirming).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Bot WhatsApp terputus" }));
    await waitFor(() => expect(hook.result.current.link).toEqual(unlinked));
  });

  it("keeps the dialog open with the reason when unlinking fails", async () => {
    mocks.whatsappLink.mockResolvedValue(linked);
    mocks.unlinkWhatsapp.mockRejectedValue(new ApiError("bot belum tertaut", 409, "GW_WA_BELUM_TERHUBUNG"));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.link).toEqual(linked));
    act(() => hook.result.current.openConfirm());
    await act(() => hook.result.current.unlink());
    expect(hook.result.current.confirming).toBe(true);
    expect(hook.result.current.unlinkError).not.toBeNull();
  });
});
