import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { outboxService } from "./outbox.service";

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const lastCall = (fetchMock: ReturnType<typeof vi.fn>) => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init };
};

describe("outboxService", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("leaves the status filter out when all statuses are wanted", async () => {
    fetchMock.mockResolvedValue(json({ items: [] }));
    await outboxService.list();
    expect(lastCall(fetchMock).url).toBe("/api/v1/outbox");
  });

  it("passes the status as a query parameter", async () => {
    fetchMock.mockResolvedValue(json({ items: [] }));
    await outboxService.list("dead");
    expect(lastCall(fetchMock).url).toBe("/api/v1/outbox?status=dead");
  });

  it("retries with POST and accepts an empty 200 reply", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    await expect(outboxService.retry("msg_1")).resolves.toBeUndefined();
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe("/api/v1/outbox/msg_1/retry");
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });
});
