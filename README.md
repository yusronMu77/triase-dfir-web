<!-- astria-logo -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/astria-logo-reverse.svg">
    <img src=".github/assets/astria-logo.svg" alt="Astria" width="320">
  </picture>
</p>

# Astria web

Antarmuka dasbor Astria: page SSR, view CSR, layout CSR, dan hook (Next.js).

> Status: all screens of the Astria design run as a local preview (login, home, queue and card detail, digests, handover, upload, metrics, DFIR cases, admin pages, audit) plus the `/components` gallery. They use the shared library in sibling `ui/`. Data and actions are explicitly local previews; backend integration, real sign-in and server-side role checks are not implemented here.

## Tech stack

Next.js 16 (SSR standalone), React 19, TypeScript 6, Tailwind 4, Radix primitives via `@astria/ui`; Bun (utama) dan npm. TanStack Query can be added when service integration begins.

## Run locally

From the workspace root, with both `ui/` and `web/` checked out:

```powershell
bun install --cwd ui --frozen-lockfile
bun install --cwd web --frozen-lockfile
bun run --cwd web dev
```

Open `http://localhost:3100/` for the home screen. The role selector in the top bar ("Peran pratinjau") only changes the sidebar menu; it is not access control.

| Route | Screen |
|---|---|
| `/login` | L0 Masuk (credentials are not checked) |
| `/` | L1 Beranda |
| `/cards`, `/cards/[id]` | L2 Antrean and card detail |
| `/digests`, `/digests/[id]` | L3 Digest |
| `/handover` | L4 Serah terima |
| `/upload` | L5 Unggah alert |
| `/metrics` | L6 Metrik |
| `/configuration`, `/channels`, `/settings`, `/identities`, `/deliveries`, `/users` | L7 Konfigurasi and admin pages |
| `/cases`, `/cases/[id]` | L8 Kasus DFIR |
| `/audit` | L9 Audit |
| `/components` | Developer component gallery |

`/components` shows all component categories. `/cards` demonstrates search, status tabs, band/asset filters and responsive cards; `/cards/[id]` demonstrates evidence links and detail panels. Unknown card IDs return 404. Form saves, upload progression and chat messages are local simulations and never call an external service.

Pages remain server components; `src/views/*.view.tsx` and `src/layouts/*.layout.tsx` own client interactions. Data fixtures are isolated in `src/data/fixtures.ts`. Fonts, logo and mascot assets are local.

The TypeScript `@astria/ui` alias resolves directly to `../ui/src`; CSS imports the sibling stylesheet. This avoids Windows Bun `file:` dependency copying failures and gives live component updates. Next's root and tracing settings include both siblings. React is resolved to web's installation to keep a single runtime. Do not install a second copied `@astria/ui` into web.

For npm, install in each sibling using `npm install --package-lock=false`, then use `npm run dev`. Only Bun lockfiles are tracked.

## Structure

`src/app/` holds routing only: server `page.tsx`, `loading.tsx`, `not-found.tsx`, and `error.tsx` (the one client file). Each feature folder in `src/features/` holds its `*.view.tsx` (client, no logic), `*.layout.tsx` and `use-*.hook.ts` (state and actions, each with a sibling `*.test.ts`). Views never call React or Next hooks directly. `tests/architecture.test.ts` enforces this, plus kebab-case file names, a page for every sidebar link, boundaries for the app group and each dynamic segment, no `dangerouslySetInnerHTML`, and no Mode juri.

## Checks

```powershell
bun run typecheck
bun run check
bun run test:unit
bun run build
bun run test
```

`test:unit` runs Vitest (hook tests and the architecture tests) and works the same with `npm run test:unit`. `test:arch` runs only the architecture tests.

`test` launches the production build on port 3110, checks desktop/tablet/mobile behavior in Playwright, runs axe WCAG A/AA scans across all gallery categories, the queue widths and every screen, exercises the login, handover, upload, metrics, channel test and audit flows, and stops its server/browser. On Windows it uses installed Edge; elsewhere install Playwright Chromium first (`bunx playwright install chromium`). Override `ASTRIA_BROWSER_PATH` for another local Chromium binary, or `ASTRIA_TEST_URL` to test an already-running app.

Results and screenshots are written to ignored `.artifacts/`. The UI component tests run from `../ui`. Axe is an automated check, not a full accessibility certification or exact pixel comparison.

## Content-Security-Policy

`src/proxy.ts` creates a fresh nonce per request and sets a strict CSP (`script-src 'self' 'nonce-…' 'strict-dynamic'`, no `unsafe-inline` or `unsafe-eval` for scripts in production) plus `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`. The root layout reads the nonce, so every page renders per request. The builder is `src/lib/content-security-policy.ts`.

```powershell
bun run build
bun run test:csp   # starts the server, opens 11 routes in Chromium, checks nonce, scripts and violations
```

`src/lib/preview-route-guard.ts` answers 404 for unknown preview IDs inside the proxy, because a dynamic layout streams a 200 before `notFound()` runs. Remove it when pages load data from services.

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
