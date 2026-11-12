import { api } from "../lib/http/api-client";
import type { DevicePage, DeviceScan, DeviceScanRequest } from "./device-scan.types";

/** Phone scans. No screen uses these yet; the upstream routes are not implemented (see device-scan.types.ts). */
export const deviceScanService = {
  /** `POST /api/v1/device-scans` (202). Needs `device_scans`. */
  create: (body: DeviceScanRequest, signal?: AbortSignal) =>
    api.post<DeviceScan>("/device-scans", body, { signal }),
  /** `GET /api/v1/devices`. Needs `device_scans`. */
  devices: (signal?: AbortSignal) => api.get<DevicePage>("/devices", undefined, signal),
  /** `GET /api/v1/device-scans/{scan_id}`. Needs `device_scans`. */
  scan: (scanId: string, signal?: AbortSignal) =>
    api.get<DeviceScan>(`/device-scans/${encodeURIComponent(scanId)}`, undefined, signal),
};
