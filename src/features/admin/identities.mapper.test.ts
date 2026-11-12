import { describe, expect, it } from "vitest";
import type { IdentityItem } from "../../services/identities.types";
import { normalizeChannelInput, toIdentityRows, toPairingView } from "./identities.mapper";

const items: IdentityItem[] = [
  { id: "idn_1", user_id: "usr_me", channel_id: "telegram", status: "aktif" },
  { id: "idn_2", user_id: "usr_other", channel_id: "whatsapp", status: "aktif" },
  { id: "idn_3", user_id: "usr_me", channel_id: "email", status: "dicabut" },
];

describe("toIdentityRows", () => {
  it("lets a non-admin revoke only their own active bindings", () => {
    const rows = toIdentityRows(items, { userId: "usr_me", canManageAll: false });
    expect(rows.map((row) => [row.id, row.canRevoke])).toEqual([
      ["idn_1", true],
      ["idn_2", false],
      ["idn_3", false],
    ]);
    expect(rows[0].ownerLabel).toBe("Anda");
    expect(rows[1].ownerLabel).toBe("usr_other");
  });

  it("lets an admin revoke any active binding, but never a revoked one", () => {
    const rows = toIdentityRows(items, { userId: "usr_admin", canManageAll: true });
    expect(rows.map((row) => row.canRevoke)).toEqual([true, true, false]);
    expect(rows[2].statusLabel).toBe("Dicabut");
    expect(rows[2].tone).toBe("neutral");
  });

  it("gives nobody ownership when the viewer is unknown", () => {
    const rows = toIdentityRows(items, { userId: null, canManageAll: false });
    expect(rows.every((row) => !row.canRevoke)).toBe(true);
  });

  it("never carries the chat handle into the row", () => {
    const leaky = [{ ...items[0], external_id: "123456789" } as IdentityItem];
    expect(JSON.stringify(toIdentityRows(leaky, { userId: "usr_me", canManageAll: false }))).not.toContain(
      "123456789",
    );
  });
});

describe("toPairingView", () => {
  it("accepts a well-formed code and an expiry time", () => {
    expect(toPairingView({ code: "ABCD2345", channel: null, expires_at: "2026-11-12T10:00:00Z" })).toEqual({
      code: "ABCD2345",
      channel: null,
      expiresAt: "2026-11-12T10:00:00Z",
    });
  });

  it("rejects a code outside the Crockford alphabet or an invalid expiry", () => {
    expect(toPairingView({ code: "ABCD-234", expires_at: "2026-11-12T10:00:00Z" })).toBeNull();
    expect(toPairingView({ code: "ABCDILOU", expires_at: "2026-11-12T10:00:00Z" })).toBeNull();
    expect(toPairingView({ code: "ABCD2345", expires_at: "bukan-tanggal" })).toBeNull();
  });
});

describe("normalizeChannelInput", () => {
  it("treats empty input as any channel", () => {
    expect(normalizeChannelInput("   ")).toEqual({ ok: true, channel: undefined });
  });

  it("trims and checks the channel id format", () => {
    expect(normalizeChannelInput(" telegram ")).toEqual({ ok: true, channel: "telegram" });
    expect(normalizeChannelInput("Telegram!")).toMatchObject({ ok: false });
    expect(normalizeChannelInput("1kanal")).toMatchObject({ ok: false });
  });
});
