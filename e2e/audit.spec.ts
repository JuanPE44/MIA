import { test, expect } from '@playwright/test';
import { ROUTES, setTheme, attachCollectors, axeScan, domAudit, waitSettled, shot, record } from './helpers';

for (const theme of ['light', 'dark'] as const) {
  for (const r of ROUTES) {
    test(`audit ${r.name} [${theme}]`, async ({ page }, testInfo) => {
      const phone = testInfo.project.name === 'phone';
      const errors = attachCollectors(page);
      await setTheme(page, theme);
      await page.goto(r.url);
      await waitSettled(page);
      const where = `${r.url} | ${testInfo.project.name} | ${theme}`;
      const bad: string[] = [];
      const note = (kind: string, items: string[]) => {
        for (const i of items) { bad.push(`${kind}: ${i}`); record({ id: kind, severity: '', where, detail: i }); }
      };

      const axe = await axeScan(page);
      note('axe', axe.map((v) => `${v.id} [${v.impact}] x${v.n} ${v.sample}`));
      const d = await domAudit(page, phone);
      note('overflow', d.overflow);
      note('tap<24', d.smallTargets);
      note('img-no-alt', d.imgNoAlt);
      note('unnamed-button', d.unnamedButtons);
      note('clipped-text', d.clipped);
      if (r.name !== '404') note('heading', d.noH1);
      note('lang', d.noLang);
      note('runtime', [...new Set(errors)]);
      if (bad.length) await shot(page, `audit_${r.name}_${testInfo.project.name}_${theme}`);
      expect.soft(bad, where).toEqual([]);
    });
  }
}

test('login page audit (logged out)', async ({ browser }, testInfo) => {
  const phone = testInfo.project.name === 'phone';
  for (const theme of ['light', 'dark'] as const) {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: testInfo.project.use.viewport!, hasTouch: phone });
    const page = await ctx.newPage();
    const errors = attachCollectors(page);
    await setTheme(page, theme);
    await page.goto('/');
    await waitSettled(page);
    const where = `/ (login) | ${testInfo.project.name} | ${theme}`;
    const bad: string[] = [];
    const note = (kind: string, items: string[]) => { for (const i of items) { bad.push(`${kind}: ${i}`); record({ id: kind, severity: '', where, detail: i }); } };
    note('axe', (await axeScan(page)).map((v) => `${v.id} [${v.impact}] x${v.n} ${v.sample}`));
    const d = await domAudit(page, phone);
    note('overflow', d.overflow); note('tap<24', d.smallTargets); note('img-no-alt', d.imgNoAlt);
    note('unnamed-button', d.unnamedButtons); note('clipped-text', d.clipped); note('heading', d.noH1);
    note('runtime', [...new Set(errors)]);
    if (bad.length) await shot(page, `audit_login_${testInfo.project.name}_${theme}`);
    expect.soft(bad, where).toEqual([]);
    await ctx.close();
  }
});
