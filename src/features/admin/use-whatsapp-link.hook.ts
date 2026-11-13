"use client";
import { useToast } from "@astria/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { describeError } from "../../lib/http/api-error";
import { queryKeys } from "../../lib/query/query-keys";
import { channelsService } from "../../services/channels.service";
import { isRouteUnavailable } from "./admin-shared";

/** WhatsApp rotates the QR about every 20 seconds, so an unlinked bot is polled often; a linked one rarely. */
export const POLL_UNLINKED_MS = 5_000;
export const POLL_LINKED_MS = 30_000;

/** Link status of the WhatsApp bot (QR to scan, masked number) and unlinking it, for the channels page. */
export function useWhatsAppLink() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: queryKeys.whatsappLink,
    queryFn: ({ signal }) => channelsService.whatsappLink(signal),
    refetchInterval: (q) => (q.state.data?.terhubung ? POLL_LINKED_MS : POLL_UNLINKED_MS),
    retry: false,
  });
  const [confirming, setConfirming] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  const unlink = useCallback(async () => {
    setUnlinking(true);
    setUnlinkError(null);
    try {
      await channelsService.unlinkWhatsapp();
      setConfirming(false);
      toast({ title: "Tautan bot WhatsApp diputus", description: "Pindai QR baru untuk menautkan lagi." });
      await queryClient.invalidateQueries({ queryKey: queryKeys.whatsappLink });
    } catch (error) {
      setUnlinkError(describeError(error));
    } finally {
      setUnlinking(false);
    }
  }, [queryClient, toast]);

  // 404: the gateway has no WhatsApp bridge configured, so the card is hidden instead of showing an error.
  const unavailable = isRouteUnavailable(query.error);
  return {
    link: query.data ?? null,
    loading: query.isPending && !query.error,
    unavailable,
    error: query.error && !unavailable ? describeError(query.error) : null,
    retry: () => void query.refetch(),
    confirming,
    openConfirm: () => {
      setUnlinkError(null);
      setConfirming(true);
    },
    cancelConfirm: () => setConfirming(false),
    unlinking,
    unlinkError,
    unlink,
  };
}
