// Proves the nonce CSP in a real browser: header present, every <script> carries the nonce, no violations.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const baseURL = process.env.ASTRIA_TEST_URL || 'http://127.0.0.1:3111';
const routes = ['/login', '/', '/cards', '/cards/IC-20261110-003', '/digests', '/upload', '/metrics', '/cases', '/configuration', '/audit', '/components'];
let server;
let browser;
const problems = [];
try {
  if (!process.env.ASTRIA_TEST_URL) {
    server = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '--port', '3111'], { cwd: root, windowsHide: true, stdio: 'ignore' });
    let ready = false;
    for (let i = 0; i < 240 && !ready; i++) {
      try { ready = (await fetch(baseURL, { signal: AbortSignal.timeout(1000) })).ok; } catch {}
      if (!ready) await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw new Error('server did not start');
  }
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const page = await (await browser.newContext()).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' || /content security policy/i.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const nonces = new Set();
  for (const route of routes) {
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    const csp = response.headers()['content-security-policy'] || '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    const info = await page.evaluate(() => ({
      scripts: [...document.scripts].map((s) => ({ hasNonce: !!(s.nonce || s.getAttribute('nonce')), external: !!s.src })),
      violations: window.__csp,
      hydrated: !!document.querySelector('[data-nextjs-router]') || document.documentElement.innerHTML.includes('self.__next_f'),
    }));
    nonces.add(nonce);
    const unnonced = info.scripts.filter((s) => !s.hasNonce).length;
    const headersOk = response.headers()['x-content-type-options'] === 'nosniff' && !!response.headers()['referrer-policy'];
    const ok = response.status() === 200 && !!nonce && !/script-src[^;]*unsafe-inline/.test(csp) && !/style-src [^;]*unsafe-inline/.test(csp) && !csp.includes('unsafe-eval') && unnonced === 0 && info.scripts.length > 0 && info.violations.length === 0 && headersOk;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${route} status=${response.status()} scripts=${info.scripts.length} unnonced=${unnonced} violations=${JSON.stringify(info.violations)}`);
    if (!ok) problems.push(route);
  }
  if (nonces.size !== routes.length) problems.push(`nonce reused (${nonces.size} unique of ${routes.length})`);
  if (errors.length) { problems.push(...errors.map((e) => `console: ${e}`)); }
  console.log(`unique nonces: ${nonces.size}/${routes.length}; console errors: ${errors.length}`);
} catch (e) {
  problems.push(String(e));
} finally {
  await browser?.close();
  server?.kill();
}
if (problems.length) { console.error('FAILED:', problems); process.exit(1); }
console.log('CSP OK');
