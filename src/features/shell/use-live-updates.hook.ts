"use client";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_PREFIX, apiBaseUrl, isCrossOriginApi } from "../../lib/env";
import { queryKeys } from "../../lib/query/query-keys";

/** Which cached data each server event makes stale. The payload carries only type, id and status. */
export function invalidateFor(client: QueryClient, type: string) {
  switch (type) {
    case "ticket.updated":
    case "ticket.sla_breached":
      return client.invalidateQueries({ queryKey: queryKeys.cards.all });
    case "job.progress":
      return client.invalidateQueries({ queryKey: ["ingest"] });
    case "digest.published":
      return client.invalidateQueries({ queryKey: queryKeys.digests.all });
    case "resync":
      return client.invalidateQueries();
    default:
      return undefined;
  }
}

const EVENT_TYPES = ["ticket.updated", "ticket.sla_breached", "job.progress", "digest.published", "resync"];

/** Subscribes to `GET /stream` (SSE) and refetches what changed. The browser reconnects by itself and the
 *  server answers a reconnect with `resync`. Screens that poll (ingest job) keep working if SSE is down. */
export function useLiveUpdates(enabled: boolean) {
  const client = useQueryClient();
  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;
    const source = new EventSource(`${apiBaseUrl()}${API_PREFIX}/stream`, {
      withCredentials: isCrossOriginApi(),
    });
    const listeners = EVENT_TYPES.map((type) => {
      const listener = () => void invalidateFor(client, type);
      source.addEventListener(type, listener);
      return [type, listener] as const;
    });
    return () => {
      for (const [type, listener] of listeners) source.removeEventListener(type, listener);
      source.close();
    };
  }, [client, enabled]);
}
