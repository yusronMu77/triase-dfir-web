import { api } from "../lib/http/api-client";
import type {
  PutSecretRequest,
  PutSettingRequest,
  SecretStatus,
  SettingList,
  SettingValue,
} from "./config.types";

const keyPath = (key: string) => encodeURIComponent(key);

export const configService = {
  /** `GET /config`: effective settings with their source, plus secret status (never the value). */
  list: (signal?: AbortSignal) => api.get<SettingList>("/config", undefined, signal),

  /** `PUT /config/{key}`: `if_version` must match the stored version, otherwise the api answers 409. */
  putSetting: (key: string, body: PutSettingRequest) =>
    api.put<SettingValue>(`/config/${keyPath(key)}`, body),

  /**
   * `PUT /config/secrets/{key}`: write-only. The api answers 403 when the session has no recent password
   * confirmation. The request body is the only place the value travels; it is never put in the URL.
   */
  putSecret: (key: string, value: string) =>
    api.put<SecretStatus>(`/config/secrets/${keyPath(key)}`, { value } satisfies PutSecretRequest),
};
