<!-- astria-logo -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/astria-logo-reverse.svg">
    <img src=".github/assets/astria-logo.svg" alt="Astria" width="320">
  </picture>
</p>

# Astria web

Antarmuka dasbor Astria: page SSR, view CSR, layout CSR, dan hook (Next.js).

> Status: every screen reads and writes through the Astria api (`/api/v1`) with the cookie session; the sidebar and the actions follow the roles and permissions from `GET /auth/me`, and the server enforces them. No sample data remains in the screens. `/components` is a developer gallery with its own fixtures. Several screens depend on upstream services that are still incomplete; see "Known gaps".

## Tech stack

Next.js 16 (SSR standalone), React 19, TypeScript 6, Tailwind 4, Radix primitives via `@astria/ui`; Bun (utama) dan npm. TanStack Query 5 for server state.

## Run locally

From the workspace root, with both `ui/` and `web/` checked out:

```powershell
bun install --cwd ui --frozen-lockfile
bun install --cwd web --frozen-lockfile
bun run --cwd web dev
```

Open `http://localhost:3100/` for the home screen. The sidebar shows the menu of the signed-in role; the api enforces access.

| Route | Screen |
|---|---|
| `/login` | L0 Masuk |
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

`/components` shows all component categories. `/cards` demonstrates search, status tabs, band/asset filters and responsive cards; `/cards/[id]` demonstrates evidence links and detail panels. Unknown IDs show the not-found state from the api's 404.

Pages remain server components; `src/features/*/*.view.tsx` and `*.layout.tsx` own client interactions. Fonts, logo and mascot assets are local.

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

`test` launches the production build on port 3110 and checks the gallery, login and the real screens in Playwright. The api is replaced by route interception that lives only in `scripts/integration-check.mjs` (data, empty, error with retry, 403, 404, 401 redirect, role menu), with axe WCAG A/AA scans; it stops its server and browser. Against a live api, run the dev stack and open the app through Caddy. On Windows it uses installed Edge; elsewhere install Playwright Chromium first (`bunx playwright install chromium`). Override `ASTRIA_BROWSER_PATH` for another local Chromium binary, or `ASTRIA_TEST_URL` to test an already-running app.

Results and screenshots are written to ignored `.artifacts/`. The UI component tests run from `../ui`. Axe is an automated check, not a full accessibility certification or exact pixel comparison.

Login browser checks intercept API responses to exercise HTTP errors, invalid responses, duplicate submissions, loading, cookie handling and logout deterministically. They also check layout and axe at 1440, 1024, 768, 390 and 320 px. These checks do not replace a live login/logout check against the identity service.

## Content-Security-Policy

`src/proxy.ts` creates a fresh nonce per request and sets a strict CSP (`script-src 'self' 'nonce-…' 'strict-dynamic'`, no `unsafe-inline` or `unsafe-eval` for scripts in production) plus `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`. The root layout reads the nonce, so every page renders per request. The builder is `src/lib/content-security-policy.ts`.

```powershell
bun run build
bun run test:csp   # starts the server, opens 11 routes in Chromium, checks nonce, scripts and violations
```

`src/lib/preview-route-guard.ts` answers 404 for unknown preview IDs inside the proxy, because a dynamic layout streams a 200 before `notFound()` runs. Remove it when pages load data from services.

## Design and integration

Native Penpot HTML/CSS for 174 variants and all original token values are in `../ui/design-reference/`, exported before implementation. See `../ui/README.md` for component APIs, design mapping and behavior boundaries. `/components` is a developer preview route; restrict or exclude it when deploying the operational application. Integrate role enforcement, data queries and action handlers separately from the library.

### Api integration

