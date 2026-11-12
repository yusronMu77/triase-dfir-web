"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type DocumentBlobOptions = {
  /** Cache key. Keep the domain prefix (for example `queryKeys.digests.all`) so SSE invalidation reaches it. */
  queryKey: readonly unknown[];
  fetcher: (signal: AbortSignal) => Promise<Blob>;
  enabled: boolean;
};

/**
 * Loads a raw document (HTML) as a Blob and exposes an object URL for an `<iframe sandbox>` or a download link.
 * The URL is revoked when the document changes or the component unmounts. The HTML is never injected into the DOM.
 */
export function useDocumentBlob({ queryKey, fetcher, enabled }: DocumentBlobOptions) {
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetcher(signal),
    enabled,
    // Published documents do not change in place, so a cached copy is good for the whole session.
    staleTime: Number.POSITIVE_INFINITY,
  });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [query.data]);

  return {
    url,
    loading: enabled && query.isPending && query.fetchStatus === "fetching",
    error: query.error,
    retry: () => void query.refetch(),
  };
}
