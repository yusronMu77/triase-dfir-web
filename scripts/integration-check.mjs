import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

/**
 * Browser contract checks of the real screens against a mocked `/api/v1` (Playwright route interception).
 * The mock lives only in this script; the application code contains no sample data.
 * These checks do not replace a run against the live api (see README, "Live integration").
 */
const card = (id, patch = {}) => ({
  card_id: id,
  judul: `Dugaan pengambilalihan akun ${id}`,
  pola: 'P-AKUN',
  band: 'KRITIS',
  skor: 71,
  status: 'baru',
  prioritas: 'P1',
  prioritas_sumber: 'band',
  pemilik: null,
  kesimpulan: null,
  label: [],
  status_verifikasi: 'LULUS',
  versi: 1,
  row_version: 1,
  tanggapan_awal_target: '2026-11-12T10:00:00Z',
  tanggapan_awal_at: null,
  terlambat: false,
  dibuat_pada: '2026-11-12T08:00:00Z',
  diperbarui_pada: '2026-11-12T08:00:00Z',
  ...patch,
});

const sessions = {
  analis: { user_id: 'usr_analis', roles: ['analis'], permissions: ['session', 'stream:read', 'cards:read', 'cards:write', 'cards:deep_dive', 'metrics:read', 'digests:read', 'identities:own', 'handover', 'ingest:read', 'ingest:write'] },
  admin: { user_id: 'usr_admin', roles: ['admin'], permissions: ['session', 'stream:read', 'audit:read', 'audit:verify', 'config:read', 'config:write', 'channels:admin', 'metrics:read', 'digests:read', 'digests:run', 'identities:own', 'identities:admin', 'ingest:read', 'ingest:write'] },
};

const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
const fail = (route, status, code) => json(route, { error: { code, message: code } }, status);

