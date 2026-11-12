import { api } from "../lib/http/api-client";
import type { OutboxList, OutboxStatus } from "./outbox.types";

export const outboxService = {
  /** `GET /outbox?status=...`: the filter is left out when `status` is undefined (all statuses). */
  list: (status?: OutboxStatus, signal?: AbortSignal) =>
    api.get<OutboxList>("/outbox", status ? { status } : undefined, signal),

  /** `POST /outbox/{outbox_id}/retry`: no body; the response is not read, so an empty 200 is fine. */
  retry: (outboxId: string) =>
    api.post(`/outbox/${encodeURIComponent(outboxId)}/retry`, undefined, { as: "none" }),
};
