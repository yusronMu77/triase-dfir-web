"use client";
import { Alert, Button, EmptyState, SkeletonCard, SkeletonText } from "@astria/ui";
import type { ReactNode } from "react";
import { describeError, isApiError } from "../../lib/http/api-error";

export type QueryBoundaryProps = {
  /** True only while there is no data yet. Background refetches keep showing the last data. */
  loading: boolean;
  error: unknown;
  /** True when the request succeeded but returned nothing to show. */
  empty?: boolean;
  onRetry: () => void;
  /** Overrides the default empty state. */
  emptyState?: ReactNode;
  /** `rows` suits tables and lists, `cards` suits detail pages. */
  skeleton?: "rows" | "cards";
  children: ReactNode;
};

/** The four states of every data screen: loading, error with retry, empty, and success (children). */
export function QueryBoundary({
  loading,
  error,
  empty = false,
  onRetry,
  emptyState,
  skeleton = "rows",
  children,
}: QueryBoundaryProps) {
  if (loading) {
    return (
      <div role="status" aria-busy="true" aria-label="Memuat data">
        {skeleton === "rows"
          ? [0, 1, 2, 3].map((n) => <SkeletonText key={n} />)
          : [0, 1].map((n) => <SkeletonCard key={n} />)}
      </div>
    );
  }
  if (error) return <ErrorPanel error={error} onRetry={onRetry} />;
  if (empty) {
    return (
      emptyState ?? (
        <EmptyState title="Belum ada data" description="Data akan muncul di sini setelah tersedia." />
      )
    );
  }
  return <>{children}</>;
}

/** Error banner with a retry button. 403 and 404 say what happened; retrying them would not help. */
export function ErrorPanel({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const kind = isApiError(error) ? error.kind : "client";
  const title =
    kind === "forbidden"
      ? "Akses ditolak"
      : kind === "not-found"
        ? "Data tidak ditemukan"
        : kind === "unavailable" || kind === "server" || kind === "network" || kind === "timeout"
          ? "Layanan belum dapat dijangkau"
          : "Data gagal dimuat";
  const canRetry = onRetry && kind !== "forbidden" && kind !== "not-found";
  return (
    <Alert
      tone="danger"
      title={title}
      action={
        canRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Coba lagi
          </Button>
        ) : undefined
      }
    >
      {describeError(error)}
      {isApiError(error) && error.traceId ? ` (ID jejak: ${error.traceId})` : ""}
    </Alert>
  );
}

/** The 403 screen of a route the session may not open. Same title as an api 403 in `ErrorPanel`. */
export function ForbiddenPanel() {
  return (
    <Alert tone="danger" title="Akses ditolak">
      Peran Anda tidak memiliki akses ke halaman ini.
    </Alert>
  );
}
