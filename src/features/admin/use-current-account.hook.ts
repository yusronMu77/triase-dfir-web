"use client";
import { useMemo } from "react";
import { useSession } from "../session/use-session.hook";
import { type AccountView, toAccountView } from "./account.mapper";

/** The signed-in account for the users screen. Account management itself is not in the api yet. */
export function useCurrentAccount() {
  const { user, loading, error, retry } = useSession();
  const account: AccountView | null = useMemo(() => (user ? toAccountView(user) : null), [user]);
  return { loading, error, retry, account };
}
