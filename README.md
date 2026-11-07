<!-- astria-logo -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/astria-logo-reverse.svg">
    <img src=".github/assets/astria-logo.svg" alt="Astria" width="320">
  </picture>
</p>

# Astria web

Antarmuka dasbor Astria: page SSR, view CSR, layout CSR, dan hook (Next.js).

> Status: kerangka awal, belum ada kode. Repo ini adalah submodule dari workspace `triase-dfir` (folder `web/`). Rancangan: `notes/2026-11-06-triase-dfir-app-web.md` di repo root. Lajur developer: 3.

## Tech stack

Next.js 16 (SSR standalone), React 19, TypeScript 6, Tailwind 4, shadcn + Radix, TanStack Query; Bun (utama) dan npm

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
