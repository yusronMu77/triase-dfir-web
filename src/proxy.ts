import { type NextRequest, NextResponse } from "next/server";
import { buildSecurityHeaders, createNonce } from "./lib/content-security-policy";

/** Next 16 proxy (formerly middleware): sets a fresh nonce CSP on every page request. */
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const headers = buildSecurityHeaders({ nonce, development: process.env.NODE_ENV === "development" });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", headers["Content-Security-Policy"]);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
}

export const config = {
  matcher: [{ source: "/((?!api|_next/static|_next/image|favicon.ico|.*.(?:png|svg|ico|webp|woff2?)$).*)" }],
};
