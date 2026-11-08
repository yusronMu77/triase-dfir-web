import { queueItems } from "../../data/fixtures";
import { metricsByRange } from "../../data/metrics";
import { HomeView } from "../../features/home/home.view";

export default function Page() {
  return <HomeView items={queueItems.slice(0, 4)} metrics={metricsByRange["7"].summary} />;
}
