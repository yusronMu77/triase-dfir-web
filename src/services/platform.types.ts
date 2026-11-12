/** Mirrors HealthResponse in `api/openapi/api-v1.json`; the SSE payload is `{type, id, status}` only. */
export type Health = {
  status: string;
  layanan: Record<string, string>;
  audit_tertunda: number;
};

export type StreamEventType = "ticket.updated" | "ticket.sla_breached" | "job.progress" | "digest.published";
export type StreamEvent = { type: StreamEventType; id: string; status?: string };
