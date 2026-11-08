"use client";
import { useCallback, useState } from "react";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makePairingCode(random: () => number = Math.random) {
  const chunk = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(random() * alphabet.length)]).join("");
  return `AST-${chunk()}-${chunk()}`;
}

/** Preview pairing code. The identity service issues and expires real codes. */
export function usePairing(
  initial: { code: string; expiresAt: string },
  now: () => number = Date.now,
  ttlMs = 10 * 60 * 1000,
) {
  const [pairing, setPairing] = useState(initial);
  const regenerate = useCallback(() => {
    setPairing({ code: makePairingCode(), expiresAt: new Date(now() + ttlMs).toISOString() });
  }, [now, ttlMs]);
  return { ...pairing, regenerate };
}
