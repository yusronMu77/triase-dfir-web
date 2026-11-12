import type { OutboxMessage, OutboxStatus } from "../../services/outbox.types";
import { formatWaktu } from "./admin-shared";

export const OUTBOX_STATUSES: readonly OutboxStatus[] = ["pending", "sending", "sent", "dead"];

export const STATUS_LABELS: Readonly<Record<OutboxStatus, string>> = {
  pending: "Menunggu",
  sending: "Mengirim",
  sent: "Terkirim",
  dead: "Gagal",
};

const STATUS_TONES: Readonly<Record<OutboxStatus, "neutral" | "info" | "success" | "danger">> = {
  pending: "neutral",
  sending: "info",
  sent: "success",
  dead: "danger",
};

export const STATUS_FILTER_OPTIONS: readonly { value: OutboxStatus | "semua"; label: string }[] = [
  { value: "semua", label: "Semua status" },
  ...OUTBOX_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
];

export function isOutboxStatus(value: string): value is OutboxStatus {
  return (OUTBOX_STATUSES as readonly string[]).includes(value);
}

export type DeliveryRow = {
  id: string;
  channel: string;
  subject: string;
  status: OutboxStatus;
  statusLabel: string;
  tone: "neutral" | "info" | "success" | "danger";
  attempts: number;
  lastError: string | null;
  updatedLabel: string;
  /** Only failed messages can be sent again. */
  retryable: boolean;
};

const CHANNEL_NAMES: Readonly<Record<string, string>> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  email: "Surel",
};

export function toDeliveryRows(items: OutboxMessage[]): DeliveryRow[] {
  return items.map((item) => ({
    id: item.message_id,
    channel: CHANNEL_NAMES[item.channel_id] ?? item.channel_id,
    subject: item.subject,
    status: item.status,
    statusLabel: STATUS_LABELS[item.status],
    tone: STATUS_TONES[item.status],
    attempts: item.attempts,
    lastError: item.last_error ? item.last_error : null,
    updatedLabel: formatWaktu(item.updated_at ?? item.created_at),
    retryable: item.status === "dead",
  }));
}
