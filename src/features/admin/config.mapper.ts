import type {
  JsonValue,
  SecretStatus,
  SettingItem,
  SettingSource,
  SettingValue,
} from "../../services/config.types";

import { formatWaktu } from "./admin-shared";

export type SettingGroup = "configuration" | "settings";

/** Scopes shown on /configuration (model, score, import). Every other non-secret scope goes to /settings. */
export const CONFIGURATION_SCOPES: readonly string[] = ["model", "score", "ingest"];

const SCOPE_LABELS: Readonly<Record<string, string>> = {
  model: "Model narasi",
  score: "Ambang skor",
  ingest: "Impor data",
  schedule: "Jadwal",
  api: "Tautan publik",
  chat: "Perintah chat",
  retention: "Retensi data",
};

export const SOURCE_LABELS: Readonly<Record<SettingSource, string>> = {
  bawaan: "Bawaan",
  berkas: "Berkas",
  database: "Basis data",
  env: "Variabel lingkungan",
};

export type EditKind = "bool" | "number" | "text" | "json";

export type SettingRow = {
  key: string;
  scope: string;
  version: number;
  source: SettingSource;
  sourceLabel: string;
  locked: boolean;
  updatedLabel: string;
  editKind: EditKind;
  /** Text the editor starts with. A draft equal to this text is not a change. */
  draftText: string;
};

export type SettingGroupView = { scope: string; label: string; rows: SettingRow[] };

export type SecretRow = { key: string; filled: boolean; version: number; updatedLabel: string };

export type ConfigRows = { settings: SettingRow[]; secrets: SecretRow[] };

export type ParsedDraft = { ok: true; value: JsonValue } | { ok: false; message: string };

export function scopeOf(key: string): string {
  return key.split(".", 1)[0];
}

export function scopeLabel(scope: string): string {
  return SCOPE_LABELS[scope] ?? `Lainnya (${scope})`;
}

export function isSecretItem(item: SettingItem): item is SecretStatus {
  return "terisi" in item;
}

/** Booleans, numbers and text get their own input. Arrays, objects and null are edited as JSON text. */
export function editKindOf(value: JsonValue): EditKind {
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "text";
  return "json";
}

export function draftTextOf(value: JsonValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return JSON.stringify(value, null, 2);
}

function settingRow(item: SettingValue): SettingRow {
  return {
    key: item.key,
    scope: scopeOf(item.key),
    version: item.version,
    source: item.source,
    sourceLabel: SOURCE_LABELS[item.source],
    locked: item.locked === true,
    updatedLabel: formatWaktu(item.updated_at),
    editKind: editKindOf(item.value),
    draftText: draftTextOf(item.value),
  };
}

/** Splits the api list into the rows of one screen. Secrets appear only on /configuration. */
export function toConfigRows(items: SettingItem[], group: SettingGroup): ConfigRows {
  const settings: SettingRow[] = [];
  const secrets: SecretRow[] = [];
  for (const item of items) {
    if (isSecretItem(item)) {
      if (group === "configuration") {
        secrets.push({
          key: item.key,
          filled: item.terisi,
          version: item.version,
          updatedLabel: formatWaktu(item.updated_at),
        });
      }
      continue;
    }
    const operational = CONFIGURATION_SCOPES.includes(scopeOf(item.key));
    if (operational === (group === "configuration")) settings.push(settingRow(item));
  }
  return { settings, secrets };
}

/** Groups rows by scope in the order the api returned them. */
export function groupByScope(rows: SettingRow[]): SettingGroupView[] {
  const groups = new Map<string, SettingGroupView>();
  for (const row of rows) {
    const group = groups.get(row.scope) ?? { scope: row.scope, label: scopeLabel(row.scope), rows: [] };
    group.rows.push(row);
    groups.set(row.scope, group);
  }
  return [...groups.values()];
}

/** Turns editor text into a typed value. Error messages never echo the typed text. */
export function parseDraft(kind: EditKind, text: string): ParsedDraft {
  switch (kind) {
    case "bool":
      return text === "true" || text === "false"
        ? { ok: true, value: text === "true" }
        : { ok: false, message: "Pilih true atau false." };
    case "number": {
      const trimmed = text.trim();
      const number = Number(trimmed);
      return trimmed !== "" && Number.isFinite(number)
        ? { ok: true, value: number }
        : { ok: false, message: "Isi dengan angka." };
    }
    case "text":
      return { ok: true, value: text };
    case "json":
      try {
        // JSON.parse returns `any`; the api validates the shape against the key's type on save.
        return { ok: true, value: JSON.parse(text) as JsonValue };
      } catch {
        return { ok: false, message: "Format JSON tidak valid." };
      }
  }
}
