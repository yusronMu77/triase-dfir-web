"use client";
import { Alert, AppShell, Badge, InlineLoading, roleLabels, ToastProvider, TopBar } from "@astria/ui";
import type { ReactNode } from "react";
import { ErrorPanel, ForbiddenPanel } from "../shared/query-boundary.view";
import { useShellState } from "./use-shell-state.hook";

export function AnalystLayout({ children }: { children: ReactNode }) {
  const shell = useShellState();
  const { session } = shell;
  if (session.loading) {
    return (
      <main className="web-auth-body" id="main-content" aria-busy="true">
        <InlineLoading>Memuat sesi…</InlineLoading>
      </main>
    );
  }
  if (session.error || !session.user) {
    return (
      <main className="web-auth-body" id="main-content">
        <ErrorPanel error={session.error} onRetry={session.retry} />
      </main>
    );
  }
  if (!session.role) {
    return (
      <main className="web-auth-body" id="main-content">
        <Alert tone="danger" title="Peran tidak dikenal">
          Akun ini tidak punya peran yang dikenali Astria. Hubungi administrator.
        </Alert>
      </main>
    );
  }
  return (
    <ToastProvider>
      <AppShell
        name={session.user.user_id}
        role={session.role}
        subtitle={roleLabels[session.role]}
        activePath={shell.activePath}
        items={shell.navigation}
        onNavigate={shell.navigate}
        onSignOut={shell.signOut}
        topbar={
          <TopBar serviceStatus="">
            <Badge tone={shell.status.tone}>
              <span className="a-dot" />
              {shell.status.label}
            </Badge>
          </TopBar>
        }
      >
        {shell.signOutError && (
          <Alert tone="danger" title="Gagal keluar">
            {shell.signOutError}
          </Alert>
        )}
        {shell.forbidden ? <ForbiddenPanel /> : children}
      </AppShell>
    </ToastProvider>
  );
}
