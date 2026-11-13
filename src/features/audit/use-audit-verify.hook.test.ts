import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { auditService } from "../../services/audit.service";
import type { VerifyResult } from "../../services/audit.types";
import { useAuditVerify } from "./use-audit-verify.hook";

vi.mock("../../services/audit.service", () => ({
  auditService: { startVerify: vi.fn(), verifyJob: vi.fn(), list: vi.fn() },
}));
const session = vi.hoisted(() => ({ can: vi.fn((_permission: string) => true) }));
vi.mock("../session/use-session.hook", () => ({ useSession: () => session }));

// One client per test file, cleared before each test: a new client per render would reset the cache mid-test.
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client }, children);

const base: VerifyResult = {
  job_id: null,
  status: "selesai",
  from_seq: 1,
  to_seq: null,
  checked: 120,
  ok: true,
  first_bad_seq: null,
  reason: null,
  anchor_match: true,
  started_at: null,
  finished_at: null,
};

describe("useAuditVerify", () => {
  beforeEach(() => {
    client.clear();
    vi.mocked(auditService.verifyJob).mockReset();
    session.can.mockReset();
    session.can.mockReturnValue(true);
  });

  it("is idle and shows the verify action only to roles with audit:verify", () => {
    const { result } = renderHook(() => useAuditVerify(10), { wrapper });
    expect(result.current.view).toEqual({ kind: "idle" });
    expect(result.current.canVerify).toBe(true);
    expect(session.can).toHaveBeenCalledWith("audit:verify");

    session.can.mockReturnValue(false);
    const denied = renderHook(() => useAuditVerify(10), { wrapper });
    expect(denied.result.current.canVerify).toBe(false);
  });

  it("reports an intact chain at once when the service answers 200", async () => {
    vi.mocked(auditService.startVerify).mockResolvedValue(base);
    const { result } = renderHook(() => useAuditVerify(10), { wrapper });
    act(() => result.current.verify());
    await waitFor(() => expect(result.current.view.kind).toBe("valid"));
    expect(result.current.view).toMatchObject({ checked: 120, anchorText: "Cocok dengan anchor" });
    expect(auditService.verifyJob).not.toHaveBeenCalled();
  });

  it("polls a running job until it finishes and names the broken entry", async () => {
    vi.mocked(auditService.startVerify).mockResolvedValue({
      ...base,
      job_id: "ver_9",
      status: "berjalan",
      ok: null,
      checked: 0,
      anchor_match: null,
    });
    vi.mocked(auditService.verifyJob)
      .mockResolvedValueOnce({ ...base, job_id: "ver_9", status: "berjalan", ok: null, checked: 60 })
      .mockResolvedValue({
        ...base,
        job_id: "ver_9",
        ok: false,
        checked: 100,
        first_bad_seq: 42,
        reason: "entry_hash_tidak_cocok",
        anchor_match: false,
      });
    const { result } = renderHook(() => useAuditVerify(10), { wrapper });
    act(() => result.current.verify());

    await waitFor(() => expect(result.current.view.kind).toBe("broken"));
    expect(result.current.view).toMatchObject({
      firstBadSeq: 42,
      reasonText: "hash entri tidak cocok",
      anchorText: "Tidak cocok dengan anchor",
    });
    expect(result.current.running).toBe(false);
    expect(auditService.verifyJob).toHaveBeenCalledWith("ver_9", expect.anything());

    const reads = vi.mocked(auditService.verifyJob).mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(vi.mocked(auditService.verifyJob).mock.calls.length).toBe(reads);
  });

  it("exposes a failed start as an error and keeps the view idle", async () => {
    vi.mocked(auditService.startVerify).mockRejectedValue(new ApiError("", 403, "PERAN_TIDAK_CUKUP"));
    const { result } = renderHook(() => useAuditVerify(10), { wrapper });
    act(() => result.current.verify());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.view).toEqual({ kind: "idle" });
  });
});
