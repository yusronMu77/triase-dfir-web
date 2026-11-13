# Changelog

## [Unreleased]

### Added

- WhatsApp bot card on the channels page (admin): link status with the masked number, the QR to scan while unlinked (polled every 5 seconds, every 30 seconds once linked), and unlinking after a confirmation dialog. Uses `GET /channels/whatsapp/link` and `POST /channels/whatsapp/link/logout`; hidden when the gateway has no WhatsApp bridge (404).
- Screens L0-L9 and the admin pages (login, home, digests, handover, upload, metrics, DFIR cases, configuration, channels, identities, deliveries, settings, users, audit) in feature folders, with loading, error and not-found boundaries.
- Vitest hook tests and architecture tests (`test:unit`, `test:arch`; run under bun and npm).
- TEMPLATE marker on card and case detail (narration from template, not a model).

### Changed

- UI wording reads as natural Indonesian: common technical terms stay in English (feedback, true/false positive, anchor, hash chain, secret, file, env var, database, template, timeline, error, hex, scan QR) instead of literal translations (umpan balik, salah positif, jangkar, rantai, rahasia, berkas, variabel lingkungan, basis data, templat, linimasa, galat, heksadesimal, pindai). Identity bindings read as linked accounts; "Sesimu" becomes "Sesi Anda".
- The component gallery moved from `/` to `/components`; `/` is now the home screen. Queue state moved into `use-card-queue.hook.ts`.

### Added (earlier)

- Next.js component showcase at `/components`, responsive queue at `/cards`, and evidence-linked card detail examples.
- Direct shared `ui/` source integration, local IBM Plex fonts and 12 original mascot images.
- Playwright desktop/tablet/mobile interaction checks and axe accessibility scans with local screenshots.

- Favicon, ikon aplikasi (180, 192, 512), dan logo Astria di `public/` (lokal, tanpa CDN).
- Logo Astria di kepala README (`.github/assets/`, dari kit logo di repo `triase-dfir-uiux`).
