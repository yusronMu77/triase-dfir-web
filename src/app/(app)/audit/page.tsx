import { auditRows } from "../../../data/audit";
import { AuditView } from "../../../features/audit/audit.view";

export default function Page() {
  return <AuditView rows={auditRows} />;
}
