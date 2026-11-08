import type { Metadata } from "next";
import { headers } from "next/headers";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Astria",
  description: "Asisten triase insiden dan DFIR. Pratinjau antarmuka dengan data contoh.",
};
/** Rendered per request: the nonce CSP from proxy.ts only works on dynamic pages (Next stamps scripts with the nonce). */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="id">
      <body>
        {/* react-style-singleton (Radix Dialog) injects a <style> and reads its nonce from this global. */}
        {nonce ? (
          <script nonce={nonce}>{`globalThis.__webpack_nonce__=${JSON.stringify(nonce)};`}</script>
        ) : null}
        {children}
      </body>
    </html>
  );
}
