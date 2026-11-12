"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { logout } from "../../lib/auth-api";
import { queryKeys } from "../../lib/query/query-keys";
import { platformService } from "../../services/platform.service";
import type { Health } from "../../services/platform.types";
import { useSession } from "../session/use-session.hook";
import { useLiveUpdates } from "./use-live-updates.hook";

/** First path segment, so `/cards/IC-1` highlights `/cards` in the sidebar. */
export function activeSection(pathname: string) {
  const [first] = pathname.split("/").filter(Boolean);
  return first ? `/${first}` : "/";
}

/** Text and tone of the service chip from `GET /health` (`hijau`, `kuning`, `merah` per service). */
export function describeHealth(health: Health | undefined, failed: boolean) {
  if (failed) return { label: "Layanan tidak terjangkau", tone: "danger" as const };
  if (!health) return { label: "Memeriksa layanan…", tone: "info" as const };
  if (health.status === "hijau") return { label: "Semua layanan normal", tone: "success" as const };
  if (health.status === "merah") return { label: "Layanan terganggu", tone: "danger" as const };
  return { label: "Sebagian layanan terganggu", tone: "warning" as const };
}

/** Session, navigation, sign-out and service status. Roles come from the server; the UI never picks one. */
export function useShellState() {
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const session = useSession();
  const health = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => platformService.health(signal),
    refetchInterval: 60_000,
    retry: false,
    enabled: !!session.user,
  });
  useLiveUpdates(!!session.user);
  const [signOutError, setSignOutError] = useState("");
  const signingOut = useRef(false);
  const navigate = useCallback((href: string) => router.push(href), [router]);
  const signOut = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    setSignOutError("");
    try {
      await logout();
      client.removeQueries({ queryKey: queryKeys.session });
      client.clear();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Gagal keluar. Silakan coba lagi.");
      signingOut.current = false;
    }
  }, [router, client]);
  return {
    session,
    status: describeHealth(health.data, health.isError),
    activePath: activeSection(pathname),
    navigate,
    signOut,
    signOutError,
  };
}
