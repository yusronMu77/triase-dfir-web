// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, buildSecurityHeaders, createNonce } from "./content-security-policy";

const directive = (policy: string, name: string) =>
  policy
    .split("; ")
    .find((d) => d.startsWith(`${name} `))
    ?.slice(name.length + 1);

describe("content security policy", () => {
  it("creates a different base64 nonce for every call", () => {
    const [a, b] = [createNonce(), createNonce()];
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/=]{20,}$/);
  });

  it("allows scripts only from self, the nonce and strict-dynamic, with no eval or inline in production", () => {
    const policy = buildContentSecurityPolicy({ nonce: "abc" });
    expect(directive(policy, "script-src")).toBe("'self' 'nonce-abc' 'strict-dynamic'");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("allows inline style attributes only, never inline style elements or scripts", () => {
    const policy = buildContentSecurityPolicy({ nonce: "abc" });
    expect(directive(policy, "style-src")).toBe("'self' 'nonce-abc'");
    expect(directive(policy, "style-src-attr")).toBe("'unsafe-inline'");
    expect(directive(policy, "script-src")).not.toContain("unsafe-inline");
  });

  it("lets the Next.js dev overlay inject styles in development only", () => {
    const dev = buildContentSecurityPolicy({ nonce: "abc", development: true });
    expect(directive(dev, "style-src")).toBe("'self' 'unsafe-inline'");
    expect(directive(dev, "script-src")).not.toContain("unsafe-inline");
    expect(directive(buildContentSecurityPolicy({ nonce: "abc" }), "style-src")).not.toContain(
      "unsafe-inline",
    );
  });

  it("frames blob: documents only, so the sandboxed document viewer works", () => {
    const policy = buildContentSecurityPolicy({ nonce: "abc" });
    expect(directive(policy, "frame-src")).toBe("blob:");
    expect(directive(policy, "frame-ancestors")).toBe("'none'");
  });

  it("allows eval only in development", () => {
    expect(
      directive(buildContentSecurityPolicy({ nonce: "abc", development: true }), "script-src"),
    ).toContain("'unsafe-eval'");
  });

  it("locks down objects, base, forms, framing and remote origins", () => {
    const policy = buildContentSecurityPolicy({ nonce: "abc" });
    expect(directive(policy, "default-src")).toBe("'self'");
    expect(directive(policy, "object-src")).toBe("'none'");
    expect(directive(policy, "base-uri")).toBe("'self'");
    expect(directive(policy, "form-action")).toBe("'self'");
    expect(directive(policy, "frame-ancestors")).toBe("'none'");
    expect(directive(policy, "connect-src")).toBe("'self'");
    expect(policy).not.toMatch(/https?:|\*/);
  });

  it("adds the other security headers", () => {
    const headers = buildSecurityHeaders({ nonce: "abc" });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Content-Security-Policy"]).toContain("'nonce-abc'");
  });
});
