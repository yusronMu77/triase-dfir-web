import { describe, expect, it } from "vitest";
import type { OutboxMessage } from "../../services/outbox.types";
import { isOutboxStatus, STATUS_FILTER_OPTIONS, toDeliveryRows } from "./deliveries.mapper";

const message = (overrides: Partial<OutboxMessage>): OutboxMessage => ({
  message_id: "msg_1",
  channel_id: "telegram",
  subject: "Alert kritis",
  status: "sent",
  attempts: 1,
  updated_at: "2026-11-12T03:00:00Z",
  ...overrides,
});

describe("toDeliveryRows", () => {
  it("maps status to a label and tone, and only failed messages can be retried", () => {
    const rows = toDeliveryRows([
      message({ message_id: "a", status: "sent" }),
      message({ message_id: "b", status: "dead", last_error: "timeout" }),
      message({ message_id: "c", status: "pending", channel_id: "email" }),
    ]);
    expect(rows.map((row) => [row.id, row.statusLabel, row.tone, row.retryable])).toEqual([
      ["a", "Terkirim", "success", false],
      ["b", "Gagal", "danger", true],
      ["c", "Menunggu", "neutral", false],
    ]);
    expect(rows[2].channel).toBe("Surel");
    expect(rows[1].lastError).toBe("timeout");
    expect(rows[0].lastError).toBeNull();
  });

  it("formats the time in WIB", () => {
    const [row] = toDeliveryRows([message({ updated_at: "2026-11-12T03:00:00Z" })]);
    expect(row.updatedLabel).toMatch(/2026/);
    expect(row.updatedLabel).toMatch(/10[.:]00/);
  });
});

describe("status filter", () => {
  it("accepts only known statuses", () => {
    expect(isOutboxStatus("dead")).toBe(true);
    expect(isOutboxStatus("semua")).toBe(false);
    expect(isOutboxStatus("'; drop")).toBe(false);
  });

  it("starts with an all-statuses option", () => {
    expect(STATUS_FILTER_OPTIONS[0]).toEqual({ value: "semua", label: "Semua status" });
    expect(STATUS_FILTER_OPTIONS).toHaveLength(5);
  });
});
