/**
 * Status 404 untuk ID tak dikenal pada pratinjau.
 *
 * Root layout membaca `headers()` (nonce CSP), jadi semua rute dirender dinamis dan `dynamicParams = false` tidak
 * lagi menolak ID sebelum streaming: halaman "tidak ditemukan" keluar dengan status 200. Penjaga ini dijalankan di
 * `proxy.ts`, sebelum render, dan menjawab 404. Hapus bila data datang dari layanan (halaman detail memuat data
 * dulu, lalu `notFound()` dengan boundary yang tepat).
 */
import { cases } from "../data/cases";
import { digests } from "../data/digests";
import { queueItems } from "../data/fixtures";

const KNOWN: Array<[prefix: string, ids: ReadonlySet<string>]> = [
  ["/cards/", new Set(queueItems.map((row) => row.id))],
  ["/digests/", new Set(digests.map((row) => row.id))],
  ["/cases/", new Set(cases.map((row) => row.id))],
];

export function isUnknownPreviewRoute(pathname: string): boolean {
  for (const [prefix, ids] of KNOWN) {
    if (!pathname.startsWith(prefix)) continue;
    const rest = pathname.slice(prefix.length).replace(/\/$/, "");
    if (rest.length === 0 || rest.includes("/")) return false; // bukan rute detail satu segmen
    return !ids.has(decodeURIComponent(rest));
  }
  return false;
}
