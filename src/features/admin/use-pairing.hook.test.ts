import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makePairingCode, usePairing } from "./use-pairing.hook";

describe("makePairingCode", () => {
  it("builds AST-XXXX-XXXX from a safe alphabet", () => {
    expect(makePairingCode(() => 0)).toBe("AST-AAAA-AAAA");
    expect(makePairingCode(() => 0.999)).toMatch(/^AST-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(makePairingCode()).not.toMatch(/[01IO]/);
  });
});

describe("usePairing", () => {
  it("keeps the initial code, then regenerates with a new expiry", () => {
    const { result } = renderHook(() =>
      usePairing(
        { code: "AST-OLD1-OLD2", expiresAt: "2000-01-01T00:00:00Z" },
        () => Date.UTC(2026, 10, 10),
        60_000,
      ),
    );
    expect(result.current.code).toBe("AST-OLD1-OLD2");
    act(() => result.current.regenerate());
    expect(result.current.code).not.toBe("AST-OLD1-OLD2");
    expect(result.current.expiresAt).toBe("2026-11-10T00:01:00.000Z");
  });
});
