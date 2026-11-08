import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useShowcase } from "./use-showcase.hook";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => toast,
}));

describe("useShowcase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toast.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("starts on the foundations tab as analyst", () => {
    const { result } = renderHook(() => useShowcase());
    expect(result.current.tab).toBe("foundations");
    expect(result.current.role).toBe("analis");
    expect(result.current.uploadState).toBe("idle");
  });

  it("saves with a toast, or fails when the error switch is on", async () => {
    const { result } = renderHook(() => useShowcase());
    await act(async () => {
      const pending = result.current.save();
      await vi.advanceTimersByTimeAsync(800);
      await pending;
    });
    expect(toast).toHaveBeenCalledTimes(1);
    act(() => result.current.setError(true));
    await act(async () => {
      const pending = result.current.save().catch((error: Error) => error.message);
      await vi.advanceTimersByTimeAsync(800);
      expect(await pending).toMatch(/kegagalan/);
    });
    expect(toast).toHaveBeenCalledTimes(1);
  });

  it("walks the upload simulation to success", async () => {
    const { result } = renderHook(() => useShowcase());
    await act(async () => {
      const pending = result.current.upload();
      await vi.advanceTimersByTimeAsync(2000);
      await pending;
    });
    expect(result.current.uploadState).toBe("success");
    expect(result.current.progress).toBe(100);
  });
});
