"use client";
import { useToast } from "@astria/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { describeError, isApiError } from "../../lib/http/api-error";
import { queryKeys } from "../../lib/query/query-keys";
import { channelsService } from "../../services/channels.service";
import { useSession } from "../session/use-session.hook";
import { isRouteUnavailable } from "./admin-shared";
import {
  type ChannelRow,
  failedTestOutcome,
  type PolicyDraft,
  policyBody,
  type TestOutcome,
  testOutcome,
  toChannelRows,
  unavailableTestOutcome,
} from "./channels.mapper";

/** Policy edits and connection tests for every channel. Policy writes use the row's version (optimistic lock). */
export function useChannels() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { can } = useSession();
  const query = useQuery({
    queryKey: queryKeys.channels,
    queryFn: ({ signal }) => channelsService.list(signal),
  });

  const rows = useMemo(
    () => toChannelRows(query.data?.kebijakan.items ?? [], query.data?.status ?? null),
    [query.data],
  );
  const missing = query.data?.bagian_tidak_tersedia ?? [];

  const [drafts, setDrafts] = useState<Record<string, PolicyDraft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [policyError, setPolicyError] = useState<{ channelId: string; message: string } | null>(null);
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<TestOutcome | null>(null);

  const draftFor = useCallback(
    (row: ChannelRow): PolicyDraft => drafts[row.channelId] ?? row.saved,
    [drafts],
  );

  /** Patches one field. The base is the current draft, or the saved policy when the row has no draft yet. */
  const setDraft = useCallback((row: ChannelRow, patch: Partial<PolicyDraft>) => {
    setDrafts((current) => ({
      ...current,
      [row.channelId]: { ...(current[row.channelId] ?? row.saved), ...patch },
    }));
    setPolicyError((current) => (current?.channelId === row.channelId ? null : current));
  }, []);

  const savePolicy = useCallback(
    async (row: ChannelRow) => {
      const draft = drafts[row.channelId] ?? row.saved;
      setBusy(row.channelId);
      setPolicyError(null);
      setConflictId(null);
      try {
        await channelsService.putPolicy(row.channelId, policyBody(row.version, draft));
        setDrafts(({ [row.channelId]: _saved, ...rest }) => rest);
        await queryClient.invalidateQueries({ queryKey: queryKeys.channels });
        toast({
          title: `Kebijakan ${row.name} tersimpan`,
          description: "Perubahan tercatat di jejak audit.",
        });
      } catch (error) {
        if (isApiError(error) && error.kind === "conflict") {
          setConflictId(row.channelId);
          setDrafts(({ [row.channelId]: _stale, ...rest }) => rest);
          await queryClient.invalidateQueries({ queryKey: queryKeys.channels });
        }
        setPolicyError({ channelId: row.channelId, message: describeError(error) });
      } finally {
        setBusy(null);
      }
    },
    [drafts, queryClient, toast],
  );

  const testChannel = useCallback(async (channelId: string) => {
    setBusy(channelId);
    setOutcome(null);
    try {
      const result = await channelsService.test(channelId);
      setOutcome(testOutcome(channelId, result));
    } catch (error) {
      setOutcome(
        isRouteUnavailable(error)
          ? unavailableTestOutcome(channelId)
          : failedTestOutcome(channelId, describeError(error)),
      );
    } finally {
      setBusy(null);
    }
  }, []);

  return {
    loading: query.isPending,
    error: query.error,
    retry: () => void query.refetch(),
    empty: rows.length === 0,
    rows,
    missing,
    canAdmin: can("channels:admin"),
    draftFor,
    setDraft,
    savePolicy,
    policyError,
    conflictId,
    testChannel,
    outcome,
    busy,
  };
}
