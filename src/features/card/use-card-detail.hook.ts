"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { cardsService } from "../../services/cards.service";
import { useSession } from "../session/use-session.hook";

/** Detail of one card plus its evidence. Evidence is requested only after the card itself loaded. */
export function useCardDetail(cardId: string) {
  const session = useSession();
  const allowed = session.can("cards:read");
  const detail = useQuery({
    queryKey: queryKeys.cards.detail(cardId),
    queryFn: ({ signal }) => cardsService.detail(cardId, signal),
    enabled: allowed,
  });
  const evidence = useQuery({
    queryKey: queryKeys.cards.evidence(cardId),
    queryFn: ({ signal }) => cardsService.evidence(cardId, signal),
    enabled: allowed && detail.isSuccess,
  });

  return {
    allowed,
    sessionLoading: session.loading,
    sessionError: session.error,
    retrySession: session.retry,
    card: detail.data ?? null,
    loading: session.loading || (allowed && detail.isPending),
    error: detail.data ? null : detail.error,
    retry: () => void detail.refetch(),
    /** Only the actions the signed-in role may use. The server checks them again on every request. */
    permissions: {
      write: session.can("cards:write"),
      deepDive: session.can("cards:deep_dive"),
    },
    evidence: {
      data: evidence.data ?? null,
      loading: allowed && (detail.isPending || (evidence.isPending && evidence.fetchStatus !== "idle")),
      error: evidence.data ? null : (detail.error ?? evidence.error),
      retry: () => void evidence.refetch(),
    },
  };
}
