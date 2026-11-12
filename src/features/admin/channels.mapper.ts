import type {
  Band,
  ChannelPolicy,
  ChannelTestResult,
  GatewayStatus,
  MaxDetail,
  PutChannelPolicyRequest,
} from "../../services/channels.types";

export const MAX_DETAIL_OPTIONS: readonly { value: MaxDetail; label: string }[] = [
  { value: "ringkas", label: "Ringkas" },
  { value: "sedang", label: "Sedang" },
  { value: "penuh", label: "Penuh" },
];

export const MIN_BAND_OPTIONS: readonly { value: Band | ""; label: string }[] = [
  { value: "", label: "Tanpa ambang" },
  { value: "RENDAH", label: "Rendah" },
  { value: "SEDANG", label: "Sedang" },
  { value: "TINGGI", label: "Tinggi" },
  { value: "KRITIS", label: "Kritis" },
];

const CHANNEL_NAMES: Readonly<Record<string, string>> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  email: "Surel",
};

export type Transport = "aktif" | "nonaktif" | "tidak diketahui";

/** Editable policy fields. The row's saved values are the starting point of every draft. */
export type PolicyDraft = { active: boolean; maxDetail: MaxDetail; minBand: Band | "" };

export type ChannelRow = {
  channelId: string;
  name: string;
  version: number;
  saved: PolicyDraft;
  transport: Transport;
};

export type TestOutcome = {
  channelId: string;
  tone: "success" | "danger" | "info" | "warning";
  title: string;
  message: string;
};

export function channelName(channelId: string): string {
  return CHANNEL_NAMES[channelId] ?? channelId;
}

/** Transport state from the gateway status. Unknown channels, or a missing status, stay "tidak diketahui". */
export function transportOf(channelId: string, status: GatewayStatus | null): Transport {
  const flag =
    channelId === "telegram"
      ? status?.telegram?.enabled
      : channelId === "whatsapp"
        ? status?.whatsapp?.enabled
        : channelId === "email"
          ? status?.email?.enabled
          : undefined;
  if (flag === true) return "aktif";
  if (flag === false) return "nonaktif";
  return "tidak diketahui";
}

export function toChannelRows(policies: ChannelPolicy[], status: GatewayStatus | null): ChannelRow[] {
  return policies.map((policy) => ({
    channelId: policy.channel_id,
    name: channelName(policy.channel_id),
    version: policy.version,
    saved: { active: policy.active, maxDetail: policy.max_detail, minBand: policy.min_band ?? "" },
    transport: transportOf(policy.channel_id, status),
  }));
}

/** Request body for a policy save. `min_band` is left out when cleared, because the contract has no null. */
export function policyBody(version: number, draft: PolicyDraft): PutChannelPolicyRequest {
  const body: PutChannelPolicyRequest = {
    active: draft.active,
    max_detail: draft.maxDetail,
    if_version: version,
  };
  if (draft.minBand) body.min_band = draft.minBand;
  return body;
}

export function testOutcome(channelId: string, result: ChannelTestResult): TestOutcome {
  if (result.ok === true) {
    return {
      channelId,
      tone: "success",
      title: "Tes kanal berhasil",
      message: result.detail ?? "Pesan uji terkirim.",
    };
  }
  if (result.ok === false) {
    return {
      channelId,
      tone: "danger",
      title: "Tes kanal gagal",
      message: result.detail ?? "Pesan uji gagal dikirim. Periksa koneksi kanal.",
    };
  }
  return {
    channelId,
    tone: "info",
    title: "Permintaan uji diterima",
    message: "Permintaan uji sudah dikirim. Hasil belum dikonfirmasi layanan.",
  };
}

export function unavailableTestOutcome(channelId: string): TestOutcome {
  return {
    channelId,
    tone: "warning",
    title: "Uji koneksi belum tersedia",
    message: "Layanan gateway belum menyediakan uji koneksi untuk kanal ini.",
  };
}

export function failedTestOutcome(channelId: string, message: string): TestOutcome {
  return { channelId, tone: "danger", title: "Tes kanal gagal", message };
}
