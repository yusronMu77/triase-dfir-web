import { deliveries } from "../../../data/admin";
import { DeliveriesView } from "../../../features/admin/deliveries.view";

export default function Page() {
  return <DeliveriesView rows={deliveries} />;
}
