"use client";
import { useToast } from "@astria/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { describeError, isApiError } from "../../lib/http/api-error";
import { queryKeys } from "../../lib/query/query-keys";
import { authService } from "../../services/auth.service";
import { configService } from "../../services/config.service";
import { useSession } from "../session/use-session.hook";
import {
  groupByScope,
  parseDraft,
  type SecretRow,
  type SettingGroup,
  type SettingGroupView,
  type SettingRow,
  toConfigRows,
} from "./config.mapper";

/** A text message tied to the key it belongs to, so only that field shows it. */
export type KeyMessage = { key: string; message: string };

/** Shared by /configuration and /settings. Reads the effective settings and writes them with optimistic versions. */
export function useConfigForm(group: SettingGroup) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { can } = useSession();
  const query = useQuery({
    queryKey: queryKeys.config,
    queryFn: ({ signal }) => configService.list(signal),
  });

  const rows = useMemo(() => toConfigRows(query.data?.items ?? [], group), [query.data, group]);
  const groups: SettingGroupView[] = useMemo(() => groupByScope(rows.settings), [rows.settings]);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [settingError, setSettingError] = useState<KeyMessage | null>(null);
  const [conflictKey, setConflictKey] = useState<string | null>(null);

  const [secretBusy, setSecretBusy] = useState<string | null>(null);
  const [secretError, setSecretError] = useState<KeyMessage | null>(null);
  // The pending secret lives in a ref, never in React state, and only until its request (or retry) finishes.
  const pendingSecret = useRef<{ key: string; value: string } | null>(null);
  const [reauth, setReauth] = useState<{ open: boolean; busy: boolean; error: string | null }>({
    open: false,
    busy: false,
    error: null,
  });

  const draftFor = useCallback((row: SettingRow) => drafts[row.key] ?? row.draftText, [drafts]);

  const setDraft = useCallback((key: string, text: string) => {
    setDrafts((current) => ({ ...current, [key]: text }));
    setSettingError((current) => (current?.key === key ? null : current));
  }, []);

  const saveSetting = useCallback(
    async (row: SettingRow) => {
      const parsed = parseDraft(row.editKind, drafts[row.key] ?? row.draftText);
      if (!parsed.ok) {
        setSettingError({ key: row.key, message: parsed.message });
        return;
      }
      setSavingKey(row.key);
      setSettingError(null);
      setConflictKey(null);
      try {
        await configService.putSetting(row.key, { value: parsed.value, if_version: row.version });
        setDrafts(({ [row.key]: _saved, ...rest }) => rest);
        await queryClient.invalidateQueries({ queryKey: queryKeys.config });
        toast({ title: `${row.key} tersimpan`, description: "Perubahan tercatat di jejak audit." });
      } catch (error) {
        if (isApiError(error) && error.kind === "conflict") {
          // Someone else saved first. Drop the stale draft and load the current value instead of overwriting it.
          setConflictKey(row.key);
          setDrafts(({ [row.key]: _stale, ...rest }) => rest);
          await queryClient.invalidateQueries({ queryKey: queryKeys.config });
        }
        setSettingError({ key: row.key, message: describeError(error) });
      } finally {
        setSavingKey(null);
      }
    },
    [drafts, queryClient, toast],
  );

  const runSecret = useCallback(
    async (key: string, value: string) => {
      setSecretBusy(key);
      setSecretError(null);
      try {
        await configService.putSecret(key, value);
        pendingSecret.current = null;
        await queryClient.invalidateQueries({ queryKey: queryKeys.config });
        toast({
          title: `Secret ${key} tersimpan`,
          description: "Nilai tidak ditampilkan lagi setelah disimpan.",
        });
      } catch (error) {
        if (isApiError(error) && error.kind === "forbidden") {
          // The api answers 403 for a stale password confirmation too. Ask once, then retry the same value.
          pendingSecret.current = { key, value };
          setReauth({ open: true, busy: false, error: null });
        } else {
          pendingSecret.current = null;
          setSecretError({ key, message: describeError(error) });
        }
      } finally {
        setSecretBusy(null);
      }
    },
    [queryClient, toast],
  );

  /** Called by the secret form. The value is read from FormData and never stored in state. */
  const saveSecret = useCallback(
    async (key: string, form: FormData) => {
      const value = String(form.get("value") ?? "");
      if (value.trim() === "") {
        setSecretError({ key, message: "Isi nilai secret dulu." });
        return;
      }
      if (value.length > 4096) {
        setSecretError({ key, message: "Nilai secret terlalu panjang (maksimal 4096 karakter)." });
        return;
      }
      await runSecret(key, value);
    },
    [runSecret],
  );

  const submitReauth = useCallback(
    async (password: string) => {
      setReauth((current) => ({ ...current, busy: true, error: null }));
      try {
        await authService.reauth(password);
      } catch (error) {
        const wrong = isApiError(error) && error.kind === "unauthenticated";
        setReauth({ open: true, busy: false, error: wrong ? "Kata sandi salah." : describeError(error) });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      const pending = pendingSecret.current;
      pendingSecret.current = null;
      setReauth({ open: false, busy: false, error: null });
      if (!pending) return;
      // One retry only. A second 403 means the account is not allowed, so it is shown as an error, not asked again.
      setSecretBusy(pending.key);
      try {
        await configService.putSecret(pending.key, pending.value);
        await queryClient.invalidateQueries({ queryKey: queryKeys.config });
        toast({
          title: `Secret ${pending.key} tersimpan`,
          description: "Nilai tidak ditampilkan lagi setelah disimpan.",
        });
      } catch (error) {
        setSecretError({ key: pending.key, message: describeError(error) });
      } finally {
        setSecretBusy(null);
      }
    },
    [queryClient, toast],
  );

  const cancelReauth = useCallback(() => {
    pendingSecret.current = null;
    setReauth({ open: false, busy: false, error: null });
  }, []);

  const secrets: SecretRow[] = rows.secrets;
  return {
    loading: query.isPending,
    error: query.error,
    retry: () => void query.refetch(),
    empty: groups.length === 0 && secrets.length === 0,
    groups,
    secrets,
    canEdit: can("config:write"),
    canSecrets: can("secrets:write"),
    draftFor,
    setDraft,
    saveSetting,
    savingKey,
    settingError,
    conflictKey,
    saveSecret,
    secretBusy,
    secretError,
    reauth: { ...reauth, submit: submitReauth, cancel: cancelReauth },
  };
}

export type ConfigFormModel = ReturnType<typeof useConfigForm>;
