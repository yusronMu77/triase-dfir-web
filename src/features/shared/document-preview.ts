/** The preview uses first-party CSS; the original, hashed HTML remains the download artifact. */
export function documentPreview(html: string, stylesheet: string): string {
  // Remove known template blocks before parsing: even an inert DOMParser document reports
  // nonce-less styles to CSP. This is presentation normalization, not an HTML sanitizer;
  // the preview still requires the unchanged empty iframe sandbox.
  const withoutStyles = html.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "");
  const parsed = new DOMParser().parseFromString(withoutStyles, "text/html");
  // Inline template style blocks cannot satisfy the parent page's per-request CSP nonce.
  // Do not relax CSP or grant a nonce to server document markup.
  for (const style of parsed.querySelectorAll("style")) style.remove();
  const link = parsed.createElement("link");
  link.rel = "stylesheet";
  link.href = stylesheet;
  parsed.head.append(link);
  return `<!doctype html>\n${parsed.documentElement.outerHTML}`;
}
