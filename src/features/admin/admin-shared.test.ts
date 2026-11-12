import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { formatWaktu, isRouteUnavailable } from "./admin-shared";

describe("isRouteUnavailable", () => {
  it("is true only for a not-found answer", () => {
    expect(isRouteUnavailable(new ApiError("", 404, "TIDAK_DITEMUKAN"))).toBe(true);
    expect(isRouteUnavailable(new ApiError("", 403, "DILARANG"))).toBe(false);
    expect(isRouteUnavailable(new Error("x"))).toBe(false);
    expect(isRouteUnavailable(null)).toBe(false);
  });
});

describe("formatWaktu", () => {
  it("shows a dash for missing or invalid timestamps", () => {
    expect(formatWaktu(null)).toBe("—");
    expect(formatWaktu(undefined)).toBe("—");
    expect(formatWaktu("bukan-tanggal")).toBe("—");
  });

  it("formats a valid timestamp", () => {
    expect(formatWaktu("2026-11-12T03:00:00Z")).toMatch(/2026/);
  });
});
