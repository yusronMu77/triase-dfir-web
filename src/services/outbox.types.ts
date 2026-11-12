/**
 * Delivery log. The fields follow the gateway `outbox_message` table (`gateway/src/astria_gateway/store.py`),
 * because `gateway-internal.yaml` does not define the outbox list yet. The gateway also has no
 * `/internal/v1/outbox` route, so the api answers 404 today and the UI shows an "unavailable" notice.
 */
export type OutboxStatus = "pending" | "sending" | "sent" | "dead";

export type OutboxMessage = {
  /** Identifier of the row (`message_id`). The retry route calls it `outbox_id`. */
  message_id: string;
  channel_id: string;
  subject: string;
  status: OutboxStatus;
  attempts: number;
  last_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  next_attempt_at?: string | null;
};

export type OutboxList = { items: OutboxMessage[] };
