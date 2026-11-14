import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { caseService } from "../../services/case.service";
import type { CaseCustodyDto } from "../../services/case.types";
import { useCaseCustody } from "./use-case-custody.hook";

vi.mock("../../services/case.service", () => ({ caseService: { custody: vi.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

const custody: CaseCustodyDto = {
  case_id: "CS-20261114-001",
  chain_ok: true,
  entries: [
    {
      case_id: "CS-20261114-001",
      seq: 1,
      ts: "2026-11-14T13:20:00.123456Z",
      actor: "usr_dev03",
      action: "KASUS_DIBUAT",
      artifact_id: null,
      sha256: null,
      detail: "IC-20261110-001 versi 1",
      prev_hash: "a".repeat(64),
      entry_hash: "b".repeat(64),
    },
  ],
};

describe("useCaseCustody", () => {
  beforeEach(() => {
    vi.mocked(caseService.custody).mockReset();
  });

  it("loads custody entries and keeps dfir's chain verdict and hashes", async () => {
    vi.mocked(caseService.custody).mockResolvedValue(custody);
    const { result } = renderHook(() => useCaseCustody("CS-20261114-001"), { wrapper });
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(caseService.custody).toHaveBeenCalledWith("CS-20261114-001", expect.any(AbortSignal));
    expect(result.current.data?.chainOk).toBe(true);
    expect(result.current.data?.rows[0]).toMatchObject({
      seq: 1,
      action: "KASUS_DIBUAT",
      actionLabel: "Kasus dibuat",
      ts: "2026-11-14T13:20:00.123456Z",
      entryHash: "b".repeat(64),
      prevHash: "a".repeat(64),
    });
  });

  it("exposes the API error instead of any fallback data", async () => {
    vi.mocked(caseService.custody).mockRejectedValue(
      new ApiError("layanan dfir galat", 502, "LAYANAN_GALAT"),
    );
    const { result } = renderHook(() => useCaseCustody("CS-20261114-001"), { wrapper });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.data).toBeNull();
  });

  it("does not call the API for a malformed case ID", () => {
    renderHook(() => useCaseCustody("bukan-id"), { wrapper });
    expect(caseService.custody).not.toHaveBeenCalled();
  });
});
