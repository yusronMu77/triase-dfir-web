<!-- astria-logo -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/astria-logo-reverse.svg">
    <img src=".github/assets/astria-logo.svg" alt="Astria" width="320">
  </picture>
</p>

# Astria web

Antarmuka dasbor Astria: page SSR, view CSR, layout CSR, dan hook (Next.js).

> Status: runnable component showcase and responsive queue/detail examples based on the Astria Penpot design. Uses the shared library in sibling `ui/`. Data and actions are explicitly local previews; backend integration and authentication are not implemented here.

## Tech stack

Next.js 16 (SSR standalone), React 19, TypeScript 6, Tailwind 4, Radix primitives via `@astria/ui`; Bun (utama) dan npm. TanStack Query can be added when service integration begins.

## Run locally

From the workspace root, with both `ui/` and `web/` checked out:

```powershell
bun install --cwd ui --frozen-lockfile
bun install --cwd web --frozen-lockfile
bun run --cwd web dev
```

Open `http://localhost:3100/components` (also `/`) for all component categories. `/cards` demonstrates search, status tabs, band/asset filters and responsive cards; `/cards/[id]` demonstrates evidence links and detail panels. Unknown card IDs return 404. Form saves, upload progression and chat messages are local simulations and never call an external service.

Pages remain server components; `src/views/*.view.tsx` and `src/layouts/*.layout.tsx` own client interactions. Data fixtures are isolated in `src/data/fixtures.ts`. Fonts, logo and mascot assets are local.

The TypeScript `@astria/ui` alias resolves directly to `../ui/src`; CSS imports the sibling stylesheet. This avoids Windows Bun `file:` dependency copying failures and gives live component updates. Next's root and tracing settings include both siblings. React is resolved to web's installation to keep a single runtime. Do not install a second copied `@astria/ui` into web.

For npm, install in each sibling using `npm install --package-lock=false`, then use `npm run dev`. Only Bun lockfiles are tracked.

## Checks

```powershell
bun run typecheck
bun run check
bun run build
bun run test
```

`test` launches the production build on port 3110, checks desktop/tablet/mobile behavior in Playwright, runs axe WCAG A/AA scans across all gallery categories and queue widths, and stops its server/browser. On Windows it uses installed Edge; elsewhere install Playwright Chromium first (`bunx playwright install chromium`). Override `ASTRIA_BROWSER_PATH` for another local Chromium binary, or `ASTRIA_TEST_URL` to test an already-running app.

Results and screenshots are written to ignored `.artifacts/`. The UI component tests run from `../ui`. Axe is an automated check, not a full accessibility certification or exact pixel comparison.

## Design and integration

Native Penpot HTML/CSS for 174 variants and all original token values are in `../ui/design-reference/`, exported before implementation. See `../ui/README.md` for component APIs, design mapping and behavior boundaries. `/components` is a developer preview route; restrict or exclude it when deploying the operational application. Integrate real auth, role enforcement, data queries and action handlers separately from the library.

## Ikon dan logo

Berkas di `public/` disalin dari kit logo di repo `triase-dfir-uiux` (`assets/astria/`); ubah di sana dulu, lalu salin ulang.

| Berkas | Pakai untuk |
|---|---|
| `favicon.ico` | Favicon (16, 32, 48 px) |
| `apple-touch-icon.png` | Ikon layar utama iOS (180 px) |
| `icon-192.png`, `icon-512.png` | Ikon manifest PWA |
| `astria-mark.svg` | Simbol saja; di bawah lebar 140 px |
| `astria-logo.svg`, `astria-logo-reverse.svg` | Logo lengkap untuk latar terang dan latar navy |

Ikon dan favicon disajikan lokal, tanpa CDN (lihat note web).

## Bun dan npm

Bun dipakai sebagai pengelola paket utama (`bun.lock` di repo ini). npm tetap didukung: skrip di `package.json`
tidak memakai API khusus Bun, jadi perintah yang sama berjalan di keduanya.

| Tujuan | Bun (utama) | npm (didukung) |
|---|---|---|
| Pasang dependensi | `bun install --frozen-lockfile` | `npm install` |
| Jalankan skrip | `bun run <skrip>` | `npm run <skrip>` |

Hanya `bun.lock` yang di-commit; `package-lock.json` tidak. Jangan menaruh kode yang hanya jalan di Bun (`Bun.*`,
`bun:test`) di skrip atau tes repo ini.

## Alur git

Branch `{type}/{yyyyMMdd}-{taskId}-{nama}`; commit `{type}({yyyyMMddHHmm}): [{taskId}] {pesan}`, satu baris, tanpa trailer. `main` hanya berubah lewat pull request (merge rebase); jangan push langsung ke `main` dan jangan `--no-verify`.
