import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceScanService } from "./device-scan.service";

const fetchMock = vi.fn<typeof fetch>();

describe("deviceScanService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("posts a scan request as JSON", async () => {
    fetchMock.mockResolvedValue(Response.json({ scan_id: "scan-1", status: "queued" }, { status: 202 }));
    const body = { device_id: "dev-1", scope_flags: ["apps"] };
    expect(await deviceScanService.create(body)).toEqual({ scan_id: "scan-1", status: "queued" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/device-scans");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", body: JSON.stringify(body) });
  });

  it("lists devices with GET", async () => {
    fetchMock.mockResolvedValue(Response.json({ items: [{ device_id: "dev-1" }] }));
    expect(await deviceScanService.devices()).toEqual({ items: [{ device_id: "dev-1" }] });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/devices");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
  });

  it("reads one scan by encoded id and maps a missing scan to not-found", async () => {
    fetchMock.mockResolvedValue(Response.json({ scan_id: "scan 1", status: "running" }));
    await deviceScanService.scan("scan 1");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/device-scans/scan%201");

    fetchMock.mockResolvedValue(Response.json({ error: { code: "TIDAK_ADA" } }, { status: 404 }));
    await expect(deviceScanService.scan("x")).rejects.toMatchObject({ kind: "not-found" });
  });
});
