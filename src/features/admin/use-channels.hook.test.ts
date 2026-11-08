import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../data/admin";
import { simulateChannelTest, useChannels } from "./use-channels.hook";

describe("simulateChannelTest", () => {
  it("passes only for connected channels", () => {
    expect(simulateChannelTest(channels[0])).toBe(true);
    expect(simulateChannelTest(channels[1])).toBe(false);
    expect(simulateChannelTest(channels[2])).toBe(false);
  });
});

describe("useChannels", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports testing, then the result", async () => {
    const { result } = renderHook(() => useChannels(channels));
    expect(result.current.result).toBeNull();
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.test("ch2");
    });
    expect(result.current.testing).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
      await pending;
    });
    expect(result.current.testing).toBe(false);
    expect(result.current.result).toEqual({ id: "ch2", ok: false });
  });

  it("ignores an unknown channel", async () => {
    const { result } = renderHook(() => useChannels(channels));
    await act(async () => {
      await result.current.test("missing");
    });
    expect(result.current.result).toBeNull();
  });
});
