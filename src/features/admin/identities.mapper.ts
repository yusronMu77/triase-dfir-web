import type { IdentityItem, IdentityStatus, PairingCode } from "../../services/identities.types";
import { formatWaktu } from "./admin-shared";

const CHANNEL_ID = /^[a-z][a-z0-9-]*$/;
const CHANNEL_NAMES: Readonly<Record<string, string>> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  email: "Surel",
};

export type IdentityRow = {
  id: string;
  channelName: string;
  ownerLabel: string;
  status: IdentityStatus;
  statusLabel: string;
  tone: "success" | "neutral";
  updatedLabel: string;
  /** Active bindings only; the api still decides, this hides the button for bindings the caller cannot touch. */
  canRevoke: boolean;
};

export type Viewer = { userId: string | null; canManageAll: boolean };

export function toIdentityRows(items: IdentityItem[], viewer: Viewer): IdentityRow[] {
  return items.map((item) => {
    const own = viewer.userId !== null && item.user_id === viewer.userId;
    const active = item.status === "aktif";
    return {
      id: item.id,
      channelName: CHANNEL_NAMES[item.channel_id] ?? item.channel_id,
      ownerLabel: own ? "Anda" : item.user_id,
      status: item.status,
      statusLabel: active ? "Aktif" : "Dicabut",
      tone: active ? "success" : "neutral",
      updatedLabel: formatWaktu(item.updated_at),
      canRevoke: active && (viewer.canManageAll || own),
    };
  });
}

export type PairingView = { code: string; channel: string | null; expiresAt: string };

/** Returns null when the reply is not a usable pairing code (the caller then shows a read error). */
export function toPairingView(issued: PairingCode): PairingView | null {
  if (!/^[0-9A-HJKMNP-TV-Z]{8}$/.test(issued.code)) return null;
  if (!Number.isFinite(Date.parse(issued.expires_at))) return null;
  return { code: issued.code, channel: issued.channel ?? null, expiresAt: issued.expires_at };
}

export type ChannelInput = { ok: true; channel: string | undefined } | { ok: false; message: string };

/** Empty input means "any channel". Otherwise it must match the channel id format used by config. */
export function normalizeChannelInput(text: string): ChannelInput {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, channel: undefined };
  if (!CHANNEL_ID.test(trimmed)) {
    return { ok: false, message: "Kanal harus huruf kecil, angka, atau tanda hubung, dimulai huruf." };
  }
  return { ok: true, channel: trimmed };
}
