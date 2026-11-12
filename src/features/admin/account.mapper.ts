import type { Me, Role } from "../../services/auth.types";
import { formatWaktu } from "./admin-shared";

const KNOWN_ROLES: readonly Role[] = ["analis", "dfir", "pimpinan", "admin"];

export type AccountView = {
  userId: string;
  roles: Role[];
  permissionCount: number;
  reauthLabel: string;
};

/** Keeps only roles the UI knows how to label. Unknown roles from the server are dropped, not shown. */
export function toAccountView(me: Me): AccountView {
  return {
    userId: me.user_id,
    roles: me.roles.filter((role): role is Role => (KNOWN_ROLES as readonly string[]).includes(role)),
    permissionCount: me.permissions.length,
    reauthLabel: me.reauth_at ? formatWaktu(me.reauth_at) : "Belum dikonfirmasi ulang",
  };
}
