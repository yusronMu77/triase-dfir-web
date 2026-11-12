import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { digestService } from "../../services/digest.service";
import { useDigestDocument } from "./use-digest-document.hook";

vi.mock("../../services/digest.service", () => ({ digestService: { document: vi.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

describe("useDigestDocument", () => {
  beforeEach(() => {
    vi.mocked(digestService.document).mockReset();
    URL.createObjectURL = vi.fn(() => "blob:digest-1");
    URL.revokeObjectURL = vi.fn();
  });

  it("does not request the document before the digest is published", () => {
    renderHook(() => useDigestDocument("DG-20261112-0700", false), { wrapper });
    expect(digestService.document).not.toHaveBeenCalled();
  });

  it("requests the document once published and exposes its object URL", async () => {
    vi.mocked(digestService.document).mockResolvedValue(new Blob(["<h1>Digest</h1>"], { type: "text/html" }));
    const { result } = renderHook(() => useDigestDocument("DG-20261112-0700", true), { wrapper });
    await waitFor(() => expect(result.current.url).toBe("blob:digest-1"));
    expect(digestService.document).toHaveBeenCalledWith("DG-20261112-0700", expect.any(AbortSignal));
  });
});
