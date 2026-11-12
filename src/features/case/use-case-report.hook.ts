"use client";
import { useState } from "react";
import { queryKeys } from "../../lib/query/query-keys";
import { caseService } from "../../services/case.service";
import { useDocumentBlob } from "../shared/use-document-blob.hook";
import { isCaseId } from "./case.mapper";

/**
 * The case report (HTML). It is fetched only after the analyst asks for it, because the document is large
 * and most visits do not need it.
 */
export function useCaseReport(id: string) {
  const [requested, setRequested] = useState(false);
  const document = useDocumentBlob({
    queryKey: [...queryKeys.cases.all, "report", id],
    fetcher: (signal) => caseService.report(id, signal),
    enabled: requested && isCaseId(id),
  });
  return { ...document, requested, request: () => setRequested(true) };
}
