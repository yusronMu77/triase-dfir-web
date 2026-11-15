"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { documentPreview } from "./document-preview";

export type DocumentBlobOptions = {
  /** Cache key. Keep the domain prefix (for example `queryKeys.digests.all`) so SSE invalidation reaches it. */
  queryKey: readonly unknown[];
  fetcher: (signal: AbortSignal) => Promise<Blob>;
  enabled: boolean;
};

/**
 * Keeps the original HTML download separate from the styled, sandboxed preview.
 * The download URL is revoked on change/unmount. Preview HTML is only passed to an empty-sandbox iframe's srcDoc:
 * WebKit applies the parent's frame-ancestors restriction to blob frames, leaving those previews blank.
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
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<Error | null>(null);

  useEffect(() => {
    setPreviewError(null);
    if (!query.data) {
      setUrl(null);
      setPreviewHtml(null);
      return;
    }
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    setPreviewHtml(null);
    const reader = new FileReader();
    reader.onload = () => {
      const html = documentPreview(
        String(reader.result),
        new URL("/document-preview.css", window.location.origin).href,
      );
      setPreviewHtml(html);
    };
    reader.onerror = () => setPreviewError(new Error("Pratinjau dokumen gagal dibaca. Silakan coba lagi."));
    reader.readAsText(query.data);
    return () => {
      reader.onload = null;
      reader.onerror = null;
      reader.abort();
      URL.revokeObjectURL(objectUrl);
    };
  }, [query.data]);

  return {
    url,
    previewHtml,
    loading: enabled && query.isPending && query.fetchStatus === "fetching",
    error: query.error ?? previewError,
    retry: () => void query.refetch(),
  };
}
