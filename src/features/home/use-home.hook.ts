"use client";
import type { QueueItem } from "@astria/ui";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/query-keys";
import { toQueueItem } from "../../services/cards.mapper";
import { cardsService } from "../../services/cards.service";
import { metricsRange, toMetricsView } from "../../services/metrics.mapper";
import { metricsService } from "../../services/metrics.service";
import { useSession } from "../session/use-session.hook";

const HOME_CARDS = 4;

/**
 * Data for the home screen: the newest cards and a 7-day metrics summary. Each part is requested only when the
 * signed-in role has its permission, so a role without access (for example pimpinan) never triggers a 403.
 */
export function useHome() {
  const session = useSession();
  const canCards = session.can("cards:read");
  const canMetrics = session.can("metrics:read");

  const cards = useQuery({
    queryKey: queryKeys.cards.list({ limit: HOME_CARDS }),
    queryFn: ({ signal }) => cardsService.list({ limit: HOME_CARDS }, signal),
    enabled: canCards,
  });
  const metrics = useQuery({
    queryKey: queryKeys.metrics({ days: 7 }),
    queryFn: ({ signal }) => metricsService.stats(metricsRange(7, new Date()), signal),
    enabled: canMetrics,
  });

  const items: QueueItem[] = cards.data ? cards.data.items.map((card) => toQueueItem(card, Date.now())) : [];

  return {
    sessionLoading: session.loading,
    sessionError: session.error,
    retrySession: session.retry,
    cards: {
      allowed: canCards,
      loading: session.loading || (canCards && cards.isPending),
      error: cards.data ? null : cards.error,
      items,
      retry: () => void cards.refetch(),
    },
    metrics: {
      allowed: canMetrics,
      loading: session.loading || (canMetrics && metrics.isPending),
      error: metrics.data ? null : metrics.error,
      view: metrics.data ? toMetricsView(metrics.data) : null,
      retry: () => void metrics.refetch(),
    },
  };
}
