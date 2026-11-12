"use client";
import { useToast } from "@astria/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { describeError, isApiError } from "../../lib/http/api-error";
import { queryKeys } from "../../lib/query/query-keys";
import { nextStatuses } from "../../services/cards.mapper";
import { cardsService, newIdempotencyKey } from "../../services/cards.service";
import type {
  CardConclusion,
  CardFeedbackLabel,
  CardPatchBody,
  CardPriority,
  CardStatus,
  CardSummary,
} from "../../services/cards.types";

export type CardAction = "status" | "owner" | "priority" | "comment" | "feedback" | "deepDive";

/** Same rule as the server (`api` `ubah`): letters, digits, dot, underscore, at sign, or dash, up to 64 characters. */
const OWNER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._@-]{0,63}$/;
const CONCLUSIONS: CardConclusion[] = ["insiden_benar", "bukan_insiden", "ditutup_tanpa_tindakan"];
const FEEDBACK: CardFeedbackLabel[] = ["benar", "salah_positif", "perlu_dfir"];
const PRIORITIES: CardPriority[] = ["P1", "P2", "P3", "P4"];
const STATUSES: CardStatus[] = ["baru", "ditinjau", "diselidiki", "eskalasi", "selesai"];

const TOAST_TITLE: Record<CardAction, string> = {
  status: "Status diperbarui",
  owner: "Pemilik diperbarui",
  priority: "Prioritas diperbarui",
  comment: "Komentar terkirim",
  feedback: "Umpan balik tersimpan",
  deepDive: "Analisis DFIR diminta",
};

const CONFLICT_TEXT = "Kartu sudah diubah pengguna lain. Data dimuat ulang; periksa lalu coba lagi.";

/** Reads one form field as trimmed text. Missing or non-text fields become "". */
export const formText = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};

