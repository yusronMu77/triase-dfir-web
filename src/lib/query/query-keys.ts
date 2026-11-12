/** Central query-key factory. Invalidate by prefix, for example `queryKeys.cards.all`. */
export const queryKeys = {
  session: ["session"] as const,
  cards: {
    all: ["cards"] as const,
    list: (filters: object) => ["cards", "list", filters] as const,
    detail: (id: string) => ["cards", "detail", id] as const,
    evidence: (id: string) => ["cards", "evidence", id] as const,
  },
  cases: {
    all: ["cases"] as const,
    detail: (id: string) => ["cases", "detail", id] as const,
    timeline: (id: string) => ["cases", "timeline", id] as const,
  },
  digests: {
    all: ["digests"] as const,
    list: (filters: object) => ["digests", "list", filters] as const,
    detail: (id: string) => ["digests", "detail", id] as const,
  },
  handover: ["handover"] as const,
  ingest: { job: (id: string) => ["ingest", "job", id] as const },
  deviceScans: { all: ["device-scans"] as const },
  metrics: (range: object) => ["metrics", range] as const,
  audit: { all: ["audit"] as const, list: (filters: object) => ["audit", "list", filters] as const },
  config: ["config"] as const,
  channels: ["channels"] as const,
  outbox: (filters: object) => ["outbox", filters] as const,
  identities: ["identities"] as const,
};
