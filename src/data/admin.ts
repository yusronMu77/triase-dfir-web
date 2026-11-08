import type { Role } from "@astria/ui";

export type UserRow = {
  id: string;
  name: string;
  role: Role;
  status: "Aktif" | "Nonaktif";
  lastSeen: string;
};
export type ChannelRow = {
  id: string;
  name: string;
  type: string;
  status: "Terhubung" | "Perlu tes" | "Nonaktif";
  detail: string;
};
export type IdentityRow = {
  id: string;
  user: string;
  channel: string;
  handle: string;
  status: "Terhubung" | "Dicabut";
};
export type DeliveryRow = {
  id: string;
  time: string;
  channel: string;
  subject: string;
  result: "Terkirim" | "Gagal";
  note: string;
};

export const users: UserRow[] = [
  { id: "u1", name: "Rizky Aditya", role: "analis", status: "Aktif", lastSeen: "10 Nov 09:58" },
  { id: "u2", name: "Nadia Putri", role: "dfir", status: "Aktif", lastSeen: "10 Nov 09:40" },
  { id: "u3", name: "Bagus Santoso", role: "pimpinan", status: "Aktif", lastSeen: "10 Nov 07:12" },
  { id: "u4", name: "Dimas Saputra", role: "admin", status: "Aktif", lastSeen: "10 Nov 08:01" },
  { id: "u5", name: "Sari Wulandari", role: "analis", status: "Nonaktif", lastSeen: "2 Nov 16:30" },
];

export const channels: ChannelRow[] = [
  { id: "ch1", name: "Telegram tim", type: "Telegram", status: "Terhubung", detail: "Minimal · polling" },
  { id: "ch2", name: "Email piket", type: "Email", status: "Perlu tes", detail: "smtp.contoh.local:587" },
  { id: "ch3", name: "Webhook SIEM", type: "Webhook", status: "Nonaktif", detail: "Tanda tangan HMAC" },
];

export const identities: IdentityRow[] = [
  { id: "id1", user: "Rizky Aditya", channel: "Telegram", handle: "@rizky_a", status: "Terhubung" },
  { id: "id2", user: "Nadia Putri", channel: "Telegram", handle: "@nadia_p", status: "Terhubung" },
  { id: "id3", user: "Sari Wulandari", channel: "Telegram", handle: "@sari_w", status: "Dicabut" },
];

export const deliveries: DeliveryRow[] = [
  {
    id: "d1",
    time: "10 Nov 09:06",
    channel: "Telegram tim",
    subject: "Kartu IC-20261110-003",
    result: "Terkirim",
    note: "Pesan minimal",
  },
  {
    id: "d2",
    time: "10 Nov 08:53",
    channel: "Email piket",
    subject: "Eskalasi IC-20261110-003",
    result: "Gagal",
    note: "Koneksi SMTP ditolak",
  },
  {
    id: "d3",
    time: "10 Nov 06:00",
    channel: "Telegram tim",
    subject: "Digest DG-20261109",
    result: "Terkirim",
    note: "Pesan minimal",
  },
];
