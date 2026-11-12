"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { queryKeys } from "../../lib/query/query-keys";
import { metricsRange, toMetricsView } from "../../services/metrics.mapper";
import { metricsService } from "../../services/metrics.service";
import { useSession } from "../session/use-session.hook";

export type MetricsDays = 7 | 30;

/** Metrics for the last 7 or 30 days. The range is computed when the request is sent, so a refresh moves it. */
export function useMetrics(initial: MetricsDays = 7) {
  const session = useSession();
  const allowed = session.can("metrics:read");
  const [days, setDays] = useState<MetricsDays>(initial);
  const query = useQuery({
    queryKey: queryKeys.metrics({ days }),
    queryFn: ({ signal }) => metricsService.stats(metricsRange(days, new Date()), signal),
    enabled: allowed,
  });
  const view = useMemo(() => (query.data ? toMetricsView(query.data) : null), [query.data]);

  return {
    allowed,
    days,
    setDays,
    view,
    loading: session.loading || (allowed && query.isPending),
    error: session.error ?? (view ? null : query.error),
    retry: () => {
      if (session.error) session.retry();
      else void query.refetch();
    },
  };
}
