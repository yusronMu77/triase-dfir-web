import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CASE_ID_HINT } from "./case.mapper";
import { useCaseLookup } from "./use-case-lookup.hook";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("useCaseLookup", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("opens a valid case ID, normalised to upper case", () => {
    const { result } = renderHook(() => useCaseLookup());
    act(() => result.current.setValue("  cs-20261112-001 "));
    act(() => result.current.submit());
    expect(push).toHaveBeenCalledWith("/cases/CS-20261112-001");
    expect(result.current.error).toBe("");
  });

  it("explains the expected format and does not navigate for an invalid ID", () => {
    const { result } = renderHook(() => useCaseLookup());
    act(() => result.current.setValue("IC-20261112-001"));
    act(() => result.current.submit());
    expect(push).not.toHaveBeenCalled();
    expect(result.current.error).toBe(CASE_ID_HINT);
  });

  it("clears the error once the analyst edits the field", () => {
    const { result } = renderHook(() => useCaseLookup());
    act(() => result.current.submit());
    expect(result.current.error).not.toBe("");
    act(() => result.current.setValue("CS-"));
    expect(result.current.error).toBe("");
  });
});
