/** Mirrors `api/openapi/api-v1.json`: MeResponse, ReauthRequest. Permission strings come from `api` `Perm`. */
export type Role = "analis" | "dfir" | "pimpinan" | "admin";

export type Permission =
  | "session"
  | "stream:read"
  | "ingest:read"
  | "ingest:write"
  | "cards:read"
  | "cards:write"
  | "cards:deep_dive"
  | "cases:read"
  | "digests:read"
  | "digests:run"
  | "handover"
  | "audit:read"
  | "audit:verify"
  | "metrics:read"
  | "config:read"
  | "config:write"
  | "secrets:write"
  | "channels:admin"
  | "identities:admin"
  | "identities:own"
  | "device_scans";

export type Me = {
  user_id: string;
  roles: string[];
  permissions: string[];
  reauth_at?: string | null;
};

export type ReauthResult = { reauth_at?: string | null };
