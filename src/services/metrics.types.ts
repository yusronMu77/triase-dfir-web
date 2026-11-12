/** `GET /metrics` answer: the ticket `statistik` payload (`ticket/src/astria_ticket/layanan.py`), passed through. */
export type TicketStats = {
  dari: string | null;
  sampai: string | null;
  total: number;
  /** Keys are ticket statuses (`baru`, `ditinjau`, ...). */
  per_status: Record<string, number>;
  /** Keys are ticket bands (`KRITIS`, `TINGGI`, `SEDANG`, `RENDAH`). */
  per_band: Record<string, number>;
  per_prioritas: Record<string, number>;
  /** Cards whose first response was late (SLA breached). */
  sla_terlanggar: number;
  /** Keys are feedback labels (`benar`, `salah_positif`, `perlu_dfir`). */
  umpan_balik: Record<string, number>;
};

export type MetricsRange = { dari: string; sampai: string };
