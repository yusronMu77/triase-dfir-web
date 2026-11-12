import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { caseService } from "../../services/case.service";
import { useCaseReport } from "./use-case-report.hook";

vi.mock("../../services/case.service", () => ({ caseService: { report: vi.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

describe("useCaseReport", () => {
  beforeEach(() => {
    vi.mocked(caseService.report).mockReset();
    URL.createObjectURL = vi.fn(() => "blob:report-1");
    URL.revokeObjectURL = vi.fn();
  });

  it("does not download the report until it is requested", () => {
    const { result } = renderHook(() => useCaseReport("CS-20261112-001"), { wrapper });
    expect(caseService.report).not.toHaveBeenCalled();
    expect(result.current.requested).toBe(false);
  });

  it("downloads the report once requested and exposes an object URL", async () => {
    vi.mocked(caseService.report).mockResolvedValue(new Blob(["<h1>Laporan</h1>"], { type: "text/html" }));
    const { result } = renderHook(() => useCaseReport("CS-20261112-001"), { wrapper });
    act(() => result.current.request());
    await waitFor(() => expect(result.current.url).toBe("blob:report-1"));
    expect(caseService.report).toHaveBeenCalledWith("CS-20261112-001", expect.any(AbortSignal));
  });

  it("does not download for a malformed ID even when requested", () => {
    const { result } = renderHook(() => useCaseReport("CS-kosong"), { wrapper });
    act(() => result.current.request());
    expect(caseService.report).not.toHaveBeenCalled();
  });
});
