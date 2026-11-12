import { api, apiRequest } from "../lib/http/api-client";
import type { CaseDto, CaseTimelinePage, CaseTimelineQuery } from "./case.types";

const casePath = (id: string) => `/cases/${encodeURIComponent(id)}`;

export const caseService = {
  /** `GET /cases/{case_id}`: status, window, limitations, and the latest report version (or null). */
  get: (id: string, signal?: AbortSignal) => api.get<CaseDto>(casePath(id), undefined, signal),
  /** `GET /cases/{case_id}/timeline`: one page of normalized events, ordered by `item_id`. */
  timeline: (id: string, query: CaseTimelineQuery, signal?: AbortSignal) =>
    api.get<CaseTimelinePage>(`${casePath(id)}/timeline`, { ...query }, signal),
  /** `GET /cases/{case_id}/report?format=html`: raw HTML. Only `html` exists upstream; PDF is not built. */
  report: (id: string, signal?: AbortSignal) =>
    apiRequest<Blob>({ path: `${casePath(id)}/report`, query: { format: "html" }, as: "blob", signal }),
};
