import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "../http/api-error";

/** Retry only what can change by waiting (network, timeout, 502-504, 5xx); never 4xx. At most 2 retries. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  return isApiError(error) && error.retryable;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}
