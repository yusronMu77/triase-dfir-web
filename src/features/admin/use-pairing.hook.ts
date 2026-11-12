"use client";
import { useCallback, useRef, useState } from "react";
import { describeError } from "../../lib/http/api-error";
import { identitiesService } from "../../services/identities.service";
import { normalizeChannelInput, type PairingView, toPairingView } from "./identities.mapper";

/**
 * Issues one-time pairing codes for the signed-in user. The code is kept in component state only: it is
 * shown once and never written to storage or logs. The identity service stores only its hash.
 */
export function usePairing() {
  const [pairing, setPairing] = useState<PairingView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastChannel = useRef<string | undefined>(undefined);

  const issue = useCallback(async (text: string) => {
    const input = normalizeChannelInput(text);
    if (!input.ok) {
      setError(input.message);
      return;
    }
    lastChannel.current = input.channel;
    setBusy(true);
    setError(null);
    try {
      const issued = await identitiesService.issuePairingCode(
        input.channel ? { channel: input.channel } : {},
      );
      const view = toPairingView(issued);
      if (!view) {
        setPairing(null);
        setError("Respons layanan tidak dapat dibaca. Silakan coba lagi.");
        return;
      }
      setPairing(view);
    } catch (caught) {
      setPairing(null);
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }, []);

  const regenerate = useCallback(() => issue(lastChannel.current ?? ""), [issue]);

  return { pairing, busy, error, issue, regenerate };
}
