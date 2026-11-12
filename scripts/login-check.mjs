import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
import { mockApi } from './integration-check.mjs';

/** Deterministic browser contract tests; these do not claim a live identity-service login. */
export async function checkLogin(browser, baseURL, artifactDir) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await mockApi(context, 'analis'); // the page after sign-in reads /auth/me and the home data
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(String(error)));
  const user = { user_id: 'u-test', username: 'analis01', roles: ['analis'], permissions: ['session'] };
  try {
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(`${baseURL}/login`);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole('heading', { name: 'Masuk ke Astria' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
      expect(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
      if (width === 1440) {
        const form = await page.locator('.web-login').boundingBox();
        expect(form.x).toBeCloseTo(800, 0);
        expect(form.width).toBe(400);
        // Browser font metrics can wrap the session note onto an extra line; keep the entire form centered.
        expect(form.y + form.height / 2).toBeCloseTo(450, 0);
      }
      if (width === 390) {
        const form = await page.locator('.web-login').boundingBox();
        expect(form.x).toBe(24);
        expect(form.width).toBe(342);
        expect(form.y).toBe(184);
        expect((await page.getByLabel('Kata sandi').boundingBox()).height).toBe(48);
      }
      await page.screenshot({ path: path.join(artifactDir, `login-${width}.png`), fullPage: true });
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseURL}/login?reason=session-expired`);
    await expect(page.getByRole('status').filter({ hasText: 'Sesimu berakhir' })).toBeVisible();
    await page.screenshot({ path: path.join(artifactDir, 'login-expired.png'), fullPage: true });
    await page.goto(`${baseURL}/login`);
    const username = page.getByLabel('Nama pengguna');
    const password = page.getByLabel('Kata sandi');
    const submit = page.getByRole('button', { name: 'Masuk', exact: true });
    await expect(username).toHaveAttribute('autocomplete', 'username');
    await expect(password).toHaveAttribute('autocomplete', 'current-password');
    await username.fill('analis01');
    await password.fill(' fixture password ');
    let requestCount = 0;
    let response = { status: 401, contentType: 'application/json', body: '{}' };
    let gate = Promise.resolve();
    await page.route('**/api/v1/auth/login', async route => {
      requestCount++;
      expect(route.request().method()).toBe('POST');
      expect(route.request().headers()['content-type']).toBe('application/json');
      expect(route.request().postDataJSON()).toEqual({ username: 'analis01', password: ' fixture password ' });
      await gate;
      await route.fulfill(response);
    });
    for (const [status, message] of [
      [401, 'Nama pengguna atau kata sandi salah'], [403, 'ditolak'],
      [422, 'Periksa nama pengguna'], [429, 'Terlalu banyak'], [503, 'belum tersedia'],
    ]) {
      response = { status, contentType: 'application/json', body: '{"error":{"message":"private upstream detail"}}' };
      await submit.click();
      await expect(page.locator('#login-error')).toContainText(message);
      await expect(submit).toBeEnabled();
      await expect(password).toBeEnabled();
      await expect(page).toHaveURL(`${baseURL}/login`);
      await expect(page.getByText('private upstream detail')).toHaveCount(0);
      if (status === 401) {
        await page.screenshot({ path: path.join(artifactDir, 'login-401.png'), fullPage: true });
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(result.violations.map(v => v.id)).toEqual([]);
      }
    }
    response = { status: 200, contentType: 'text/html', body: '<html>bad proxy response</html>' };
    await submit.click();
    await expect(page.locator('#login-error')).toContainText('Respons layanan tidak valid');

    let release;
    gate = new Promise(resolve => { release = resolve; });
    response = {
      status: 200, contentType: 'application/json', body: JSON.stringify({ user }),
      headers: { 'set-cookie': 'astria_session=browser-test-session; HttpOnly; SameSite=Strict; Path=/' },
    };
    const before = requestCount;
    await submit.click();
    await expect(page.getByRole('button', { name: 'Memeriksa…' })).toBeDisabled();
    await expect(username).toBeDisabled();
    await expect(password).toBeDisabled();
    // Even a scripted second submit is stopped by the hook's synchronous guard.
    await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(requestCount).toBe(before + 1);
    await page.screenshot({ path: path.join(artifactDir, 'login-loading.png'), fullPage: true });
    release();
    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(page.getByRole('heading', { name: 'Beranda', exact: true })).toBeVisible();
    expect((await context.cookies()).find(cookie => cookie.name === 'astria_session')?.httpOnly).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain('astria_session');
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('browser-test-session');
    expect(await page.evaluate(() => JSON.stringify(sessionStorage))).not.toContain('browser-test-session');

    let loggedOut = false;
    await page.route('**/api/v1/auth/logout', async route => {
      expect(route.request().method()).toBe('POST');
      expect(await route.request().headerValue('cookie')).toContain('astria_session=browser-test-session');
      loggedOut = true;
      await route.fulfill({ status: 204, headers: { 'set-cookie': 'astria_session=; Max-Age=0; Path=/' } });
    });
    await page.getByRole('button', { name: 'Keluar', exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/login`);
    expect(loggedOut).toBe(true);
    expect((await context.cookies()).find(cookie => cookie.name === 'astria_session')).toBeUndefined();
    expect(runtimeErrors).toEqual([]);
  } finally {
    await context.close();
  }
}
