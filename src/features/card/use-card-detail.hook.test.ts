import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { cardsService } from "../../services/cards.service";
import type { CardDetail } from "../../services/cards.types";
import { useSession } from "../session/use-session.hook";
import { useCardDetail } from "./use-card-detail.hook";

vi.mock("../../services/cards.service", () => ({
  cardsService: { detail: vi.fn(), evidence: vi.fn() },
}));
vi.mock("../session/use-session.hook", () => ({ useSession: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

const detail = { card_id: "IC-1", row_version: 2 } as unknown as CardDetail;

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

describe("useCardDetail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useSession).mockReturnValue(session(["cards:read", "cards:write", "cards:deep_dive"]));
    vi.mocked(cardsService.detail).mockResolvedValue(detail);
    vi.mocked(cardsService.evidence).mockResolvedValue({
      card_id: "IC-1",
      evidence: [],
      tidak_ditemukan: [],
    });
  });

  it("loads the card and then its evidence", async () => {
    const { result } = renderHook(() => useCardDetail("IC-1"), { wrapper });
    await waitFor(() => expect(result.current.card).toEqual(detail));
    expect(cardsService.detail).toHaveBeenCalledWith("IC-1", expect.anything());
    await waitFor(() => expect(result.current.evidence.data).not.toBeNull());
    expect(cardsService.evidence).toHaveBeenCalledWith("IC-1", expect.anything());
  });

  it("does not ask for evidence when the card itself failed", async () => {
    vi.mocked(cardsService.detail).mockRejectedValue(new ApiError("tidak ada", 404, "TIDAK_DITEMUKAN"));
    const { result } = renderHook(() => useCardDetail("IC-404"), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.card).toBeNull();
    expect(result.current.evidence.error).toBeTruthy();
    expect(cardsService.evidence).not.toHaveBeenCalled();
  });

  it("exposes write and deep-dive rights from the session, not from the card", () => {
    vi.mocked(useSession).mockReturnValue(session(["cards:read", "cards:deep_dive"]));
    const { result } = renderHook(() => useCardDetail("IC-1"), { wrapper });
    expect(result.current.permissions).toEqual({ write: false, deepDive: true });
  });

  it("requests nothing without cards:read", async () => {
    vi.mocked(useSession).mockReturnValue(session(["metrics:read"]));
    const { result } = renderHook(() => useCardDetail("IC-1"), { wrapper });
    expect(result.current.allowed).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.evidence.loading).toBe(false);
    expect(cardsService.detail).not.toHaveBeenCalled();
    expect(cardsService.evidence).not.toHaveBeenCalled();
  });
});
