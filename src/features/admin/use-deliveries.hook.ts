"use client";
import { useToast } from "@astria/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { describeError } from "../../lib/http/api-error";
import { queryKeys } from "../../lib/query/query-keys";
import { outboxService } from "../../services/outbox.service";
import type { OutboxStatus } from "../../services/outbox.types";
import { useSession } from "../session/use-session.hook";
import { isRouteUnavailable } from "./admin-shared";
import { type DeliveryRow, isOutboxStatus, toDeliveryRows } from "./deliveries.mapper";

export type StatusFilter = OutboxStatus | "semua";

/** Delivery log with a status filter and retry for failed messages. */
export function useDeliveries() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { can } = useSession();
  const [status, setStatus] = useState<StatusFilter>("semua");
  const filter = status === "semua" ? undefined : status;

  const query = useQuery({
    queryKey: queryKeys.outbox({ status }),
    queryFn: ({ signal }) => outboxService.list(filter, signal),
  });
  const rows: DeliveryRow[] = useMemo(() => toDeliveryRows(query.data?.items ?? []), [query.data]);

  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<{ id: string; message: string } | null>(null);

  /** Ignores values that are not a known status, so a stray form value never reaches the query. */
  const changeFilter = useCallback((value: string) => {
    if (value === "semua" || isOutboxStatus(value)) setStatus(value);
  }, []);

  const retryDelivery = useCallback(
    async (row: DeliveryRow) => {
      setRetrying(row.id);
      setRetryError(null);
      try {
        await outboxService.retry(row.id);
        await queryClient.invalidateQueries({ queryKey: queryKeys.outbox({ status }) });
        toast({
          title: "Pengiriman dijadwalkan ulang",
          description: `Pesan ke ${row.channel} masuk antrean lagi.`,
        });
      } catch (error) {
        setRetryError({ id: row.id, message: describeError(error) });
      } finally {
        setRetrying(null);
      }
    },
    [queryClient, status, toast],
  );

  return {
    loading: query.isPending,
    error: query.error,
    retry: () => void query.refetch(),
    unavailable: isRouteUnavailable(query.error),
    empty: rows.length === 0,
    rows,
    status,
    changeFilter,
    canRetry: can("channels:admin"),
    retrying,
    retryError,
    retryDelivery,
  };
}
