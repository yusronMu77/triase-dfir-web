import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useIngestJob } from "./use-ingest-job.hook";

const file = (name: string, content = "{}") => new File([content], name, { type: "application/json" });

describe("useIngestJob", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useIngestJob(0));
    expect(result.current.state).toBe("idle");
    expect(result.current.file).toBeNull();
  });

  it("rejects a wrong extension and an empty file", () => {
    const { result } = renderHook(() => useIngestJob(0));
    act(() => result.current.select(file("alert.txt")));
    expect(result.current.state).toBe("error");
    expect(result.current.error).toMatch(/JSON atau JSONL/);
    act(() => result.current.select(file("alert.json", "")));
    expect(result.current.error).toMatch(/kosong/);
  });

  it("accepts a JSONL file and completes a simulated upload", async () => {
    const { result } = renderHook(() => useIngestJob(0));
    act(() => result.current.select(file("hayabusa.jsonl", "{}\n")));
    expect(result.current.state).toBe("ready");
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.state).toBe("success");
    expect(result.current.progress).toBe(100);
    expect(result.current.summary).toContain("hayabusa.jsonl");
  });

  it("resets to idle", () => {
    const { result } = renderHook(() => useIngestJob(0));
    act(() => result.current.select(file("a.json")));
    act(() => result.current.reset());
    expect(result.current.state).toBe("idle");
    expect(result.current.file).toBeNull();
  });
});
