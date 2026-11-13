import { describe, expect, it } from "vitest";
import type { SettingItem } from "../../services/config.types";
import {
  draftTextOf,
  editKindOf,
  groupByScope,
  parseDraft,
  scopeLabel,
  scopeOf,
  toConfigRows,
} from "./config.mapper";

const items: SettingItem[] = [
  { key: "model.chain", value: ["online", "templat"], source: "database", version: 2, locked: false },
  { key: "score.band", value: { kritis: 70, tinggi: 50, sedang: 30 }, source: "bawaan", version: 0 },
  { key: "model.api_key", terisi: true, version: 1, updated_at: "2026-11-12T03:00:00Z" },
  { key: "chat.allow_t2", value: false, source: "env", version: 0, locked: true },
  { key: "retention.raw_days", value: null, source: "bawaan", version: 0 },
  { key: "schedule.digest", value: "0 7 * * 1-5", source: "berkas", version: 0 },
];

describe("scopeOf and scopeLabel", () => {
  it("takes the part before the first dot", () => {
    expect(scopeOf("model.api_key")).toBe("model");
    expect(scopeOf("api.public_base_url")).toBe("api");
  });

  it("labels known scopes and marks unknown ones", () => {
    expect(scopeLabel("score")).toBe("Ambang skor");
    expect(scopeLabel("baru")).toBe("Lainnya (baru)");
  });
});

describe("editKindOf and draftTextOf", () => {
  it("picks an input kind from the value type, and JSON for arrays, objects and null", () => {
    expect(editKindOf(true)).toBe("bool");
    expect(editKindOf(30)).toBe("number");
    expect(editKindOf("0 7 * * 1-5")).toBe("text");
    expect(editKindOf(["a"])).toBe("json");
    expect(editKindOf({ a: 1 })).toBe("json");
    expect(editKindOf(null)).toBe("json");
  });

  it("starts the editor with the stored text", () => {
    expect(draftTextOf("abc")).toBe("abc");
    expect(draftTextOf(false)).toBe("false");
    expect(draftTextOf(null)).toBe("null");
    expect(draftTextOf({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});

describe("toConfigRows", () => {
  it("puts operational scopes and secrets on /configuration", () => {
    const rows = toConfigRows(items, "configuration");
    expect(rows.settings.map((row) => row.key)).toEqual(["model.chain", "score.band"]);
    expect(rows.secrets).toEqual([
      { key: "model.api_key", filled: true, version: 1, updatedLabel: expect.any(String) },
    ]);
  });

  it("puts every other scope on /settings and no secrets", () => {
    const rows = toConfigRows(items, "settings");
    expect(rows.settings.map((row) => row.key)).toEqual([
      "chat.allow_t2",
      "retention.raw_days",
      "schedule.digest",
    ]);
    expect(rows.secrets).toEqual([]);
  });

  it("maps source labels, lock state and the edit kind", () => {
    const row = toConfigRows(items, "settings").settings.find((r) => r.key === "chat.allow_t2");
    expect(row).toMatchObject({
      source: "env",
      sourceLabel: "Env var",
      locked: true,
      editKind: "bool",
      draftText: "false",
      version: 0,
    });
  });

  it("never returns a secret value, even if one is present on the item", () => {
    const leaky = {
      key: "model.api_key",
      terisi: true,
      version: 1,
      value: "rahasia-uji",
    } as unknown as SettingItem;
    const rows = toConfigRows([leaky], "configuration");
    expect(JSON.stringify(rows)).not.toContain("rahasia-uji");
  });
});

describe("groupByScope", () => {
  it("groups rows by scope in order of first appearance", () => {
    const groups = groupByScope(toConfigRows(items, "settings").settings);
    expect(groups.map((group) => group.scope)).toEqual(["chat", "retention", "schedule"]);
    expect(groups[0].label).toBe("Perintah chat");
  });
});

describe("parseDraft", () => {
  it("accepts only true or false for booleans", () => {
    expect(parseDraft("bool", "true")).toEqual({ ok: true, value: true });
    expect(parseDraft("bool", "ya")).toMatchObject({ ok: false });
  });

  it("requires a number, not an empty string", () => {
    expect(parseDraft("number", " 42 ")).toEqual({ ok: true, value: 42 });
    expect(parseDraft("number", "")).toMatchObject({ ok: false });
    expect(parseDraft("number", "abc")).toMatchObject({ ok: false });
  });

  it("keeps text as typed", () => {
    expect(parseDraft("text", "  teks  ")).toEqual({ ok: true, value: "  teks  " });
  });

  it("parses JSON and reports an invalid document without echoing the input", () => {
    expect(parseDraft("json", '["online"]')).toEqual({ ok: true, value: ["online"] });
    expect(parseDraft("json", "null")).toEqual({ ok: true, value: null });
    const bad = parseDraft("json", "{rahasia-uji");
    expect(bad).toEqual({ ok: false, message: "Format JSON tidak valid." });
    expect(JSON.stringify(bad)).not.toContain("rahasia-uji");
  });
});
