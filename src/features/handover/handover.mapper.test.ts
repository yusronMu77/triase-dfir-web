import { describe, expect, it } from "vitest";
import { handoverFields, toHandoverDraft, toHandoverRequest, validateHandover } from "./handover.mapper";

const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

describe("toHandoverDraft", () => {
  it("prefills from the draft when one exists", () => {
    expect(toHandoverDraft({ catatan: "Dua kartu masih terbuka", jumlah_terbuka: 2 })).toEqual({
      summary: "Dua kartu masih terbuka",
      open: 2,
      loaded: true,
    });
  });

  it("fills the gaps of a partial draft without inventing values", () => {
    expect(toHandoverDraft({ serah_id: "SH-20261112-0700" })).toEqual({ summary: "", open: 0, loaded: true });
    expect(toHandoverDraft({ jumlah_terbuka: -3 }).open).toBe(0);
  });

  it("reports nothing loaded when there is no draft", () => {
    expect(toHandoverDraft(null)).toEqual({ summary: "", open: 0, loaded: false });
    expect(toHandoverDraft(undefined).loaded).toBe(false);
  });
});

describe("validateHandover", () => {
  it("requires a summary of at least 10 characters", () => {
    expect(validateHandover(form({ summary: "pendek", open: "0" }))).toBe(
      "Ringkasan serah terima minimal 10 karakter.",
    );
    expect(validateHandover(form({ summary: "Dua kartu masih terbuka", open: "0" }))).toBe("");
  });

  it("does not count surrounding spaces toward the minimum", () => {
    expect(validateHandover(form({ summary: "   pendek    ", open: "0" }))).not.toBe("");
  });

  it("rejects a non-integer or negative open count", () => {
    const message = "Jumlah kartu terbuka harus bilangan bulat, 0 atau lebih.";
    expect(validateHandover(form({ summary: "Dua kartu masih terbuka", open: "1.5" }))).toBe(message);
    expect(validateHandover(form({ summary: "Dua kartu masih terbuka", open: "-1" }))).toBe(message);
    expect(validateHandover(form({ summary: "Dua kartu masih terbuka", open: "" }))).toBe("");
  });
});

describe("toHandoverRequest", () => {
  it("maps form values to the request body", () => {
    expect(
      toHandoverRequest(form({ shift: "malam", open: " 3 ", summary: "  Dua kartu masih terbuka  " })),
    ).toEqual({ catatan: "Dua kartu masih terbuka", jumlah_terbuka: 3, shift: "malam" });
  });

  it("defaults the open count to zero when it is empty", () => {
    expect(
      toHandoverRequest(form({ shift: "pagi", summary: "Tidak ada kartu terbuka" })).jumlah_terbuka,
    ).toBe(0);
  });
});

describe("handoverFields", () => {
  it("prefills the open count and the summary from the draft", () => {
    const fields = handoverFields({ summary: "Catatan draf", open: 4, loaded: true });
    const open = fields.find((field) => field.name === "open");
    const summary = fields.find((field) => field.name === "summary");
    expect(open?.defaultValue).toBe("4");
    expect(summary?.defaultValue).toBe("Catatan draf");
    expect(fields.map((field) => field.name)).toEqual(["shift", "open", "summary"]);
  });
});
