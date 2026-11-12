/**
 * Mirrors `contracts/openapi/config-internal.yaml` (SettingValue, SecretStatus, SettingList, PutSettingRequest,
 * PutSecretRequest) as the Astria api proxies them under `/api/v1/config`. Secret values are write-only and
 * are never part of any response type.
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type SettingSource = "bawaan" | "berkas" | "database" | "env";

export type SettingValue = {
  key: string;
  value: JsonValue;
  source: SettingSource;
  /** 0 when the key was never changed in the database. */
  version: number;
  updated_by?: string | null;
  updated_at?: string | null;
  /** True when an environment variable (`ASTRIA_*`) locks the key. */
  locked?: boolean;
};

export type SecretStatus = {
  key: string;
  terisi: boolean;
  version: number;
  updated_by?: string | null;
  updated_at?: string | null;
};

export type SettingItem = SettingValue | SecretStatus;

export type SettingList = { items: SettingItem[] };

export type PutSettingRequest = {
  value: JsonValue;
  if_version: number;
  alasan?: string;
};

export type PutSecretRequest = { value: string };
