"use client";
import { Alert } from "@astria/ui";

/** Shown when the upstream route is not wired yet. It says what is missing, not what the request was. */
export function UnavailableNotice({ title, children }: { title: string; children: string }) {
  return (
    <Alert tone="warning" title={title}>
      {children}
    </Alert>
  );
}
