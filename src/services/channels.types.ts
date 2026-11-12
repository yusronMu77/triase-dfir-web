/**
 * Channel policy mirrors `contracts/openapi/config-internal.yaml` (ChannelPolicy, PutChannelPolicyRequest).
 * The gateway status mirrors `contracts/openapi/gateway-internal.yaml` (GatewayStatus). The api combines them
 * in `GET /api/v1/channels`. The connection-test result has no contract yet: `ChannelTestResult` is a guess and
 * every field in it is optional.
 */
export type MaxDetail = "ringkas" | "sedang" | "penuh";
export type Band = "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";

export type ChannelPolicy = {
  channel_id: string;
  active: boolean;
  max_detail: MaxDetail;
  min_band?: Band;
  version: number;
  updated_by?: string | null;
  updated_at?: string | null;
};

export type ChannelPolicyList = { items: ChannelPolicy[] };

export type PutChannelPolicyRequest = {
  active: boolean;
  max_detail: MaxDetail;
  min_band?: Band;
  if_version: number;
};

export type OutboxCounts = { pending: number; sending: number; sent: number; dead: number };

export type GatewayStatus = {
  outbox: OutboxCounts;
  oldest_pending_at?: string | null;
  telegram?: { enabled?: boolean };
  whatsapp?: { enabled?: boolean };
  email?: { enabled?: boolean };
  public_listener?: boolean;
};

/** Body of `GET /api/v1/channels`. `status` is null and `status_gateway` is listed when the gateway is down. */
export type ChannelsResponse = {
  kebijakan: ChannelPolicyList;
  status: GatewayStatus | null;
  bagian_tidak_tersedia: string[];
};

/** Unverified shape: the gateway has no `/channels/{id}/test` route in its contract yet. */
export type ChannelTestResult = { ok?: boolean; detail?: string };
