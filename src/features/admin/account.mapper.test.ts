import { describe, expect, it } from "vitest";
import { toAccountView } from "./account.mapper";

describe("toAccountView", () => {
  it("keeps only roles the UI can label", () => {
    const view = toAccountView({
      user_id: "usr_1",
      roles: ["analis", "juru-kunci", "admin"],
      permissions: ["cards:read", "session"],
    });
    expect(view.roles).toEqual(["analis", "admin"]);
    expect(view.permissionCount).toBe(2);
  });

  it("says when the password was last confirmed, or that it never was", () => {
    expect(toAccountView({ user_id: "usr_1", roles: [], permissions: [] }).reauthLabel).toBe(
      "Belum dikonfirmasi ulang",
    );
    const confirmed = toAccountView({
      user_id: "usr_1",
      roles: [],
      permissions: [],
      reauth_at: "2026-11-12T03:00:00Z",
    });
    expect(confirmed.reauthLabel).toMatch(/2026/);
  });
});
