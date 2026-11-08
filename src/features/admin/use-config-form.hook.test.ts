import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useConfigForm } from "./use-config-form.hook";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => toast,
}));

describe("useConfigForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toast.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("requires a reason when the form has one", async () => {
    const { result } = renderHook(() => useConfigForm("Konfigurasi"));
    const data = new FormData();
    data.set("reason", "x");
    await expect(result.current.submit(data)).rejects.toThrow(/alasan/);
    expect(toast).not.toHaveBeenCalled();
  });

  it("saves a form without a reason field and names the label in the toast", async () => {
    const { result } = renderHook(() => useConfigForm("Pengaturan"));
    await act(async () => {
      const pending = result.current.submit(new FormData());
      await vi.advanceTimersByTimeAsync(600);
      await pending;
    });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Pengaturan tersimpan" }));
  });
});
