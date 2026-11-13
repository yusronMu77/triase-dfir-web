import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import type { SettingItem } from "../../services/config.types";
import { useConfigForm } from "./use-config-form.hook";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  putSetting: vi.fn(),
  putSecret: vi.fn(),
  reauth: vi.fn(),
  toast: vi.fn(),
  can: (_permission: string): boolean => true,
}));

vi.mock("../../services/config.service", () => ({
  configService: { list: mocks.list, putSetting: mocks.putSetting, putSecret: mocks.putSecret },
}));
vi.mock("../../services/auth.service", () => ({ authService: { reauth: mocks.reauth } }));
vi.mock("../session/use-session.hook", () => ({
  useSession: () => ({ can: mocks.can, user: null }),
}));
vi.mock("@astria/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@astria/ui")>()),
  useToast: () => mocks.toast,
}));

const items: SettingItem[] = [
  { key: "model.timeout_seconds", value: 20, source: "database", version: 2 },
  { key: "model.api_key", terisi: false, version: 0 },
  { key: "schedule.digest", value: "0 7 * * 1-5", source: "bawaan", version: 0 },
];

function setup(group: "configuration" | "settings" = "configuration") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useConfigForm(group), { wrapper });
}

async function loaded(group: "configuration" | "settings" = "configuration") {
  const hook = setup(group);
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

const secretForm = (value: string) => {
  const form = new FormData();
  form.set("value", value);
  return form;
};

const deny = () => new ApiError("aksi ini tidak diizinkan", 403, "DILARANG");

describe("useConfigForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.can = () => true;
    mocks.list.mockResolvedValue({ items });
  });

  it("loads operational settings and secret status on /configuration", async () => {
    const { result } = await loaded("configuration");
    expect(result.current.groups.map((group) => group.scope)).toEqual(["model"]);
    expect(result.current.secrets).toEqual([
      expect.objectContaining({ key: "model.api_key", filled: false }),
    ]);
    expect(result.current.canEdit).toBe(true);
    expect(result.current.empty).toBe(false);
  });

  it("loads the other scopes on /settings and no secrets", async () => {
    const { result } = await loaded("settings");
    expect(result.current.groups.map((group) => group.scope)).toEqual(["schedule"]);
    expect(result.current.secrets).toEqual([]);
  });

  it("saves the parsed value with the version the form was loaded with", async () => {
    mocks.putSetting.mockResolvedValue({
      key: "model.timeout_seconds",
      value: 45,
      source: "database",
      version: 3,
    });
    const { result } = await loaded();
    const row = result.current.groups[0].rows[0];
    act(() => result.current.setDraft(row.key, "45"));
    await act(async () => {
      await result.current.saveSetting(row);
    });
    expect(mocks.putSetting).toHaveBeenCalledWith("model.timeout_seconds", { value: 45, if_version: 2 });
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "model.timeout_seconds tersimpan" }),
    );
    expect(result.current.draftFor(row)).toBe(row.draftText);
  });

  it("does not call the api for an invalid draft and shows the message on that key only", async () => {
    const { result } = await loaded();
    const row = result.current.groups[0].rows[0];
    act(() => result.current.setDraft(row.key, "abc"));
    await act(async () => {
      await result.current.saveSetting(row);
    });
    expect(mocks.putSetting).not.toHaveBeenCalled();
    expect(result.current.settingError).toEqual({ key: row.key, message: "Isi dengan angka." });
  });

  it("drops the stale draft on a version conflict and asks for a reload of the value", async () => {
    mocks.putSetting.mockRejectedValue(new ApiError("data berubah", 409, "VERSI_KONFLIK"));
    const { result } = await loaded();
    const row = result.current.groups[0].rows[0];
    act(() => result.current.setDraft(row.key, "60"));
    await act(async () => {
      await result.current.saveSetting(row);
    });
    expect(result.current.conflictKey).toBe(row.key);
    expect(result.current.draftFor(row)).toBe(row.draftText);
    expect(result.current.settingError?.key).toBe(row.key);
    expect(mocks.list.mock.calls.length).toBeGreaterThan(1);
  });

  it("stores a secret without keeping its value in the hook result", async () => {
    mocks.putSecret.mockResolvedValue({ key: "model.api_key", terisi: true, version: 1 });
    const { result } = await loaded();
    await act(async () => {
      await result.current.saveSecret("model.api_key", secretForm("rahasia-uji-1"));
    });
    expect(mocks.putSecret).toHaveBeenCalledWith("model.api_key", "rahasia-uji-1");
    expect(JSON.stringify(result.current)).not.toContain("rahasia-uji-1");
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Secret model.api_key tersimpan" }),
    );
  });

  it("rejects an empty secret without calling the api", async () => {
    const { result } = await loaded();
    await act(async () => {
      await result.current.saveSecret("model.api_key", secretForm("   "));
    });
    expect(mocks.putSecret).not.toHaveBeenCalled();
    expect(result.current.secretError).toEqual({
      key: "model.api_key",
      message: "Isi nilai secret dulu.",
    });
  });

  it("asks for the password after a 403 and retries the same secret once", async () => {
    mocks.putSecret
      .mockRejectedValueOnce(deny())
      .mockResolvedValueOnce({ key: "model.api_key", terisi: true, version: 1 });
    mocks.reauth.mockResolvedValue({ reauth_at: "2026-11-12T03:00:00Z" });
    const { result } = await loaded();
    await act(async () => {
      await result.current.saveSecret("model.api_key", secretForm("rahasia-uji-2"));
    });
    expect(result.current.reauth.open).toBe(true);
    expect(mocks.toast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Secret model.api_key tersimpan" }),
    );

    await act(async () => {
      await result.current.reauth.submit("kata-sandi-uji");
    });
    expect(mocks.reauth).toHaveBeenCalledWith("kata-sandi-uji");
    expect(mocks.putSecret).toHaveBeenNthCalledWith(2, "model.api_key", "rahasia-uji-2");
    expect(result.current.reauth.open).toBe(false);
    expect(result.current.secretError).toBeNull();
    expect(JSON.stringify(result.current)).not.toContain("rahasia-uji-2");
  });

  it("keeps the dialog open with a message when the password is wrong, and does not retry", async () => {
    mocks.putSecret.mockRejectedValueOnce(deny());
    mocks.reauth.mockRejectedValue(new ApiError("salah", 401, "TIDAK_TERAUTENTIKASI"));
    const { result } = await loaded();
    await act(async () => {
      await result.current.saveSecret("model.api_key", secretForm("rahasia-uji-3"));
    });
    await act(async () => {
      await result.current.reauth.submit("salah");
    });
    expect(result.current.reauth.open).toBe(true);
    expect(result.current.reauth.error).toBe("Kata sandi salah.");
    expect(mocks.putSecret).toHaveBeenCalledTimes(1);
  });

  it("shows the error and stops after a second 403, instead of asking again", async () => {
    mocks.putSecret.mockRejectedValue(deny());
    mocks.reauth.mockResolvedValue({ reauth_at: "2026-11-12T03:00:00Z" });
    const { result } = await loaded();
    await act(async () => {
      await result.current.saveSecret("model.api_key", secretForm("rahasia-uji-4"));
    });
    await act(async () => {
      await result.current.reauth.submit("kata-sandi-uji");
    });
    expect(mocks.putSecret).toHaveBeenCalledTimes(2);
    expect(result.current.reauth.open).toBe(false);
    expect(result.current.secretError?.key).toBe("model.api_key");
  });

  it("forgets the pending secret when the dialog is cancelled", async () => {
    mocks.putSecret.mockRejectedValueOnce(deny());
    const { result } = await loaded();
    await act(async () => {
      await result.current.saveSecret("model.api_key", secretForm("rahasia-uji-5"));
    });
    act(() => result.current.reauth.cancel());
    await act(async () => {
      await result.current.reauth.submit("kata-sandi-uji");
    });
    expect(mocks.reauth).toHaveBeenCalledTimes(1);
    expect(mocks.putSecret).toHaveBeenCalledTimes(1);
  });
});
