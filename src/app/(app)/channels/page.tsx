import { channels } from "../../../data/admin";
import { ChannelsView } from "../../../features/admin/channels.view";

export default function Page() {
  return <ChannelsView rows={channels} />;
}
