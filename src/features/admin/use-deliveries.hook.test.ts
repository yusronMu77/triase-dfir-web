import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { useDeliveries } from "./use-deliveries.hook";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  retry: vi.fn(),
  toast: vi.fn(),
  can: (_permission: string): boolean => true,
}));

vi.mock("../../services/outbox.service", () => ({
  outboxService: { list: mocks.list, retry: mocks.retry },
}));
vi.mock("../session/use-session.hook", () => ({
  useSession: () => ({ can: mocks.can, user: null }),
}));
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => mocks.toast,
}));

const items = [
  { message_id: "msg_1", channel_id: "telegram", subject: "Alert kritis", status: "sent", attempts: 1 },
  {
    message_id: "msg_2",
    channel_id: "email",
    subject: "Digest",
    status: "dead",
    attempts: 5,
    last_error: "timeout",
  },
];

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useDeliveries(), { wrapper });
}

async function loaded() {
  const hook = setup();
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe("useDeliveries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.can = () => true;
    mocks.list.mockResolvedValue({ items });
  });

  it("lists all statuses first and maps the rows", async () => {
    const { result } = await loaded();
    expect(mocks.list).toHaveBeenCalledWith(undefined, expect.anything());
    expect(result.current.rows.map((row) => [row.id, row.retryable])).toEqual([
      ["msg_1", false],
      ["msg_2", true],
    ]);
    expect(result.current.unavailable).toBe(false);
  });

  it("filters by a known status and ignores anything else", async () => {
    const { result } = await loaded();
    act(() => result.current.changeFilter("dead"));
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith("dead", expect.anything()));
    expect(result.current.status).toBe("dead");
    act(() => result.current.changeFilter("'; drop table"));
    expect(result.current.status).toBe("dead");
  });

  it("resends a failed message and refreshes the log", async () => {
    mocks.retry.mockResolvedValue(undefined);
    const { result } = await loaded();
    const failed = result.current.rows[1];
    await act(async () => {
      await result.current.retryDelivery(failed);
    });
    expect(mocks.retry).toHaveBeenCalledWith("msg_2");
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Pengiriman dijadwalkan ulang" }),
    );
    expect(result.current.retrying).toBeNull();
  });

  it("keeps the error on the row that failed to retry", async () => {
    mocks.retry.mockRejectedValue(new ApiError("", 409, "KONFLIK"));
    const { result } = await loaded();
    await act(async () => {
      await result.current.retryDelivery(result.current.rows[1]);
    });
    expect(result.current.retryError).toEqual({ id: "msg_2", message: expect.any(String) });
    expect(result.current.retryError?.id).toBe("msg_2");
  });

  it("flags a missing gateway route as unavailable", async () => {
    mocks.list.mockRejectedValue(new ApiError("", 404, "TIDAK_DITEMUKAN"));
    const { result } = await loaded();
    expect(result.current.unavailable).toBe(true);
    expect(result.current.rows).toEqual([]);
  });

  it("hides retry from roles without channel administration", async () => {
    mocks.can = () => false;
    const { result } = await loaded();
    expect(result.current.canRetry).toBe(false);
  });
});
