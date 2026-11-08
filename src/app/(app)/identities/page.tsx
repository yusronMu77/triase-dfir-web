import { identities } from "../../../data/admin";
import { IdentitiesView } from "../../../features/admin/identities.view";

const initialPairing = { code: "AST-7KQ2-M9XD", expiresAt: "2099-11-10T10:00:00+07:00" };

export default function Page() {
  return <IdentitiesView rows={identities} initialPairing={initialPairing} />;
}
