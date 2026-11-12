import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { usePairing } from "./use-pairing.hook";

const mocks = vi.hoisted(() => ({ issuePairingCode: vi.fn() }));

vi.mock("../../services/identities.service", () => ({
  identitiesService: { issuePairingCode: mocks.issuePairingCode },
}));

const issued = { code: "ABCD2345", channel: "telegram", expires_at: "2026-11-12T10:00:00Z" };

describe("usePairing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.issuePairingCode.mockResolvedValue(issued);
  });

  it("starts with no code, so nothing is shown before the user asks", () => {
    const { result } = renderHook(() => usePairing());
    expect(result.current.pairing).toBeNull();
    expect(mocks.issuePairingCode).not.toHaveBeenCalled();
  });

  it("issues a code for the chosen channel and keeps its expiry", async () => {
    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.issue(" telegram ");
    });
    expect(mocks.issuePairingCode).toHaveBeenCalledWith({ channel: "telegram" });
    expect(result.current.pairing).toEqual({
      code: "ABCD2345",
      channel: "telegram",
      expiresAt: "2026-11-12T10:00:00Z",
    });
    expect(result.current.busy).toBe(false);
  });

  it("sends an empty body when no channel is chosen", async () => {
    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.issue("");
    });
    expect(mocks.issuePairingCode).toHaveBeenCalledWith({});
  });

  it("rejects a malformed channel before any request", async () => {
    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.issue("Telegram!");
    });
    expect(mocks.issuePairingCode).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/huruf kecil/);
  });

  it("does not show a reply it cannot read as a code", async () => {
    mocks.issuePairingCode.mockResolvedValue({ code: "bukan-kode", expires_at: "2026-11-12T10:00:00Z" });
    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.issue("");
    });
    expect(result.current.pairing).toBeNull();
    expect(result.current.error).toMatch(/tidak dapat dibaca/);
  });

  it("shows the safe error text when issuing fails", async () => {
    mocks.issuePairingCode.mockRejectedValue(new ApiError("", 503, "GATEWAY_TIDAK_TERSEDIA"));
    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.issue("");
    });
    expect(result.current.pairing).toBeNull();
    expect(result.current.error).toMatch(/tidak tersedia/);
  });

  it("regenerates with the same channel as the last code", async () => {
    const { result } = renderHook(() => usePairing());
    await act(async () => {
      await result.current.issue("whatsapp");
    });
    await act(async () => {
      await result.current.regenerate();
    });
    expect(mocks.issuePairingCode).toHaveBeenLastCalledWith({ channel: "whatsapp" });
    expect(mocks.issuePairingCode).toHaveBeenCalledTimes(2);
  });
});
