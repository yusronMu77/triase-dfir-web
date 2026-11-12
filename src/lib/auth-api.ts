/** Same-origin API: the backend owns the HttpOnly session cookie. Never store tokens in JavaScript. */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type LoginResponse = {
  user: { user_id: string; username?: string | null; roles: string[]; permissions: string[] };
  expires_at?: string | null;
  idle_expires_at?: string | null;
};

function statusMessage(response: Response): string {
  switch (response.status) {
    case 400:
    case 422:
      return "Periksa nama pengguna dan kata sandi Anda.";
    case 401:
      return "Nama pengguna atau kata sandi salah.";
    case 403:
      return "Permintaan masuk ditolak. Muat ulang halaman dan coba lagi.";
    case 429:
      return "Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.";
    default:
      return response.status >= 500 || response.status === 404
        ? "Layanan identitas belum tersedia. Coba lagi nanti."
        : "Permintaan gagal. Silakan coba lagi.";
  }
}

async function authRequest<T>(
  action: "login" | "logout",
  body: Record<string, string> | undefined,
  read: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`/api/v1/auth/${action}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined,
    });
    // An expired session is already signed out; all other errors must remain visible.
    if (!response.ok && !(action === "logout" && response.status === 401)) {
      throw new AuthError(statusMessage(response), response.status);
    }
    return await read(response);
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(
      controller.signal.aborted
        ? "Permintaan terlalu lama. Silakan coba lagi."
        : "Tidak dapat menghubungi layanan. Periksa koneksi Anda dan coba lagi.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

const stringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export function login(username: string, password: string): Promise<LoginResponse> {
  return authRequest("login", { username, password }, async (response) => {
    const data = await response.json().catch(() => null);
    if (
      !data ||
      typeof data.user?.user_id !== "string" ||
      !data.user.user_id ||
      !stringList(data.user.roles) ||
      !stringList(data.user.permissions)
    ) {
      throw new AuthError("Respons layanan tidak valid. Silakan coba lagi.");
    }
    return data as LoginResponse;
  });
}

export function logout(): Promise<void> {
  return authRequest("logout", undefined, async () => {});
}
