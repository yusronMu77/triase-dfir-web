import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateFor, useLiveUpdates } from "./use-live-updates.hook";

class FakeSource {
  static last: FakeSource | undefined;
  listeners = new Map<string, () => void>();
  closed = false;
  constructor(public url: string) {
    FakeSource.last = this;
  }
  addEventListener(type: string, fn: () => void) {
    this.listeners.set(type, fn);
  }
  removeEventListener(type: string) {
    this.listeners.delete(type);
  }
  close() {
    this.closed = true;
  }
}

const wrapperFor =
  (client: QueryClient) =>
  ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

describe("useLiveUpdates", () => {
  beforeEach(() => {
    FakeSource.last = undefined;
    vi.stubGlobal("EventSource", FakeSource);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("invalidates card queries on ticket events and closes the stream on unmount", () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    const { unmount } = renderHook(() => useLiveUpdates(true), { wrapper: wrapperFor(client) });
    expect(FakeSource.last?.url).toBe("/api/v1/stream");
    FakeSource.last?.listeners.get("ticket.updated")?.();
    expect(spy).toHaveBeenCalledWith({ queryKey: ["cards"] });
    unmount();
    expect(FakeSource.last?.closed).toBe(true);
  });

  it("does not connect while disabled", () => {
    renderHook(() => useLiveUpdates(false), { wrapper: wrapperFor(new QueryClient()) });
    expect(FakeSource.last).toBeUndefined();
  });
});

describe("invalidateFor", () => {
  it("refetches everything on resync and ignores unknown types", () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    invalidateFor(client, "resync");
    expect(spy).toHaveBeenCalledWith();
    spy.mockClear();
    invalidateFor(client, "something.else");
    expect(spy).not.toHaveBeenCalled();
  });
});
