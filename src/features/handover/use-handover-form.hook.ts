"use client";
import { useToast } from "@astria/ui";
import { useCallback } from "react";
import { pause } from "../../lib/pause";

export function validateHandover(data: FormData) {
  const summary = String(data.get("summary") ?? "").trim();
  if (summary.length < 10) return "Ringkasan serah terima minimal 10 karakter.";
  return "";
}

/** Local preview: the handover is acknowledged with a toast and not stored. */
export function useHandoverForm() {
  const toast = useToast();
  const submit = useCallback(
    async (data: FormData) => {
      const problem = validateHandover(data);
      if (problem) throw new Error(problem);
      await pause(500);
      toast({ title: "Serah terima tercatat", description: "Pratinjau lokal. Belum tersimpan di layanan." });
    },
    [toast],
  );
  return { submit };
}
