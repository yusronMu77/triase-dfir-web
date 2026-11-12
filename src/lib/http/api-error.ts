/** Error body of the Astria api: `{ "error": { code, message, trace_id } }`. */
export type ApiErrorBody = { error?: { code?: unknown; message?: unknown; trace_id?: unknown } };

export type ApiErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "validation"
  | "rate-limited"
  | "unavailable"
  | "server"
  | "network"
  | "timeout"
  | "invalid-response"
  | "client";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  constructor(
    message: string,
    readonly status: number | undefined,
    readonly code: string | undefined,
    readonly traceId?: string,
    readonly retryAfterSeconds?: number,
    /** Extra fields of the error body, for example `row_version` on a 409 conflict. */
    readonly extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kindOf(status, code);
  }
  /** Reads retry only on these; a 4xx will not change by asking again. */
  get retryable(): boolean {
    return (
      this.kind === "network" ||
      this.kind === "timeout" ||
      this.kind === "unavailable" ||
      this.kind === "server"
    );
  }
}

function kindOf(status: number | undefined, code: string | undefined): ApiErrorKind {
  if (code === "NETWORK") return "network";
  if (code === "TIMEOUT") return "timeout";
  if (code === "RESPON_TIDAK_VALID") return "invalid-response";
  switch (status) {
    case undefined:
      return "client";
    case 401:
      return "unauthenticated";
    case 403:
      return "forbidden";
    case 404:
      return "not-found";
    case 409:
      return "conflict";
    case 400:
    case 422:
      return "validation";
    case 429:
      return "rate-limited";
    case 502:
    case 503:
    case 504:
      return "unavailable";
    default:
      return status >= 500 ? "server" : "client";
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;

/** Safe Indonesian text for the UI. A server message is shown only for 4xx validation errors the user can act on. */
export function describeError(error: unknown): string {
  if (!isApiError(error)) return "Terjadi kesalahan tak terduga. Silakan coba lagi.";
  switch (error.kind) {
    case "unauthenticated":
      return "Sesi Anda berakhir. Masuk kembali untuk melanjutkan.";
    case "forbidden":
      return "Peran Anda tidak diizinkan melakukan aksi ini.";
    case "not-found":
      return "Data tidak ditemukan. Mungkin sudah dihapus atau dipindahkan.";
    case "conflict":
      return "Data sudah diubah pihak lain. Muat ulang lalu coba lagi.";
    case "validation":
      return error.message || "Isian tidak valid. Periksa lalu coba lagi.";
    case "rate-limited":
      return error.retryAfterSeconds
        ? `Terlalu banyak permintaan. Coba lagi dalam ${error.retryAfterSeconds} detik.`
        : "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.";
    case "unavailable":
      return "Layanan sedang tidak tersedia. Coba lagi beberapa saat lagi.";
    case "server":
      return "Terjadi gangguan di server. Coba lagi nanti.";
    case "network":
      return "Tidak dapat menghubungi layanan. Periksa koneksi Anda.";
    case "timeout":
      return "Permintaan terlalu lama. Silakan coba lagi.";
    case "invalid-response":
      return "Respons layanan tidak dapat dibaca. Silakan coba lagi.";
    default:
      return error.message || "Permintaan gagal. Silakan coba lagi.";
  }
}
