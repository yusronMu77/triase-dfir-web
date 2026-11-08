"use client";
import type { Role } from "@astria/ui";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { isRole, personas } from "../../data/personas";

const STORAGE_KEY = "astria-preview-role";

/** First path segment, so `/cards/IC-1` highlights `/cards` in the sidebar. */
export function activeSection(pathname: string) {
  const [first] = pathname.split("/").filter(Boolean);
  return first ? `/${first}` : "/";
}

/** Preview role and navigation. Real session and role enforcement belong to the identity service. */
export function useShellState() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRoleState] = useState<Role>("analis");
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored && isRole(stored)) setRoleState(stored);
    } catch {
      // Storage can be blocked; the default role still works.
    }
  }, []);
  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore blocked storage.
    }
  }, []);
  const navigate = useCallback((href: string) => router.push(href), [router]);
  const signOut = useCallback(() => router.push("/login"), [router]);
  return { role, setRole, persona: personas[role], activePath: activeSection(pathname), navigate, signOut };
}
