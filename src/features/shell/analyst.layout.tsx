"use client";
import { AppShell, Select, ToastProvider, TopBar } from "@astria/ui";
import type { ReactNode } from "react";
import { isRole, roleOptions } from "../../data/personas";
import { useShellState } from "./use-shell-state.hook";

export function AnalystLayout({ children }: { children: ReactNode }) {
  const shell = useShellState();
  return (
    <ToastProvider>
      <AppShell
        name={shell.persona.name}
        role={shell.role}
        subtitle={shell.persona.subtitle}
        activePath={shell.activePath}
        onNavigate={shell.navigate}
        onSignOut={shell.signOut}
        topbar={
          <TopBar serviceStatus="Data contoh · tanpa koneksi layanan">
            <Select
              aria-label="Peran pratinjau"
              value={shell.role}
              onChange={(event) => isRole(event.target.value) && shell.setRole(event.target.value)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </TopBar>
        }
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
