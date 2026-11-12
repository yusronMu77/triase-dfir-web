"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { onUnauthorized } from "../http/api-client";
import { createQueryClient } from "./query-client";

/** Where a 401 sends the user. Kept pure so the redirect rule is testable. */
export function signInUrl(pathname: string): string | null {
  return pathname === "/login" ? null : "/login?reason=session-expired";
}

/** One QueryClient per browser tab. A 401 on any call clears cached data and returns to the sign-in page. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  useEffect(() => {
    let redirecting = false;
    onUnauthorized(() => {
      const target = signInUrl(window.location.pathname);
      if (redirecting || !target) return;
      redirecting = true;
      client.clear();
      window.location.assign(target);
    });
    return () => onUnauthorized(null);
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
