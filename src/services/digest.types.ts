/** Digest responses through the api proxy (`/api/v1/digests...`). Mirrors `scheduler/src/astria_scheduler/api.py`. */

/** One row of `GET /digests`. `periode` is already formatted by scheduler (WIB). */
export type DigestSummaryDto = {
  digest_id: string;
  jenis: string;
  periode: string;
  periode_mulai: string | null;
  periode_selesai: string | null;
  /** One of `terjadwal`, `berjalan`, `terbit`, `gagal`, `terlewat`, `mati` (scheduler state machine). */
  status: string;
  terlambat: boolean;
  tautan?: string | null;
};

export type DigestPageDto = {
  items: DigestSummaryDto[];
  /** `digest_id` of the last item; `null` when there is no next page. */
  next_cursor: string | null;
};

/** `GET /digests/{digest_id}`: the summary plus run metadata. */
export type DigestDetailDto = DigestSummaryDto & {
  terlambat_menit: number | null;
  dijadwalkan_pada: string | null;
  dijalankan_pada: string | null;
  percobaan: number;
  /** `online`, `lokal`, `replay`, or `templat`. */
  mode_narasi: string | null;
  sha256: string | null;
  versi_templat: string | null;
};

export type DigestListQuery = { limit?: number; cursor?: string };

/** Body of `POST /digests/run` (`PermintaanJalan` in scheduler; unknown fields are rejected upstream). */
export type DigestRunRequest = { jenis: "harian"; alasan?: string };

/** Response of `POST /digests/run`: 202 for a new period, 200 when the period already exists. */
export type DigestRunResultDto = { digest_id: string; status: string; terlambat: boolean };
