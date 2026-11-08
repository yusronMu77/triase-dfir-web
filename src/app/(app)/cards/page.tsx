import { queueItems } from "../../../data/fixtures";
import { CardQueueView } from "../../../features/card/card-queue.view";

export default function Page() {
  return <CardQueueView items={queueItems} />;
}
