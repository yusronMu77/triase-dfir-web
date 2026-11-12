import { api } from "../lib/http/api-client";
import type { Health } from "./platform.types";

export const platformService = {
  /** `GET /health`: public, no internal detail. Used for the service-status chip in the top bar. */
  health: (signal?: AbortSignal) => api.get<Health>("/health", undefined, signal),
};
