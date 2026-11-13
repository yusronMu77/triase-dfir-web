import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { useIdentities } from "./use-identities.hook";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  revoke: vi.fn(),
  toast: vi.fn(),
  can: (_permission: string): boolean => true,
  user: { user_id: "usr_me" } as { user_id: string } | null,
}));

vi.mock("../../services/identities.service", () => ({
  identitiesService: { list: mocks.list, revoke: mocks.revoke },
}));
vi.mock("../session/use-session.hook", () => ({
  useSession: () => ({ can: mocks.can, user: mocks.user }),
}));
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => mocks.toast,
}));

const items = [
  { id: "idn_1", user_id: "usr_me", channel_id: "telegram", status: "aktif" },
  { id: "idn_2", user_id: "usr_other", channel_id: "whatsapp", status: "aktif" },
];

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useIdentities(), { wrapper });
}

async function loaded() {
  const hook = setup();
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe("useIdentities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.can = () => false;
    mocks.user = { user_id: "usr_me" };
    mocks.list.mockResolvedValue({ items });
  });

  it("lets a non-admin revoke only their own binding", async () => {
    const { result } = await loaded();
    expect(result.current.rows.map((row) => [row.id, row.canRevoke])).toEqual([
      ["idn_1", true],
      ["idn_2", false],
    ]);
  });

  it("lets an admin revoke any active binding", async () => {
    mocks.can = (permission) => permission === "identities:admin";
    const { result } = await loaded();
    expect(result.current.rows.every((row) => row.canRevoke)).toBe(true);
  });

  it("asks for confirmation first, then revokes and refreshes the list", async () => {
    mocks.revoke.mockResolvedValue(undefined);
    const { result } = await loaded();
    act(() => result.current.requestRevoke(result.current.rows[0]));
    expect(result.current.target?.id).toBe("idn_1");
    expect(mocks.revoke).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.confirmRevoke();
    });
    expect(mocks.revoke).toHaveBeenCalledWith("idn_1");
    expect(result.current.target).toBeNull();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Akun diputus dari kanal" }));
  });

  it("keeps the dialog open with the error when revoking fails", async () => {
    mocks.revoke.mockRejectedValue(new ApiError("", 404, "TIDAK_DITEMUKAN"));
    const { result } = await loaded();
    act(() => result.current.requestRevoke(result.current.rows[0]));
    await act(async () => {
      await result.current.confirmRevoke();
    });
    expect(result.current.target?.id).toBe("idn_1");
    expect(result.current.revokeError).toMatch(/tidak ditemukan/);
    expect(result.current.revoking).toBe(false);
  });

  it("can be cancelled before the revoke starts", async () => {
    const { result } = await loaded();
    act(() => result.current.requestRevoke(result.current.rows[0]));
    act(() => result.current.cancelRevoke());
    expect(result.current.target).toBeNull();
    expect(mocks.revoke).not.toHaveBeenCalled();
  });

  it("flags a missing gateway route as unavailable", async () => {
    mocks.list.mockRejectedValue(new ApiError("", 404, "TIDAK_DITEMUKAN"));
    const { result } = await loaded();
    expect(result.current.unavailable).toBe(true);
  });
});
