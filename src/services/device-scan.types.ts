/**
 * Device scan types. No upstream route exists yet (the ingest service has no `/svc/v1/devices` or
 * `/svc/v1/device-scans`), so these shapes follow the design note `notes/2026-11-06-triase-dfir-pemindaian-android.md`
 * (section 9). Every field the code has not confirmed is optional. Re-check against code before a screen uses them.
 */

/** Body of `POST /api/v1/device-scans` (the BFF forwards it unchanged). Consent fields are not yet defined in code. */
export type DeviceScanRequest = {
  device_id: string;
  consent_id?: string;
  scope_flags?: string[];
};

export type Device = {
  device_id: string;
  label?: string;
  model?: string;
  android_version?: string;
  criticality?: number;
};

/** Assumed wrapper for `GET /api/v1/devices`, following the `items` convention of the other list responses. */
export type DevicePage = {
  items: Device[];
};

/** Status of one scan job. The BFF path uses `scan_id` while the design note calls it `job_id`. */
export type DeviceScan = {
  scan_id: string;
  device_id?: string;
  status: string;
  scope_flags?: string[];
  created_at?: string;
};
