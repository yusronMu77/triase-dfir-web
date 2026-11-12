import { api } from "../lib/http/api-client";
import type { Me, ReauthResult } from "./auth.types";

/** Login and logout live in `lib/auth-api.ts` (they handle 401 themselves). */
export const authService = {
  /** `GET /auth/me`: also the session probe; a 401 sends the browser to `/login`. */
  me: (signal?: AbortSignal) => api.get<Me>("/auth/me", undefined, signal),
  /** `POST /auth/reauth`: sensitive actions (secrets) need a password confirmed in the last 5 minutes. */
  reauth: (password: string) =>
    api.post<ReauthResult>("/auth/reauth", { password }, { handleUnauthorized: false }),
};
