export type DigestRow = {
  id: string;
  period: string;
  created: string;
  cards: number;
  high: number;
  status: "Terkirim" | "Draf";
  summary: string;
  cardIds: string[];
};

export const digests: DigestRow[] = [
  {
    id: "DG-20261110",
    period: "10 Nov 2026 · harian",
    created: "Belum dikirim",
    cards: 8,
    high: 4,
    status: "Draf",
    summary: "Draf berjalan. Isi berubah sampai pengiriman pukul 06:00 esok hari.",
    cardIds: ["IC-20261110-001", "IC-20261110-003", "IC-20261110-002", "IC-20261110-004"],
  },
  {
    id: "DG-20261109",
    period: "9 Nov 2026 · harian",
    created: "10 Nov 2026 06:00",
    cards: 14,
    high: 5,
    status: "Terkirim",
    summary:
      "Aktivitas autentikasi mencurigakan mendominasi: dua aset administrasi dan satu server berkas memerlukan tinjauan lanjutan.",
    cardIds: ["IC-20261109-014", "IC-20261109-012", "IC-20261109-011"],
  },
  {
    id: "DG-20261108",
    period: "8 Nov 2026 · harian",
    created: "9 Nov 2026 06:00",
    cards: 9,
    high: 2,
    status: "Terkirim",
    summary: "Volume alert rendah. Satu eskalasi ke DFIR sudah ditutup dengan catatan penyelidikan.",
    cardIds: ["IC-20261109-009"],
  },
];

export const findDigest = (id: string) => digests.find((digest) => digest.id === id);
