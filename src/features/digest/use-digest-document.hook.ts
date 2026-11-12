"use client";
import { queryKeys } from "../../lib/query/query-keys";
import { digestService } from "../../services/digest.service";
import { useDocumentBlob } from "../shared/use-document-blob.hook";

/** The published digest HTML. Requested only when the digest is `terbit`; the API answers 409 before that. */
export function useDigestDocument(id: string, published: boolean) {
  return useDocumentBlob({
    queryKey: [...queryKeys.digests.all, "document", id],
    fetcher: (signal) => digestService.document(id, signal),
    enabled: published,
  });
}
