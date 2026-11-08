import type { Severity } from "@astria/ui";

export type CaseRow = {
  id: string;
  title: string;
  cardId: string;
  band: Severity;
  score: number;
  owner: string;
  status: "Diselidiki" | "Menunggu laporan" | "Selesai";
  updated: string;
  asset: string;
};

export const cases: CaseRow[] = [
  {
    id: "CS-20261110-001",
    title: "Pengambilalihan akun layanan svc-backup",
    cardId: "IC-20261110-003",
    band: "critical",
    score: 71,
    owner: "Nadia P.",
    status: "Diselidiki",
    updated: "10 Nov 2026 09:40",
    asset: "WS-ADM-04",
  },
  {
    id: "CS-20261109-004",
    title: "Aktivitas PowerShell di WS-HR-11",
    cardId: "IC-20261109-011",
    band: "medium",
    score: 33,
    owner: "Nadia P.",
    status: "Menunggu laporan",
    updated: "9 Nov 2026 16:20",
    asset: "WS-HR-11",
  },
  {
    id: "CS-20261107-002",
    title: "Penghapusan log keamanan di WS-LOG-07",
    cardId: "IC-20261109-012",
    band: "medium",
    score: 38,
    owner: "Nadia P.",
    status: "Selesai",
    updated: "8 Nov 2026 11:05",
    asset: "WS-LOG-07",
  },
];

export const findCase = (id: string) => cases.find((row) => row.id === id);
