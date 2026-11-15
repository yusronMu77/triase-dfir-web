import { describe, expect, it } from "vitest";
import { documentPreview } from "./document-preview";

describe("sandboxed document presentation", () => {
  it("replaces inline template CSS with first-party CSS without changing document text", () => {
    const source =
      '<html lang="id"><head><title>Digest</title><style>body{color:red}</style></head><body><h1>Digest DG-1</h1><p>EV-123 &amp; bukti</p></body></html>';
    const preview = new DOMParser().parseFromString(
      documentPreview(source, "https://astria.test/document-preview.css"),
      "text/html",
    );
    expect(preview.querySelectorAll("style")).toHaveLength(0);
    expect(preview.querySelector('link[rel="stylesheet"]')?.getAttribute("href")).toBe(
      "https://astria.test/document-preview.css",
    );
    expect(preview.body.textContent).toBe("Digest DG-1EV-123 & bukti");
    expect(preview.documentElement.lang).toBe("id");
    expect(preview.querySelector("[nonce]")).toBeNull();
    expect(source).toContain("<style>");
  });
});
