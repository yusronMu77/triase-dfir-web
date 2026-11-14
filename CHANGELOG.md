# Changelog

## [Unreleased]

### Added

- Detail kartu: bagian "Narasi dan klaim" dari `dokumen.model` (hipotesis utama, klaim dengan chip ID bukti, hipotesis tandingan, belum diketahui) dan lencana status pemeriksa `LULUS`/`SEBAGIAN`/`TEMPLAT` dengan penjelasan masing-masing; `TEMPLAT` menampilkan keadaan kosong, bukan narasi. Sebelumnya narasi tidak ditampilkan sama sekali.
- Detail kasus DFIR: bagian "Rantai custody" dari `GET /cases/{id}/custody` (nomor, waktu, aktor, aksi, artefak, SHA-256, hash entri) dengan putusan `chain_ok` dari dfir; web tidak menghitung ulang rantai.
- WhatsApp bot card on the channels page (admin): link status with the masked number, the QR to scan while unlinked (polled every 5 seconds, every 30 seconds once linked), and unlinking after a confirmation dialog. Uses `GET /channels/whatsapp/link` and `POST /channels/whatsapp/link/logout`; hidden when the gateway has no WhatsApp bridge (404).
- Screens L0-L9 and the admin pages (login, home, digests, handover, upload, metrics, DFIR cases, configuration, channels, identities, deliveries, settings, users, audit) in feature folders, with loading, error and not-found boundaries.
- Vitest hook tests and architecture tests (`test:unit`, `test:arch`; run under bun and npm).
- TEMPLATE marker on card and case detail (narration from template, not a model).

### Fixed

- Detail kartu: galat React "two children with the same key" bila satu teknik ATT&CK punya beberapa taktik (data nyata: T1053.005); kunci chip kini teknik + taktik.
- `/handover`, `/cases` (and `/cases/[id]`) and `/users` show "Akses ditolak" instead of the screen when the session lacks `handover`, `cases:read` or `identities:admin`. The guard reads the permissions from `GET /auth/me` in the shell layout (`features/session/route-access.ts`), so it also covers screens that make no api call on load; the sidebar drops entries the guard would refuse (web#15).
- Responses no longer name the server stack: `poweredByHeader: false` removes `X-Powered-By: Next.js` (e2e WEB-DEMO-002).

### Changed

- UI wording reads as natural Indonesian: common technical terms stay in English (feedback, true/false positive, anchor, hash chain, secret, file, env var, database, template, timeline, error, hex, scan QR) instead of literal translations (umpan balik, salah positif, jangkar, rantai, rahasia, berkas, variabel lingkungan, basis data, templat, linimasa, galat, heksadesimal, pindai). Identity bindings read as linked accounts; "Sesimu" becomes "Sesi Anda".
- The component gallery moved from `/` to `/components`; `/` is now the home screen. Queue state moved into `use-card-queue.hook.ts`.

### Added (earlier)

- Next.js component showcase at `/components`, responsive queue at `/cards`, and evidence-linked card detail examples.
- Direct shared `ui/` source integration, local IBM Plex fonts and 12 original mascot images.
- Playwright desktop/tablet/mobile interaction checks and axe accessibility scans with local screenshots.

- Favicon, ikon aplikasi (180, 192, 512), dan logo Astria di `public/` (lokal, tanpa CDN).
- Logo Astria di kepala README (`.github/assets/`, dari kit logo di repo `triase-dfir-uiux`).
