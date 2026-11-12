"use client";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { queryKeys } from "../../lib/query/query-keys";
import { authService } from "../../services/auth.service";
import type { Permission, Role } from "../../services/auth.types";

/** Roles in the order the sidebar picks one when a user holds several (the shell shows one menu). */
export const ROLE_PRIORITY: Role[] = ["admin", "dfir", "analis", "pimpinan"];

export function primaryRole(roles: readonly string[]): Role | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

/** The signed-in user from `GET /auth/me`. The server enforces permissions; `can` only shapes the UI. */
export function useSession() {
  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => authService.me(signal),
    staleTime: 60_000,
  });
  const permissions = useMemo(() => new Set(query.data?.permissions ?? []), [query.data]);
  const can = useCallback((permission: Permission) => permissions.has(permission), [permissions]);
  return {
    user: query.data ?? null,
    role: query.data ? primaryRole(query.data.roles) : null,
    can,
    loading: query.isPending,
    error: query.error,
    retry: () => void query.refetch(),
  };
}
