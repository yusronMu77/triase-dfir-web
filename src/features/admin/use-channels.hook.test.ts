import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import type { ChannelsResponse } from "../../services/channels.types";
import { useChannels } from "./use-channels.hook";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  putPolicy: vi.fn(),
  test: vi.fn(),
  toast: vi.fn(),
  can: (_permission: string): boolean => true,
}));

vi.mock("../../services/channels.service", () => ({
  channelsService: { list: mocks.list, putPolicy: mocks.putPolicy, test: mocks.test },
}));
vi.mock("../session/use-session.hook", () => ({
  useSession: () => ({ can: mocks.can, user: null }),
}));
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => mocks.toast,
}));

const response: ChannelsResponse = {
  kebijakan: {
    items: [
      { channel_id: "telegram", active: true, max_detail: "sedang", min_band: "TINGGI", version: 4 },
      { channel_id: "email", active: false, max_detail: "ringkas", version: 0 },
    ],
  },
  status: { outbox: { pending: 0, sending: 0, sent: 3, dead: 0 }, telegram: { enabled: true } },
  bagian_tidak_tersedia: [],
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useChannels(), { wrapper });
}

async function loaded() {
  const hook = setup();
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe("useChannels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.can = () => true;
    mocks.list.mockResolvedValue(response);
  });

  it("joins policy with transport status and reports the missing parts", async () => {
    mocks.list.mockResolvedValue({ ...response, status: null, bagian_tidak_tersedia: ["status_gateway"] });
    const { result } = await loaded();
    expect(result.current.rows.map((row) => [row.channelId, row.transport])).toEqual([
      ["telegram", "tidak diketahui"],
      ["email", "tidak diketahui"],
    ]);
    expect(result.current.missing).toEqual(["status_gateway"]);
    expect(result.current.canAdmin).toBe(true);
  });

  it("saves the policy with the row's version and clears the draft", async () => {
    mocks.putPolicy.mockResolvedValue({
      channel_id: "telegram",
      active: false,
      max_detail: "penuh",
      version: 5,
    });
    const { result } = await loaded();
    const row = result.current.rows[0];
    act(() => result.current.setDraft(result.current.rows[0], { active: false, maxDetail: "penuh" }));
    await act(async () => {
      await result.current.savePolicy(row);
    });
    expect(mocks.putPolicy).toHaveBeenCalledWith("telegram", {
      active: false,
      max_detail: "penuh",
      min_band: "TINGGI",
      if_version: 4,
    });
    expect(result.current.draftFor(row)).toEqual(row.saved);
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Kebijakan Telegram tersimpan" }),
    );
  });

  it("drops the stale draft on a version conflict", async () => {
    mocks.putPolicy.mockRejectedValue(new ApiError("data berubah", 409, "VERSI_KONFLIK"));
    const { result } = await loaded();
    const row = result.current.rows[1];
    act(() => result.current.setDraft(result.current.rows[1], { active: true }));
    await act(async () => {
      await result.current.savePolicy(row);
    });
    expect(result.current.conflictId).toBe("email");
    expect(result.current.policyError?.channelId).toBe("email");
    expect(result.current.draftFor(row)).toEqual(row.saved);
  });

  it("reports a successful test only when the reply confirms it", async () => {
    mocks.test.mockResolvedValue({ ok: true });
    const { result } = await loaded();
    await act(async () => {
      await result.current.testChannel("telegram");
    });
    expect(mocks.test).toHaveBeenCalledWith("telegram");
    expect(result.current.outcome).toMatchObject({ channelId: "telegram", tone: "success" });
    expect(result.current.busy).toBeNull();
  });

  it("shows an unavailable notice, not an error, when the test route is missing", async () => {
    mocks.test.mockRejectedValue(new ApiError("data tidak ditemukan", 404, "TIDAK_DITEMUKAN"));
    const { result } = await loaded();
    await act(async () => {
      await result.current.testChannel("email");
    });
    expect(result.current.outcome).toMatchObject({ tone: "warning", title: "Uji koneksi belum tersedia" });
  });

  it("shows a failed test with the safe error text", async () => {
    mocks.test.mockRejectedValue(new ApiError("", undefined, "NETWORK"));
    const { result } = await loaded();
    await act(async () => {
      await result.current.testChannel("telegram");
    });
    expect(result.current.outcome).toMatchObject({ tone: "danger", title: "Tes kanal gagal" });
    expect(result.current.outcome?.message).toMatch(/koneksi/);
  });

  it("reports that the viewer cannot administer channels", async () => {
    mocks.can = (permission) => permission !== "channels:admin";
    const { result } = await loaded();
    expect(result.current.canAdmin).toBe(false);
  });
});
