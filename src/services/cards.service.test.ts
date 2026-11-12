import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/http/api-error";
import { cardsService, newIdempotencyKey, toCardQuery } from "./cards.service";

const fetchMock = vi.fn<typeof fetch>();
const json = (body: unknown, status = 200) => Response.json(body, { status });
const problem = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) =>
  json({ error: { code, message, trace_id: "trace-1", ...extra } }, status);

/** The URL and init of the last call, with headers normalized to a `Headers` object. */
function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1) ?? [];
  return { url: String(url), init: init as RequestInit, headers: new Headers(init?.headers) };
}

describe("cards service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  describe("list", () => {
    it("sends the filters under the public names and drops empty ones", async () => {
      fetchMock.mockResolvedValue(json({ items: [], next_cursor: null }));
      await cardsService.list({
        status: "diselidiki",
        band: "KRITIS",
        prioritas: "P1",
        pemilik: "  analis01 ",
        host: "",
        cursor: "abc",
        limit: 50,
      });
      const { url, init } = lastCall();
      const parsed = new URL(url, "http://localhost");
      expect(parsed.pathname).toBe("/api/v1/cards");
      expect(Object.fromEntries(parsed.searchParams)).toEqual({
        status: "diselidiki",
        band: "KRITIS",
        prioritas: "P1",
        pemilik: "analis01",
        cursor: "abc",
        limit: "50",
      });
      expect(init.method).toBe("GET");
      expect(init.credentials).toBe("same-origin");
    });

    it("returns the page with its next cursor", async () => {
      fetchMock.mockResolvedValue(json({ items: [{ card_id: "IC-1" }], next_cursor: "next" }));
      await expect(cardsService.list({})).resolves.toEqual({
        items: [{ card_id: "IC-1" }],
        next_cursor: "next",
      });
    });

    it("drops the dates when they are not set", () => {
      expect(toCardQuery({ dari: undefined, sampai: undefined })).toEqual({
        status: undefined,
        band: undefined,
        prioritas: undefined,
        pemilik: undefined,
        host: undefined,
        dari: undefined,
        sampai: undefined,
        cursor: undefined,
        limit: undefined,
      });
    });
  });

  describe("detail and evidence", () => {
    it("encodes the card id in the path", async () => {
      fetchMock.mockResolvedValue(json({ card_id: "IC-1" }));
      await cardsService.detail("IC 1/x");
      expect(lastCall().url).toBe("/api/v1/cards/IC%201%2Fx");
    });

    it("reads the evidence of a card", async () => {
      fetchMock.mockResolvedValue(json({ card_id: "IC-1", evidence: [], tidak_ditemukan: ["EV-a-1"] }));
      await expect(cardsService.evidence("IC-1")).resolves.toEqual({
        card_id: "IC-1",
        evidence: [],
        tidak_ditemukan: ["EV-a-1"],
      });
      expect(lastCall().url).toBe("/api/v1/cards/IC-1/evidence");
    });

    it("reads the explanation of an alert", async () => {
      fetchMock.mockResolvedValue(json({ alert_id: "AL-1", rule_id: null, penjelas: null }));
      await cardsService.alertExplain("AL-1");
      expect(lastCall().url).toBe("/api/v1/alerts/AL-1/explain");
    });
  });

  describe("writes", () => {
    it("sends the PATCH body as JSON, including an explicit null owner", async () => {
      fetchMock.mockResolvedValue(json({ card_id: "IC-1", row_version: 4 }));
      await cardsService.update("IC-1", { if_row_version: 3, pemilik: null });
      const { url, init, headers } = lastCall();
      expect(url).toBe("/api/v1/cards/IC-1");
      expect(init.method).toBe("PATCH");
      expect(headers.get("Content-Type")).toBe("application/json");
      expect(JSON.parse(String(init.body))).toEqual({ if_row_version: 3, pemilik: null });
    });

    it("sends the Idempotency-Key with a comment", async () => {
      fetchMock.mockResolvedValue(json({ id: 9, jenis: "comment" }, 201));
      await cardsService.addEvent("IC-1", { tipe: "comment", isi: "Cek sesi" }, "key-1");
      const { url, init, headers } = lastCall();
      expect(url).toBe("/api/v1/cards/IC-1/events");
      expect(init.method).toBe("POST");
      expect(headers.get("Idempotency-Key")).toBe("key-1");
      expect(JSON.parse(String(init.body))).toEqual({ tipe: "comment", isi: "Cek sesi" });
    });

    it("posts feedback with its label and optional note", async () => {
      fetchMock.mockResolvedValue(json({ feedback_id: 1, card_id: "IC-1", label: "benar" }, 201));
      await cardsService.feedback("IC-1", { label: "benar", catatan: "" }, "key-2");
      const { url, init, headers } = lastCall();
      expect(url).toBe("/api/v1/cards/IC-1/feedback");
      expect(headers.get("Idempotency-Key")).toBe("key-2");
      expect(JSON.parse(String(init.body))).toEqual({ label: "benar", catatan: "" });
    });

    it("requests a deep dive without a body", async () => {
      fetchMock.mockResolvedValue(json({ case_id: "CS-1" }, 202));
      const result = await cardsService.deepDive("IC-1");
      const { url, init } = lastCall();
      expect(url).toBe("/api/v1/cards/IC-1/deep-dive");
      expect(init.method).toBe("POST");
      expect(init.body).toBeUndefined();
      expect(result).toEqual({ case_id: "CS-1" });
    });
  });

  describe("errors", () => {
    it("keeps the current row_version of a 409 conflict on the error", async () => {
      fetchMock.mockResolvedValue(problem(409, "VERSI_BENTROK", "data sudah berubah", { row_version: 5 }));
      const error = await cardsService
        .update("IC-1", { if_row_version: 3, prioritas: "P2", alasan: "x" })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        kind: "conflict",
        status: 409,
        code: "VERSI_BENTROK",
        traceId: "trace-1",
      });
      expect((error as ApiError).extra).toEqual({ row_version: 5 });
    });

    it.each([
      [404, "not-found"],
      [403, "forbidden"],
      [422, "validation"],
      [503, "unavailable"],
    ])("maps HTTP %s to kind %s", async (status, kind) => {
      fetchMock.mockResolvedValue(problem(status, "KODE", "pesan"));
      await expect(cardsService.detail("IC-1")).rejects.toMatchObject({ kind, status });
    });

    it("reports a network failure without the browser's message", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      await expect(cardsService.list({})).rejects.toMatchObject({ kind: "network", code: "NETWORK" });
    });
  });

  describe("newIdempotencyKey", () => {
    it("returns a distinct 32-character hex key each time", () => {
      const a = newIdempotencyKey();
      const b = newIdempotencyKey();
      expect(a).toMatch(/^[0-9a-f]{32}$/);
      expect(a).not.toBe(b);
    });
  });
});
