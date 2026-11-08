import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditRows } from "../../data/audit";
import { useAuditVerify, verifyChain } from "./use-audit-verify.hook";

describe("verifyChain", () => {
  it("accepts the sample chain", () => {
    expect(verifyChain(auditRows)).toEqual({ ok: true });
  });
  it("reports the first entry whose prev hash does not match", () => {
    const tampered = auditRows.map((row) => (row.seq === 3 ? { ...row, prev: "ffff" } : row));
    expect(verifyChain(tampered)).toEqual({ ok: false, brokenAt: 3 });
  });
  it("accepts an empty or single-entry chain", () => {
    expect(verifyChain([])).toEqual({ ok: true });
    expect(verifyChain(auditRows.slice(0, 1))).toEqual({ ok: true });
  });
});

describe("useAuditVerify", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  async function run(rows: typeof auditRows) {
    const { result } = renderHook(() => useAuditVerify(rows));
    expect(result.current.status).toBe("idle");
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.verify();
    });
    expect(result.current.status).toBe("checking");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
      await pending;
    });
    return result.current;
  }

  it("ends valid for an intact chain", async () => {
    expect((await run(auditRows)).status).toBe("valid");
  });
  it("ends broken and names the entry for a tampered chain", async () => {
    const tampered = auditRows.map((row) => (row.seq === 2 ? { ...row, prev: "0000" } : row));
    const final = await run(tampered);
    expect(final.status).toBe("broken");
    expect(final.brokenAt).toBe(2);
  });
});