| Layer | Where | Rule |
|---|---|---|
| HTTP client | `src/lib/http/api-client.ts`, `api-error.ts` | One `fetch` wrapper: JSON, same-origin cookies, 15 s timeout, request/response interceptors, errors normalized to `ApiError` (`kind`, `status`, `code`, `traceId`). No token is read or stored; a 401 clears the cache and returns to `/login?reason=session-expired`. |
| Services | `src/services/<domain>.service.ts` + `.types.ts` | Typed request, query and response shapes per domain. Components and hooks never call `fetch`. Bodies the api proxies untyped follow the upstream service code; uncertain fields are optional. |
| Server state | `src/lib/query/` (TanStack Query) | Retries only network errors, timeouts and 5xx (at most 2); never 4xx or mutations. Keys in `query-keys.ts`. |
| Live updates | `src/features/shell/use-live-updates.hook.ts` | `GET /stream` (SSE) invalidates cards, ingest jobs and digests; polling remains the fallback for jobs. |
| Screens | `use-*.hook.ts` + `*.view.tsx` | Every data screen shows loading, error with retry, empty and success through `QueryBoundary`. 403 and 404 say what happened and offer no retry. |

Configuration (`.env.example`): leave `NEXT_PUBLIC_API_BASE_URL` empty for same-origin calls through Caddy. Without Caddy, set `ASTRIA_API_ORIGIN` (server-side) and Next rewrites `/api/v1/*` to the api; the api's `ASTRIA_PUBLIC_ORIGIN` must equal the origin of the browser tab.

Known gaps (each is upstream, not in `web`; see `HANDOFF.md`):

- The api proxies ingest to `/svc/v1/ingest/jobs`, but the ingest service serves `/svc/v1/imports`; upload and job status return 404 until one side changes. `expected_sha256` is rejected by ingest (`extra="forbid"`).
- Handover (`/svc/v1/handover`) does not exist in `scheduler`; the screen reports it as unavailable.
- `GET /cards/{id}/evidence` reads `evidence`, but ingest returns `items` and `not_found`, so the evidence list is empty. `alerts:batch` does not exist in ingest.
- Gateway has no `/internal/v1/outbox`, `/identities` or `/channels/{id}/test`; the delivery log, channel bindings and channel test show "not available".
- The api has no list route for cases and no account management routes; `/cases` opens a case by ID and `/users` shows an explanation.
- The api turns every upstream 403 into `DILARANG`, so the web cannot tell "reauthentication needed" from "not allowed" and retries a secret write once after asking for the password.

### Login and session integration

Use the existing same-origin Caddy entry point at `http://localhost:8088` with the dev stack running: `/api/v1/*` goes to `api`, all other paths to `web`. Opening port 3100 directly provides the frontend only; login will report the missing API. The API's `ASTRIA_PUBLIC_ORIGIN` must match the browser origin if configured, as unsafe requests are protected by Origin checks. No browser-side service keys or cross-origin credential configuration are needed.

`src/lib/auth-api.ts` posts `{ username, password }` to `/api/v1/auth/login`, sends same-origin cookies, and bounds requests to 15 seconds. The API sets and revokes the HttpOnly `astria_session` cookie; tokens and passwords are never persisted in browser storage. HTTP errors, malformed responses, network failures and timeouts produce safe Indonesian messages. Login stays locked until navigation succeeds; failed requests can be retried. Logout calls `/api/v1/auth/logout` before navigating; an expired session (401) is already signed out.

`/login?reason=session-expired` renders the expired-session notice. The preview dashboard does not yet detect session expiration or enforce route access. Login validates the existing API's length limits; the design's “Minimal 12 karakter” hint describes password creation policy and deliberately does not reject shorter existing passwords before the backend checks them.

The layout follows `SCR-L0 Masuk` and `MOB-0 Masuk` in the checked-in Penpot source: 560/880 desktop columns at 1440 px, a 400 px form, 24 px section gaps, 6 px control radius, and 48 px mobile controls. Typography uses the source tokens (600 headings and 500 labels); exported Penpot PNGs can render those weights lighter, as recorded in the design handoff.

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
