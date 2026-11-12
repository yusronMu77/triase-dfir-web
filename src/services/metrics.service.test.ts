import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { metricsService } from "./metrics.service";

const fetchMock = vi.fn<typeof fetch>();

describe("metrics service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends the range as dari and sampai, both with a zone", async () => {
    fetchMock.mockResolvedValue(Response.json({ total: 3 }));
    const stats = await metricsService.stats({
      dari: "2026-11-05T03:00:00.000Z",
      sampai: "2026-11-12T03:00:00.000Z",
    });
    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url), "http://localhost");
    expect(parsed.pathname).toBe("/api/v1/metrics");
    expect(parsed.searchParams.get("dari")).toBe("2026-11-05T03:00:00.000Z");
    expect(parsed.searchParams.get("sampai")).toBe("2026-11-12T03:00:00.000Z");
    expect(stats).toEqual({ total: 3 });
  });

  it("maps a 403 for a role without metrics access to a forbidden error", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: { code: "AKSES_DITOLAK", message: "x" } }, { status: 403 }),
    );
    await expect(metricsService.stats({ dari: "a", sampai: "b" })).rejects.toMatchObject({
      kind: "forbidden",
    });
  });
});
