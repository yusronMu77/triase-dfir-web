import { api } from "../lib/http/api-client";
import type {
  ChannelPolicy,
  ChannelsResponse,
  ChannelTestResult,
  PutChannelPolicyRequest,
} from "./channels.types";

const channelPath = (channelId: string) => encodeURIComponent(channelId);

export const channelsService = {
  /** `GET /channels`: policy from config plus transport status from the gateway. */
  list: (signal?: AbortSignal) => api.get<ChannelsResponse>("/channels", undefined, signal),

  /** `PUT /channels/{channel_id}`: 409 when `if_version` is stale. */
  putPolicy: (channelId: string, body: PutChannelPolicyRequest) =>
    api.put<ChannelPolicy>(`/channels/${channelPath(channelId)}`, body),

  /** `POST /channels/{channel_id}/test`: sends a test message through the gateway. */
  test: (channelId: string) => api.post<ChannelTestResult>(`/channels/${channelPath(channelId)}/test`),
};
