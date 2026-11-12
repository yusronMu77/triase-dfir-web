import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import { useDocumentBlob } from "./use-document-blob.hook";

const createObjectURL = vi.fn<(blob: Blob) => string>();
const revokeObjectURL = vi.fn<(url: string) => void>();

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

describe("useDocumentBlob", () => {
  beforeEach(() => {
    createObjectURL.mockReset().mockReturnValue("blob:fake-1");
    revokeObjectURL.mockReset();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });
  afterEach(() => vi.restoreAllMocks());

  it("does not fetch while disabled", () => {
    const fetcher = vi.fn(async () => new Blob(["<p>x</p>"]));
    const { result } = renderHook(
      () => useDocumentBlob({ queryKey: ["test", "doc", "a"], fetcher, enabled: false }),
      { wrapper },
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.url).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("turns the fetched blob into an object URL", async () => {
    const fetcher = vi.fn(async () => new Blob(["<p>x</p>"], { type: "text/html" }));
    const { result } = renderHook(
      () => useDocumentBlob({ queryKey: ["test", "doc", "b"], fetcher, enabled: true }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.url).toBe("blob:fake-1"));
    expect(fetcher).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("revokes the object URL on unmount", async () => {
    const fetcher = async () => new Blob(["<p>x</p>"]);
    const { result, unmount } = renderHook(
      () => useDocumentBlob({ queryKey: ["test", "doc", "c"], fetcher, enabled: true }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.url).toBe("blob:fake-1"));
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-1");
  });

  it("surfaces the error with the ApiError so the caller can explain it", async () => {
    const fetcher = async () => {
      throw new ApiError("", 409, "DIGEST_BELUM_TERBIT");
    };
    const { result } = renderHook(
      () => useDocumentBlob({ queryKey: ["test", "doc", "d"], fetcher, enabled: true }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.url).toBeNull();
  });
});
