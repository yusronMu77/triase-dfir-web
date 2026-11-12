import { describe, expect, it } from "vitest";
import { ApiError } from "../http/api-error";
import { createQueryClient, shouldRetry } from "./query-client";
import { signInUrl } from "./query-provider";

describe("shouldRetry", () => {
  it("retries transient failures at most twice and never client errors", () => {
    const unavailable = new ApiError("", 503, "LAYANAN_TIDAK_TERSEDIA");
    expect(shouldRetry(0, unavailable)).toBe(true);
    expect(shouldRetry(1, new ApiError("", undefined, "NETWORK"))).toBe(true);
    expect(shouldRetry(2, unavailable)).toBe(false);
    for (const status of [400, 401, 403, 404, 409, 422, 429]) {
      expect(shouldRetry(0, new ApiError("", status, "X"))).toBe(false);
    }
    expect(shouldRetry(0, new Error("boom"))).toBe(false);
  });
});

describe("createQueryClient", () => {
  it("never retries mutations, so a write is not repeated by accident", () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
});

describe("signInUrl", () => {
  it("redirects to the expired-session login unless already there", () => {
    expect(signInUrl("/cards")).toBe("/login?reason=session-expired");
    expect(signInUrl("/login")).toBeNull();
  });
});
