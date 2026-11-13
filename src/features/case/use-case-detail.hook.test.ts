import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { caseService } from "../../services/case.service";
import type { CaseDto } from "../../services/case.types";
import { useCaseDetail } from "./use-case-detail.hook";

vi.mock("../../services/case.service", () => ({ caseService: { get: vi.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

const dto: CaseDto = {
  case_id: "CS-20261112-001",
  status: "linimasa_siap",
  card_id: "IC-20261112-0007",
  card_version: 2,
  requested_by: "usr_analis",
  window: null,
  keterbatasan: [],
  created_at: "2026-11-12T01:00:00Z",
  updated_at: "2026-11-12T01:00:00Z",
  report: null,
};

describe("useCaseDetail", () => {
  beforeEach(() => {
    vi.mocked(caseService.get).mockReset();
  });

  it("loads and maps the case", async () => {
    vi.mocked(caseService.get).mockResolvedValue(dto);
    const { result } = renderHook(() => useCaseDetail("CS-20261112-001"), { wrapper });
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(caseService.get).toHaveBeenCalledWith("CS-20261112-001", expect.any(AbortSignal));
    expect(result.current.data?.statusLabel).toBe("Timeline siap");
    expect(result.current.error).toBeNull();
  });

  it("does not call the API for a malformed ID", () => {
    const { result } = renderHook(() => useCaseDetail("../rahasia"), { wrapper });
    expect(caseService.get).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("exposes a 404 as an error the view can show", async () => {
    vi.mocked(caseService.get).mockRejectedValue(new ApiError("", 404, "KASUS_TIDAK_DITEMUKAN"));
    const { result } = renderHook(() => useCaseDetail("CS-20261112-999"), { wrapper });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.data).toBeNull();
  });
});
