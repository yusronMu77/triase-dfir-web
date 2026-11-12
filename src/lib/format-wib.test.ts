import { describe, expect, it } from "vitest";
import { formatWib } from "./format-wib";

describe("formatWib", () => {
  it("shifts UTC instants to WIB (UTC+7)", () => {
    expect(formatWib("2026-11-12T01:30:00Z")).toBe("2026-11-12 08:30 WIB");
    expect(formatWib("2026-11-12T01:30:15Z", { seconds: true })).toBe("2026-11-12 08:30:15 WIB");
  });

  it("keeps the wall-clock time of a WIB offset string", () => {
    expect(formatWib("2026-11-12T07:00:00+07:00")).toBe("2026-11-12 07:00 WIB");
  });

  it("crosses the day boundary correctly", () => {
    expect(formatWib("2026-11-12T20:00:00Z")).toBe("2026-11-13 03:00 WIB");
  });

  it("returns a dash for missing values and the raw text for invalid dates", () => {
    expect(formatWib(null)).toBe("-");
    expect(formatWib(undefined)).toBe("-");
    expect(formatWib("")).toBe("-");
    expect(formatWib("bukan tanggal")).toBe("bukan tanggal");
  });
});
