"use client";
import { useCallback, useState } from "react";
import type { ChannelRow } from "../../data/admin";
import { pause } from "../../lib/pause";

export type ChannelTest = { id: string; ok: boolean } | { id: string; ok: null };

/** A channel marked "Perlu tes" or "Nonaktif" fails the simulated test; the real test runs in the notifier. */
export function simulateChannelTest(channel: ChannelRow) {
  return channel.status === "Terhubung";
}

export function useChannels(channels: ChannelRow[]) {
  const [result, setResult] = useState<ChannelTest | null>(null);
  const test = useCallback(
    async (id: string) => {
      const channel = channels.find((row) => row.id === id);
      if (!channel) return;
      setResult({ id, ok: null });
      await pause(500);
      setResult({ id, ok: simulateChannelTest(channel) });
    },
    [channels],
  );
  return { result, test, testing: result?.ok === null };
}
