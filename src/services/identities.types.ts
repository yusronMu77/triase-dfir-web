/**
 * Channel identities. `GET /identities` is not in any contract yet. The fields follow the gateway
 * `channel_identity` table (`store.py`) and the api code, which reads `id` and `user_id` from each item.
 * `external_id` (the chat handle) is deliberately not part of the type: the UI never shows it.
 */
export type IdentityStatus = "aktif" | "dicabut";

export type IdentityItem = {
  id: string;
  user_id: string;
  channel_id: string;
  status: IdentityStatus;
  updated_at?: string | null;
};

export type IdentityList = { items: IdentityItem[] };

/** Mirrors `contracts/openapi/identity-internal.yaml` (PairingCodeRequest, PairingCode). */
export type PairingCodeRequest = { channel?: string };

export type PairingCode = {
  /** 8 Crockford base32 characters. Shown once; only its hash is stored by identity. */
  code: string;
  channel?: string | null;
  expires_at: string;
};
