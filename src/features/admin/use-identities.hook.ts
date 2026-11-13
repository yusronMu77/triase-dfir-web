"use client";
import { useToast } from "@astria/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { describeError } from "../../lib/http/api-error";
import { queryKeys } from "../../lib/query/query-keys";
import { identitiesService } from "../../services/identities.service";
import { useSession } from "../session/use-session.hook";
import { isRouteUnavailable } from "./admin-shared";
import { type IdentityRow, toIdentityRows } from "./identities.mapper";

/** Channel bindings: list, and revoke after a confirmation. Admins see all bindings, other roles only their own. */
export function useIdentities() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, can } = useSession();
  const canManageAll = can("identities:admin");
  const query = useQuery({
    queryKey: queryKeys.identities,
    queryFn: ({ signal }) => identitiesService.list(signal),
  });
  const rows: IdentityRow[] = useMemo(
    () => toIdentityRows(query.data?.items ?? [], { userId: user?.user_id ?? null, canManageAll }),
    [query.data, user, canManageAll],
  );

  const [target, setTarget] = useState<IdentityRow | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const requestRevoke = useCallback((row: IdentityRow) => {
    setRevokeError(null);
    setTarget(row);
  }, []);

  const cancelRevoke = useCallback(() => {
    if (!revoking) setTarget(null);
  }, [revoking]);

  const confirmRevoke = useCallback(async () => {
    if (!target) return;
    setRevoking(true);
    setRevokeError(null);
    try {
      await identitiesService.revoke(target.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.identities });
      toast({
        title: "Akun diputus dari kanal",
        description: `Notifikasi ke ${target.channelName} dihentikan.`,
      });
      setTarget(null);
    } catch (error) {
      setRevokeError(describeError(error));
    } finally {
      setRevoking(false);
    }
  }, [queryClient, target, toast]);

  return {
    loading: query.isPending,
    error: query.error,
    retry: () => void query.refetch(),
    unavailable: isRouteUnavailable(query.error),
    empty: rows.length === 0,
    rows,
    target,
    requestRevoke,
    cancelRevoke,
    confirmRevoke,
    revoking,
    revokeError,
  };
}
