import { api, type QueryParams } from "../lib/http/api-client";
import type {
  AlertExplain,
  CardDetail,
  CardEvent,
  CardEventBody,
  CardEvidence,
  CardFeedbackBody,
  CardFeedbackResult,
  CardListQuery,
  CardPage,
  CardPatchBody,
  CardSummary,
  DeepDiveResult,
} from "./cards.types";

/**
 * Idempotency key for a write that may be retried (comment, feedback). `crypto.randomUUID` exists only in secure
 * contexts, and the dashboard can be opened over plain http on a LAN, so fall back to `getRandomValues`.
 */
export function newIdempotencyKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const cardPath = (cardId: string) => `/cards/${encodeURIComponent(cardId)}`;

/** Maps the form fields of the queue to the query names of `GET /cards`. Empty values are dropped by the client. */
export function toCardQuery(query: CardListQuery): QueryParams {
  return {
    status: query.status,
    band: query.band,
    prioritas: query.prioritas,
    pemilik: query.pemilik?.trim() || undefined,
    host: query.host?.trim() || undefined,
    dari: query.dari,
    sampai: query.sampai,
    cursor: query.cursor,
    limit: query.limit,
  };
}

export const cardsService = {
  /** `GET /cards`: one page of the queue, newest first (the server sorts; SLA order is not available). */
  list: (query: CardListQuery, signal?: AbortSignal) =>
    api.get<CardPage>("/cards", toCardQuery(query), signal),
  /** `GET /cards/{id}`: header, document, activity, and explanations. 404 when the card does not exist. */
  detail: (cardId: string, signal?: AbortSignal) => api.get<CardDetail>(cardPath(cardId), undefined, signal),
  /** `PATCH /cards/{id}`: needs `if_row_version`. A stale version answers 409 with `extra.row_version`. */
  update: (cardId: string, body: CardPatchBody) => api.patch<CardSummary>(cardPath(cardId), body),
  /** `POST /cards/{id}/events`: a comment or a label. Sends an Idempotency-Key so a retry cannot duplicate it. */
  addEvent: (cardId: string, body: CardEventBody, idempotencyKey: string) =>
    api.post<CardEvent>(`${cardPath(cardId)}/events`, body, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  /** `POST /cards/{id}/feedback`: analyst verdict on the alert. */
  feedback: (cardId: string, body: CardFeedbackBody, idempotencyKey: string) =>
    api.post<CardFeedbackResult>(`${cardPath(cardId)}/feedback`, body, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  /** `POST /cards/{id}/deep-dive`: asks the DFIR service for a case (202). Needs `cards:deep_dive`. */
  deepDive: (cardId: string) => api.post<DeepDiveResult>(`${cardPath(cardId)}/deep-dive`),
  /** `GET /cards/{id}/evidence`: sanitized evidence records for the card's evidence ids. */
  evidence: async (cardId: string, signal?: AbortSignal): Promise<CardEvidence> => {
    const raw = await api.get<Partial<CardEvidence>>(`${cardPath(cardId)}/evidence`, undefined, signal);
    // The api composes this body from two services; keep the screen alive if either list is missing.
    return {
      card_id: raw.card_id ?? cardId,
      evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
      tidak_ditemukan: Array.isArray(raw.tidak_ditemukan) ? raw.tidak_ditemukan : [],
    };
  },
  /** `GET /alerts/{id}/explain`: the explanation of one alert. Not shown on screen yet; kept for the detail view. */
  alertExplain: (alertId: string, signal?: AbortSignal) =>
    api.get<AlertExplain>(`/alerts/${encodeURIComponent(alertId)}/explain`, undefined, signal),
};