/** `overrides` maps "METHOD /path" to a function (route, request) or a fixed [status, body] pair. */
export async function mockApi(context, role, overrides = {}) {
  await context.route('**/api/v1/**', async (route, request) => {
    const url = new URL(request.url());
    const key = `${request.method()} ${url.pathname.replace('/api/v1', '')}`;
    const override = overrides[key];
    if (typeof override === 'function') return override(route, request);
    if (override) return json(route, override[1], override[0]);
    if (key === 'GET /stream') return route.fulfill({ status: 200, contentType: 'text/event-stream', body: ': ping\n\n' });
    if (key === 'GET /health') return json(route, { status: 'hijau', layanan: {}, audit_tertunda: 0 });
    if (key === 'GET /auth/me') return json(route, sessions[role]);
    if (key === 'POST /auth/logout') return route.fulfill({ status: 204 });
    if (key === 'GET /cards') return json(route, { items: [card('IC-20261112-001'), card('IC-20261112-002', { band: 'TINGGI', skor: 54 })], next_cursor: null });
    if (key.startsWith('GET /cards/IC-20261112-001') && !key.endsWith('/evidence')) {
      return json(route, { ...card('IC-20261112-001'), kesimpulan_catatan: null, rule_ids: [], dokumen: { kode: { skor: 71, band: 'KRITIS' } }, aktivitas: [], penjelas: null, katalog: null, bagian_tidak_tersedia: [] });
    }
    if (key === 'GET /cards/IC-20261112-001/evidence') return json(route, { card_id: 'IC-20261112-001', evidence: [], tidak_ditemukan: [] });
    if (key === 'GET /metrics') return json(route, { dari: null, sampai: null, total: 142, per_status: { baru: 10 }, per_band: { KRITIS: 6, TINGGI: 38, SEDANG: 61, RENDAH: 37 }, per_prioritas: {}, sla_terlanggar: 10, umpan_balik: {} });
    if (key === 'GET /digests') return json(route, { items: [{ digest_id: 'DG-20261111', jenis: 'harian', periode: '2026-11-11', periode_mulai: null, periode_selesai: null, status: 'terbit', terlambat: false }], next_cursor: null });
    if (key === 'GET /digests/DG-20261111') {
      return json(route, { digest_id: 'DG-20261111', jenis: 'harian', periode: '2026-11-11', periode_mulai: null, periode_selesai: null, status: 'terbit', terlambat: false, terlambat_menit: null, dijadwalkan_pada: null, dijalankan_pada: null, percobaan: 1, mode_narasi: 'templat', sha256: 'b'.repeat(64), versi_templat: 'digest-harian-1' });
    }
    // Like scheduler's document: a standalone page with an inline <style>, served as text/html.
    if (key === 'GET /digests/DG-20261111/document') {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><style>p{color:#112c3b}</style></head><body><p>Isi dokumen uji</p></body></html>' });
    }
    if (key === 'GET /config') return json(route, { items: [{ key: 'chat.allow_t2', value: false, source: 'bawaan', version: 0 }] });
    if (key === 'GET /audit') return json(route, { items: [{ seq: 1, ts: '2026-11-12T01:00:00Z', actor: 'usr_admin', actor_type: 'user', action: 'config.setting_write', target_type: 'setting', target_id: 'chat.allow_t2', entry_hash: 'a'.repeat(64), prev_hash: '0'.repeat(64) }], next_from_seq: null });
    return fail(route, 404, 'TIDAK_DITEMUKAN');
  });
}

async function open(browser, role, overrides) {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  await mockApi(context, role, overrides);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  return { context, page, errors };
}

export async function checkIntegration(browser, baseURL) {
  const sidebar = (page) => page.locator('.a-desktop-sidebar');

  // 1. Analyst: queue, detail, metrics, role-based menu, accessibility.
  {
    const { context, page, errors } = await open(browser, 'analis');
    await page.goto(`${baseURL}/cards`);
    await expect(page.getByText('IC-20261112-001').first()).toBeVisible();
    await expect(page.getByText('IC-20261112-002').first()).toBeVisible();
    await expect(sidebar(page).getByRole('link', { name: 'Audit', exact: true })).toHaveCount(0);
    const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations;
    expect(violations.map((v) => v.id)).toEqual([]);
    await page.goto(`${baseURL}/cards/IC-20261112-001`);
    await expect(page.getByRole('heading', { name: /IC-20261112-001/ }).first()).toBeVisible();
    await page.goto(`${baseURL}/metrics`);
    await expect(page.getByText('142', { exact: true }).first()).toBeVisible();
    expect(errors).toEqual([]);

    // The document viewer shows server HTML in a sandboxed blob: iframe; the CSP must let it load (frame-src).
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    await page.goto(`${baseURL}/digests/DG-20261111`);
    await expect(page.frameLocator('iframe[title^="Dokumen"]').getByText('Isi dokumen uji')).toBeVisible();
    const frameViolations = (await page.evaluate(() => window.__cspViolations)).filter((v) => v.startsWith('frame-src'));
    expect(frameViolations).toEqual([]);
    await context.close();
  }

  // 2. Administrator: audit log and the admin menu.
  {
    const { context, page } = await open(browser, 'admin');
    await page.goto(`${baseURL}/audit`);
    await expect(page.getByText('config.setting_write').first()).toBeVisible();
    await expect(sidebar(page).getByRole('link', { name: 'Audit', exact: true })).toBeVisible();
    await context.close();
  }

  // 3. Empty, error with retry, forbidden, not found.
  {
    let broken = true; // the query retries a 503 twice before showing the error, so keep failing until the click
    const { context, page } = await open(browser, 'analis', {
      'GET /cards': (route) => (broken ? fail(route, 503, 'LAYANAN_TIDAK_TERSEDIA') : json(route, { items: [], next_cursor: null })),
    });
    await page.goto(`${baseURL}/cards`);
    await expect(page.locator('.a-alert')).toContainText('Layanan belum dapat dijangkau', { timeout: 15000 });
    broken = false;
    await page.getByRole('button', { name: 'Coba lagi' }).click();
    await expect(page.locator('.a-alert')).toHaveCount(0);
    await expect(page.locator('.a-empty').first()).toBeVisible();
    await context.close();
  }
  {
    const { context, page } = await open(browser, 'analis', { 'GET /cards': (route) => fail(route, 403, 'DILARANG') });
    await page.goto(`${baseURL}/cards`);
    await expect(page.locator('.a-alert')).toContainText('Akses ditolak');
    await expect(page.getByRole('button', { name: 'Coba lagi' })).toHaveCount(0);
    await context.close();
  }
  {
    const { context, page } = await open(browser, 'analis');
    await page.goto(`${baseURL}/cards/IC-20261112-999`);
    await expect(page.locator('.a-alert')).toContainText('Data tidak ditemukan');
    await context.close();
  }

  // 4. Expired session: any 401 returns to the sign-in page.
  {
    const { context, page } = await open(browser, 'analis', { 'GET /cards': (route) => fail(route, 401, 'TIDAK_TERAUTENTIKASI') });
    await page.goto(`${baseURL}/cards`);
    await page.waitForURL('**/login?reason=session-expired');
    await expect(page.getByRole('heading', { name: 'Masuk ke Astria' })).toBeVisible();
    await context.close();
  }

  // 5. Unknown routes still answer 404.
  {
    const { context, page } = await open(browser, 'analis');
    const response = await page.goto(`${baseURL}/tidak-ada`);
    expect(response.status()).toBe(404);
    await context.close();
  }
}
