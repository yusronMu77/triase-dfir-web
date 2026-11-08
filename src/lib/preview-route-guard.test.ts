import { describe, expect, it } from "vitest";
import { queueItems } from "../data/fixtures";
import { isUnknownPreviewRoute } from "./preview-route-guard";

describe("isUnknownPreviewRoute", () => {
  it("menerima ID kartu yang ada", () => {
    expect(isUnknownPreviewRoute(`/cards/${queueItems[0].id}`)).toBe(false);
  });
  it("menolak ID tak dikenal di kartu, digest, dan kasus", () => {
    expect(isUnknownPreviewRoute("/cards/not-a-card")).toBe(true);
    expect(isUnknownPreviewRoute("/digests/not-a-digest")).toBe(true);
    expect(isUnknownPreviewRoute("/cases/not-a-case")).toBe(true);
  });
  it("tidak menyentuh daftar dan rute lain", () => {
    expect(isUnknownPreviewRoute("/cards")).toBe(false);
    expect(isUnknownPreviewRoute("/cards/")).toBe(false);
    expect(isUnknownPreviewRoute("/metrics")).toBe(false);
    expect(isUnknownPreviewRoute("/cards/a/b")).toBe(false);
  });
});
