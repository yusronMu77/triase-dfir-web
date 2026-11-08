import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMetrics } from "./use-metrics.hook";

describe("useMetrics", () => {
  it("defaults to 7 days and switches to 30 days", () => {
    const { result } = renderHook(() => useMetrics());
    expect(result.current.range).toBe("7");
    expect(result.current.data.summary[0].value).toBe("142");
    act(() => result.current.setRange("30"));
    expect(result.current.data.summary[0].value).toBe("611");
  });
  it("keeps every band total equal to the incoming cards", () => {
    const { result } = renderHook(() => useMetrics("7"));
    const total = result.current.data.byBand.reduce((sum, item) => sum + item.value, 0);
    expect(total).toBe(142);
  });
});
