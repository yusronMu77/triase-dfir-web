import { describe, expect, it } from "vitest";
import type { ChannelPolicy, GatewayStatus } from "../../services/channels.types";
import {
  failedTestOutcome,
  policyBody,
  testOutcome,
  toChannelRows,
  transportOf,
  unavailableTestOutcome,
} from "./channels.mapper";

const policies: ChannelPolicy[] = [
  { channel_id: "telegram", active: true, max_detail: "sedang", min_band: "TINGGI", version: 4 },
  { channel_id: "email", active: false, max_detail: "ringkas", version: 0 },
];

const status: GatewayStatus = {
  outbox: { pending: 1, sending: 0, sent: 12, dead: 2 },
  telegram: { enabled: true },
  whatsapp: { enabled: false },
};

describe("transportOf", () => {
  it("reads the transport flag for each known channel", () => {
    expect(transportOf("telegram", status)).toBe("aktif");
    expect(transportOf("whatsapp", status)).toBe("nonaktif");
  });

  it("stays unknown when the gateway status is missing or has no flag for the channel", () => {
    expect(transportOf("telegram", null)).toBe("tidak diketahui");
    expect(transportOf("email", status)).toBe("tidak diketahui");
    expect(transportOf("sms", status)).toBe("tidak diketahui");
  });
});

describe("toChannelRows", () => {
  it("joins policy and transport, and keeps the version for the optimistic lock", () => {
    const rows = toChannelRows(policies, status);
    expect(rows[0]).toEqual({
      channelId: "telegram",
      name: "Telegram",
      version: 4,
      saved: { active: true, maxDetail: "sedang", minBand: "TINGGI" },
      transport: "aktif",
    });
    expect(rows[1].saved.minBand).toBe("");
    expect(rows[1].transport).toBe("tidak diketahui");
  });
});

describe("policyBody", () => {
  it("sends the version and leaves min_band out when it is cleared", () => {
    expect(policyBody(3, { active: false, maxDetail: "penuh", minBand: "" })).toEqual({
      active: false,
      max_detail: "penuh",
      if_version: 3,
    });
  });

  it("includes min_band when one is chosen", () => {
    expect(policyBody(3, { active: true, maxDetail: "ringkas", minBand: "KRITIS" })).toEqual({
      active: true,
      max_detail: "ringkas",
      min_band: "KRITIS",
      if_version: 3,
    });
  });
});

describe("testOutcome", () => {
  it("reports success and failure from the reply", () => {
    expect(testOutcome("telegram", { ok: true })).toMatchObject({
      tone: "success",
      title: "Tes kanal berhasil",
    });
    expect(testOutcome("telegram", { ok: false, detail: "token salah" })).toMatchObject({
      tone: "danger",
      message: "token salah",
    });
  });

  it("does not claim success when the reply does not confirm it", () => {
    const outcome = testOutcome("email", {});
    expect(outcome.tone).toBe("info");
    expect(outcome.message).toContain("belum dikonfirmasi");
  });

  it("has honest outcomes for a missing route and for a failed request", () => {
    expect(unavailableTestOutcome("telegram")).toMatchObject({
      tone: "warning",
      title: "Uji koneksi belum tersedia",
    });
    expect(failedTestOutcome("telegram", "Tidak dapat menghubungi layanan.")).toMatchObject({
      tone: "danger",
    });
  });
});
