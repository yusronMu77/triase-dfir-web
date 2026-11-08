"use client";
import { Logo } from "@astria/ui";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="web-auth" id="main-content">
      <div className="web-auth-body">
        <Logo />
        {children}
      </div>
    </main>
  );
}
