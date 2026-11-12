import { api } from "../lib/http/api-client";
import type { MetricsRange, TicketStats } from "./metrics.types";

export const metricsService = {
  /** `GET /metrics?dari&sampai`: both bounds are ISO 8601 with a zone (the server rejects naive times). */
  stats: (range: MetricsRange, signal?: AbortSignal) =>
    api.get<TicketStats>("/metrics", { dari: range.dari, sampai: range.sampai }, signal),
};
