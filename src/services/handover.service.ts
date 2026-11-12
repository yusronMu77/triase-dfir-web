import { api } from "../lib/http/api-client";
import type { HandoverDraftDto, HandoverRequest } from "./handover.types";

export const handoverService = {
  /** `GET /handover/current`: draft for the running shift. */
  current: (signal?: AbortSignal) => api.get<HandoverDraftDto>("/handover/current", undefined, signal),
  /** `POST /handover` answers 201; the body is not read, so `as: "none"` avoids a parse failure on an empty body. */
  save: (body: HandoverRequest) => api.post<void>("/handover", body, { as: "none" }),
};
