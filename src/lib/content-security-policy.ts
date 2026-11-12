/** Per-request Content-Security-Policy and security headers. Pure, so unit tests need no Next runtime. */

export type SecurityHeaderOptions = {
  nonce: string;
  /** Next.js dev mode needs `eval` for React's debug stacks and refresh. Never allowed in production. */
  development?: boolean;
};

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

export function buildContentSecurityPolicy({ nonce, development = false }: SecurityHeaderOptions): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (development) scriptSrc.push("'unsafe-eval'");
  // The Next.js dev overlay injects <style> elements without a nonce. A nonce makes browsers ignore
  // 'unsafe-inline', so dev drops it; production keeps the nonce-only policy.
  const styleSrc = development ? ["'self'", "'unsafe-inline'"] : ["'self'", `'nonce-${nonce}'`];
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", scriptSrc],
    ["style-src", styleSrc],
    // React renders `style={{...}}` as style attributes, which cannot carry a nonce. Scripts stay nonce-only.
    ["style-src-attr", ["'unsafe-inline'"]],
    ["img-src", ["'self'", "data:"]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'"]],
    // Server documents (digest, case report) are fetched as a Blob and shown in a sandboxed iframe without
    // `allow-scripts`. Without this, `default-src 'self'` blocks the blob: frame. Nothing else may be framed.
    ["frame-src", ["blob:"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];
  return directives.map(([name, values]) => `${name} ${values.join(" ")}`).join("; ");
}

/** Headers for the response. The CSP also goes on the request so Next.js stamps its own scripts with the nonce. */
export function buildSecurityHeaders(options: SecurityHeaderOptions): Record<string, string> {
  return {
    "Content-Security-Policy": buildContentSecurityPolicy(options),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  };
}
