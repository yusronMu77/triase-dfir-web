import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHandoverForm, validateHandover } from "./use-handover-form.hook";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => toast,
}));

const form = (summary: string) => {
  const data = new FormData();
  data.set("summary", summary);
  return data;
};

describe("validateHandover", () => {
  it("requires a summary of at least 10 characters", () => {
    expect(validateHandover(form("pendek"))).not.toBe("");
    expect(validateHandover(form("Dua kartu masih terbuka"))).toBe("");
  });
});

describe("useHandoverForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toast.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("throws on a short summary and does not toast", async () => {
    const { result } = renderHook(() => useHandoverForm());
    await expect(result.current.submit(form("x"))).rejects.toThrow();
    expect(toast).not.toHaveBeenCalled();
  });

  it("acknowledges a valid handover with a toast", async () => {
    const { result } = renderHook(() => useHandoverForm());
    await act(async () => {
      const pending = result.current.submit(form("Dua kartu masih terbuka"));
      await vi.advanceTimersByTimeAsync(600);
      await pending;
    });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Serah terima tercatat" }));
  });
});
