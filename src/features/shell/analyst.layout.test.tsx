import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { AnalystLayout } from "./analyst.layout";

const shell = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock("./use-shell-state.hook", () => ({ useShellState: () => shell.current }));
// The Radix parts of the shell load their own React copy from `ui/node_modules`; the guard does not need them.
vi.mock("@astria/ui", async (original) => ({
  ...(await original<typeof import("@astria/ui")>()),
  ToastProvider: ({ children }: { children: ReactNode }) => children,
  AppShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

function state(session: Record<string, unknown>, forbidden: boolean) {
  return {
    session: { user: null, role: null, loading: false, error: null, retry: vi.fn(), ...session },
    status: { label: "Semua layanan normal", tone: "success" },
    activePath: "/users",
    forbidden,
    navigation: [],
    navigate: vi.fn(),
    signOut: vi.fn(),
    signOutError: "",
  };
}
const analis = { user: { user_id: "usr_1", roles: ["analis"], permissions: ["session"] }, role: "analis" };
const screenBody = <p>isi layar terbatas</p>;

describe("AnalystLayout route guard", () => {
  afterEach(cleanup);
  beforeEach(() => {
    shell.current = state(analis, false);
  });

  it("renders the screen when the route is allowed", () => {
    render(<AnalystLayout>{screenBody}</AnalystLayout>);
    expect(screen.getByText("isi layar terbatas")).toBeTruthy();
    expect(screen.queryByText("Akses ditolak")).toBeNull();
  });

  it("renders the 403 screen instead of the screen when the route is forbidden", () => {
    shell.current = state(analis, true);
    render(<AnalystLayout>{screenBody}</AnalystLayout>);
    expect(screen.getByText("Akses ditolak")).toBeTruthy();
    expect(screen.queryByText("isi layar terbatas")).toBeNull();
  });

  it("shows neither the screen nor a 403 while /auth/me is pending", () => {
    shell.current = state({ loading: true }, true);
    render(<AnalystLayout>{screenBody}</AnalystLayout>);
    expect(screen.getByText("Memuat sesi…")).toBeTruthy();
    expect(screen.queryByText("isi layar terbatas")).toBeNull();
    expect(screen.queryByText("Akses ditolak")).toBeNull();
  });

  it("reports a failed /auth/me as unreachable with retry, not as a 403", () => {
    shell.current = state({ error: new ApiError("down", 503, "LAYANAN_TIDAK_TERSEDIA") }, true);
    render(<AnalystLayout>{screenBody}</AnalystLayout>);
    expect(screen.getByText("Layanan belum dapat dijangkau")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeTruthy();
    expect(screen.queryByText("Akses ditolak")).toBeNull();
    expect(screen.queryByText("isi layar terbatas")).toBeNull();
  });

  it("reports an expired session as such, not as a 403", () => {
    shell.current = state({ error: new ApiError("", 401, "TIDAK_TEROTENTIKASI") }, true);
    render(<AnalystLayout>{screenBody}</AnalystLayout>);
    expect(screen.getByText(/Sesi Anda berakhir/)).toBeTruthy();
    expect(screen.queryByText("Akses ditolak")).toBeNull();
    expect(screen.queryByText("isi layar terbatas")).toBeNull();
  });
});
