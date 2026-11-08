"use client";
import { useToast } from "@astria/ui";
import { useCallback } from "react";
import { pause } from "../../lib/pause";

/** Shared by the configuration and general settings forms. Preview only: nothing is persisted. */
export function useConfigForm(label = "Konfigurasi") {
  const toast = useToast();
  const submit = useCallback(
    async (data: FormData) => {
      const reason = data.get("reason");
      if (reason !== null && String(reason).trim().length < 5) {
        throw new Error("Tuliskan alasan perubahan (minimal 5 karakter).");
      }
      await pause(500);
      toast({
        title: `${label} tersimpan`,
        description: "Pratinjau lokal. Perubahan belum dikirim ke layanan.",
      });
    },
    [toast, label],
  );
  return { submit };
}