/** Returns the value when it is one of the allowed values, otherwise undefined. */
export function pick<T extends string>(value: string, allowed: readonly T[]): T | undefined {
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

type PatchVars = { action: CardAction; cardId: string; body: CardPatchBody };

/**
 * Write actions on one card: status, owner, priority, comment, feedback, and deep-dive. Each action checks its
 * input here first (a convenience; the server decides). A 409 conflict reloads the card so the next try uses the
 * current `row_version`. Views pass a FormData of their form and read the result from the returned state.
 */
export function useCardActions(card: CardSummary | null) {
  const toast = useToast();
  const client = useQueryClient();
  const [problem, setProblem] = useState<{ action: CardAction; text: string } | null>(null);

  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.cards.all });

  const patch = useMutation({
    mutationFn: ({ cardId, body }: PatchVars) => cardsService.update(cardId, body),
    onSuccess: (_data, vars) => {
      toast({ title: TOAST_TITLE[vars.action] });
      void invalidate();
    },
    onError: (error) => {
      if (isApiError(error) && error.kind === "conflict") void invalidate();
    },
  });
  const comment = useMutation({
    mutationFn: (vars: { cardId: string; isi: string; key: string }) =>
      cardsService.addEvent(vars.cardId, { tipe: "comment", isi: vars.isi }, vars.key),
    onSuccess: () => {
      toast({ title: TOAST_TITLE.comment });
      void invalidate();
    },
  });
  const feedback = useMutation({
    mutationFn: (vars: { cardId: string; label: CardFeedbackLabel; catatan: string; key: string }) =>
      cardsService.feedback(vars.cardId, { label: vars.label, catatan: vars.catatan }, vars.key),
    onSuccess: () => {
      toast({ title: TOAST_TITLE.feedback });
      void invalidate();
    },
  });
  const deepDive = useMutation({
    mutationFn: (cardId: string) => cardsService.deepDive(cardId),
    onSuccess: () => {
      toast({ title: TOAST_TITLE.deepDive });
      void invalidate();
    },
  });

  const mutationFor = (action: CardAction) => {
    if (action === "comment") return comment;
    if (action === "feedback") return feedback;
    if (action === "deepDive") return deepDive;
    return patch;
  };
  const ownsAction = (action: CardAction) =>
    action === "status" || action === "owner" || action === "priority"
      ? patch.variables?.action === action
      : true;

  /** Text under the form of `action`: its own validation message first, then the last server error. */
  function errorOf(action: CardAction): string | null {
    if (problem?.action === action) return problem.text;
    const mutation = mutationFor(action);
    if (!mutation.isError || !ownsAction(action)) return null;
    const error = mutation.error;
    if (isApiError(error) && error.kind === "conflict") return CONFLICT_TEXT;
    return describeError(error);
  }

  /** True while the request of `action` is in flight, so its button can show a spinner and stay disabled. */
  const busy = (action: CardAction) => mutationFor(action).isPending && ownsAction(action);

  function fail(action: CardAction, text: string): false {
    setProblem({ action, text });
    return false;
  }

  /** Runs one patch and reports success. Validation failures return false without a request. */
  async function sendPatch(
    action: CardAction,
    body: Omit<CardPatchBody, "if_row_version">,
  ): Promise<boolean> {
    if (!card) return false;
    setProblem(null);
    try {
      await patch.mutateAsync({
        action,
        cardId: card.card_id,
        body: { if_row_version: card.row_version, ...body },
      });
      return true;
    } catch {
      return false;
    }
  }

  async function changeStatus(form: FormData): Promise<boolean> {
    if (!card) return false;
    const status = pick(formText(form, "status"), STATUSES);
    if (!status || !nextStatuses[card.status].includes(status)) return fail("status", "Pilih status tujuan.");
    const conclusion = pick(formText(form, "kesimpulan"), CONCLUSIONS);
    const catatan = formText(form, "catatan");
    if (status === "selesai" && !conclusion) {
      return fail("status", "Pilih kesimpulan sebelum menandai kartu selesai.");
    }
    return sendPatch("status", {
      status,
      ...(status === "selesai" ? { kesimpulan: conclusion, kesimpulan_catatan: catatan || undefined } : {}),
    });
  }

  async function changeOwner(form: FormData): Promise<boolean> {
    if (!card) return false;
    const owner = formText(form, "pemilik");
    if (owner && !OWNER_PATTERN.test(owner)) {
      return fail(
        "owner",
        "Nama pemilik hanya boleh huruf, angka, titik, garis bawah, @, atau tanda hubung.",
      );
    }
    if (owner === (card.pemilik ?? "")) return fail("owner", "Pemilik belum berubah.");
    return sendPatch("owner", { pemilik: owner || null });
  }

  async function changePriority(form: FormData): Promise<boolean> {
    if (!card) return false;
    const prioritas = pick(formText(form, "prioritas"), PRIORITIES);
    const alasan = formText(form, "alasan");
    if (!prioritas) return fail("priority", "Pilih prioritas.");
    if (prioritas === card.prioritas) return fail("priority", "Prioritas belum berubah.");
    if (!alasan) return fail("priority", "Alasan wajib diisi saat mengubah prioritas.");
    return sendPatch("priority", { prioritas, alasan });
  }

  async function addComment(form: FormData): Promise<boolean> {
    if (!card) return false;
    const isi = formText(form, "isi");
    if (!isi) return fail("comment", "Komentar tidak boleh kosong.");
    setProblem(null);
    try {
      await comment.mutateAsync({ cardId: card.card_id, isi, key: newIdempotencyKey() });
      return true;
    } catch {
      return false;
    }
  }

  async function sendFeedback(form: FormData): Promise<boolean> {
    if (!card) return false;
    const label = pick(formText(form, "label"), FEEDBACK);
    if (!label) return fail("feedback", "Pilih jenis umpan balik.");
    setProblem(null);
    try {
      await feedback.mutateAsync({
        cardId: card.card_id,
        label,
        catatan: formText(form, "catatan"),
        key: newIdempotencyKey(),
      });
      return true;
    } catch {
      return false;
    }
  }

  async function requestDeepDive(): Promise<boolean> {
    if (!card) return false;
    setProblem(null);
    try {
      await deepDive.mutateAsync(card.card_id);
      return true;
    } catch {
      return false;
    }
  }

  return {
    changeStatus,
    changeOwner,
    changePriority,
    addComment,
    sendFeedback,
    requestDeepDive,
    busy,
    errorOf,
    /** The case id of the last successful deep-dive request, for a link to `/cases/{id}`. */
    deepDiveCaseId: deepDive.isSuccess ? deepDive.data.case_id : null,
  };
}
