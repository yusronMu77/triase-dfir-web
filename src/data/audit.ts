export type AuditRow = {
  seq: number;
  time: string;
  actor: string;
  action: string;
  subject: string;
  prev: string;
  hash: string;
};

/** Short sample hashes. The real chain is computed and verified by the audit service. */
export const auditRows: AuditRow[] = [
  {
    seq: 1,
    time: "10 Nov 08:01",
    actor: "Dimas Saputra",
    action: "Ubah konfigurasi",
    subject: "SLA respons",
    prev: "0000",
    hash: "a41f",
  },
  {
    seq: 2,
    time: "10 Nov 08:14",
    actor: "Rizky Aditya",
    action: "Tinjau kartu",
    subject: "IC-20261110-001",
    prev: "a41f",
    hash: "7be2",
  },
  {
    seq: 3,
    time: "10 Nov 08:52",
    actor: "Rizky Aditya",
    action: "Eskalasi ke DFIR",
    subject: "IC-20261110-003",
    prev: "7be2",
    hash: "c093",
  },
  {
    seq: 4,
    time: "10 Nov 09:05",
    actor: "Nadia Putri",
    action: "Buka kasus",
    subject: "CS-20261110-001",
    prev: "c093",
    hash: "5d70",
  },
  {
    seq: 5,
    time: "10 Nov 09:40",
    actor: "Nadia Putri",
    action: "Perbarui kasus",
    subject: "CS-20261110-001",
    prev: "5d70",
    hash: "e8a6",
  },
];
