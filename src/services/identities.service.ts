import { api } from "../lib/http/api-client";
import type { IdentityList, PairingCode, PairingCodeRequest } from "./identities.types";

export const identitiesService = {
  /** `GET /identities`: all bindings for admins, only the caller's own bindings for other roles. */
  list: (signal?: AbortSignal) => api.get<IdentityList>("/identities", undefined, signal),

  /** `DELETE /identities/{identity_id}`: 204. Another user's binding answers 404 (no existence leak). */
  revoke: (identityId: string) => api.delete(`/identities/${encodeURIComponent(identityId)}`),

  /**
   * `POST /identities/pairing-codes`: the api requires a JSON body, so `{}` is sent when no channel is chosen.
   */
  issuePairingCode: (body: PairingCodeRequest) => api.post<PairingCode>("/identities/pairing-codes", body),
};
