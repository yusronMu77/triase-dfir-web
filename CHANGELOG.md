# Changelog

## [Unreleased]

### Added

- Screens L0-L9 and the admin pages (login, home, digests, handover, upload, metrics, DFIR cases, configuration, channels, identities, deliveries, settings, users, audit) in feature folders, with loading, error and not-found boundaries.
- Vitest hook tests and architecture tests (`test:unit`, `test:arch`; run under bun and npm).
- TEMPLATE marker on card and case detail (narration from template, not a model).

### Changed

- The component gallery moved from `/` to `/components`; `/` is now the home screen. Queue state moved into `use-card-queue.hook.ts`.

### Added (earlier)

- Next.js component showcase at `/components`, responsive queue at `/cards`, and evidence-linked card detail examples.
- Direct shared `ui/` source integration, local IBM Plex fonts and 12 original mascot images.
- Playwright desktop/tablet/mobile interaction checks and axe accessibility scans with local screenshots.

- Favicon, ikon aplikasi (180, 192, 512), dan logo Astria di `public/` (lokal, tanpa CDN).
- Logo Astria di kepala README (`.github/assets/`, dari kit logo di repo `triase-dfir-uiux`).
