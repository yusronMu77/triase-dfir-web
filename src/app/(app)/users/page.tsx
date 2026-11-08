import { users } from "../../../data/admin";
import { UsersView } from "../../../features/admin/users.view";

export default function Page() {
  return <UsersView rows={users} />;
}
