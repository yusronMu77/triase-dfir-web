import { api, apiRequest } from "../lib/http/api-client";
import type {
  DigestDetailDto,
  DigestListQuery,
  DigestPageDto,
  DigestRunRequest,
  DigestRunResultDto,
} from "./digest.types";

const digestPath = (id: string) => `/digests/${encodeURIComponent(id)}`;

export const digestService = {
  /** `GET /digests`: newest first, cursor-paginated. */
  list: (query: DigestListQuery, signal?: AbortSignal) =>
    api.get<DigestPageDto>("/digests", { ...query }, signal),
  /** `GET /digests/{digest_id}`. */
  get: (id: string, signal?: AbortSignal) => api.get<DigestDetailDto>(digestPath(id), undefined, signal),
  /** `GET /digests/{digest_id}/document?format=html`: raw HTML of a published digest (409 before `terbit`). */
  document: (id: string, signal?: AbortSignal) =>
    apiRequest<Blob>({ path: `${digestPath(id)}/document`, query: { format: "html" }, as: "blob", signal }),
  /** `POST /digests/run` (admin). */
  run: (body: DigestRunRequest) => api.post<DigestRunResultDto>("/digests/run", body),
};
