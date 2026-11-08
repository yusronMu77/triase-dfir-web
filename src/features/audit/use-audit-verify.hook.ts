"use client";
import { useCallback, useState } from "react";
import type { AuditRow } from "../../data/audit";
import { pause } from "../../lib/pause";

export type ChainResult = { ok: true } | { ok: false; brokenAt: number };

/** Checks that each entry points at the hash of the previous one. The audit service is the real verifier. */
export function verifyChain(rows: AuditRow[]): ChainResult {
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].prev !== rows[i - 1].hash) return { ok: false, brokenAt: rows[i].seq };
  }
  return { ok: true };
}

export function useAuditVerify(rows: AuditRow[]) {
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "broken">("idle");
  const [brokenAt, setBrokenAt] = useState<number | null>(null);
  const verify = useCallback(async () => {
    setStatus("checking");
    await pause(500);
    const result = verifyChain(rows);
    setBrokenAt(result.ok ? null : result.brokenAt);
    setStatus(result.ok ? "valid" : "broken");
  }, [rows]);
  return { status, brokenAt, verify };
}
