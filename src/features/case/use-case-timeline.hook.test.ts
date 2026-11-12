import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { caseService } from "../../services/case.service";
import type { CaseTimelineItemDto, CaseTimelinePage } from "../../services/case.types";
import { TIMELINE_PAGE_SIZE, useCaseTimeline } from "./use-case-timeline.hook";

vi.mock("../../services/case.service", () => ({ caseService: { timeline: vi.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

const row = (n: number): CaseTimelineItemDto => ({
  item_id: `TL-20261112-001-${String(n).padStart(5, "0")}`,
  case_id: "CS-20261112-001",
  ts_utc: "2026-11-11T17:10:00Z",
  evidence_id: `EV-${n}`,
  source_id: "hayabusa",
  host: "WS-FIN-02",
  account: null,
  kind: "logon",
  ringkasan: `Kejadian ${n}`,
  injection_suspect: false,
});

const firstPage: CaseTimelinePage = {
  case_id: "CS-20261112-001",
  status: "draf_sebagian",
  items: [row(1), row(2)],
  next_cursor: "TL-20261112-001-00002",
};
const secondPage: CaseTimelinePage = {
  case_id: "CS-20261112-001",
  status: "draf_sebagian",
  items: [row(3)],
  next_cursor: null,
};

describe("useCaseTimeline", () => {
  beforeEach(() => {
    vi.mocked(caseService.timeline).mockReset();
  });

  it("loads the first page and then the next one with its cursor", async () => {
    vi.mocked(caseService.timeline).mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);
    const { result } = renderHook(() => useCaseTimeline("CS-20261112-001"), { wrapper });
    await waitFor(() => expect(result.current.events).toHaveLength(2));
    expect(caseService.timeline).toHaveBeenNthCalledWith(
      1,
      "CS-20261112-001",
      { cursor: undefined, limit: TIMELINE_PAGE_SIZE },
      expect.any(AbortSignal),
    );
    expect(result.current.hasMore).toBe(true);

    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.events).toHaveLength(3));
    expect(caseService.timeline).toHaveBeenNthCalledWith(
      2,
      "CS-20261112-001",
      { cursor: "TL-20261112-001-00002", limit: TIMELINE_PAGE_SIZE },
      expect.any(AbortSignal),
    );
    expect(result.current.hasMore).toBe(false);
    expect(result.current.events[2]?.id).toBe("TL-20261112-001-00003");
  });

  it("does not call the API for a malformed case ID", () => {
    renderHook(() => useCaseTimeline("bukan-id"), { wrapper });
    expect(caseService.timeline).not.toHaveBeenCalled();
  });
});
