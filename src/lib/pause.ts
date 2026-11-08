/** Simulated latency for local previews. Real data access replaces callers later. */
export const pause = (ms = 600) => new Promise<void>((resolve) => setTimeout(resolve, ms));
