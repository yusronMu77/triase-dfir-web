"use client";
import { astriaNavigation } from "@astria/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { logout } from "../../lib/auth-api";
import { queryKeys } from "../../lib/query/query-keys";
import { platformService } from "../../services/platform.service";
import type { Health } from "../../services/platform.types";
import { canOpenRoute, routeSection } from "../session/route-access";
import { useSession } from "../session/use-session.hook";
import { useLiveUpdates } from "./use-live-updates.hook";

/** First path segment, so `/cards/IC-1` highlights `/cards` in the sidebar. */
export const activeSection = routeSection;

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
  const { can } = session;
  // The menu never links to a screen the route guard would refuse.
  const navigation = useMemo(() => astriaNavigation.filter((item) => canOpenRoute(item.href, can)), [can]);
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
    /** True when the session lacks the permission of the current route; the layout then shows the 403 screen. */
    forbidden: !canOpenRoute(pathname, can),
    navigation,
    navigate,
    signOut,
    signOutError,
  };
}
