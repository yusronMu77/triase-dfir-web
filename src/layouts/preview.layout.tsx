"use client";
import { AppShell, Badge, type NavigationItem, ToastProvider, TopBar } from "@astria/ui";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

const items: NavigationItem[] = [
  { label: "Pustaka komponen", href: "/components", icon: "layout-dashboard", roles: ["analis"] },
  { label: "Antrean", href: "/cards", icon: "inbox", roles: ["analis"], count: 8 },
];
export function PreviewLayout({
  children,
  activePath = "/components",
}: {
  children: ReactNode;
  activePath?: string;
}) {
  const router = useRouter();
  return (
    <ToastProvider>
      {/* biome-ignore lint/a11y/useValidAriaRole: AppShell role is a typed Astria persona, not a DOM role. */}
      <AppShell
        name="Rizky Aditya"
        role="analis"
        subtitle="Analis L1 · Pratinjau"
        items={items}
        activePath={activePath}
        onNavigate={(href) => router.push(href)}
        topbar={
          <TopBar serviceStatus="Pratinjau komponen">
            <Badge>Data contoh</Badge>
          </TopBar>
        }
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
