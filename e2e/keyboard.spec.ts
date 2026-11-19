import { test, expect, type Page } from '@playwright/test';
import { NB, setTheme, waitSettled, step, shot, record } from './helpers';

const SCREENS = [
  '/cuadernos', '/progreso', '/ayuda', '/planes', '/cuenta/preferencias',
  `/cuadernos/${NB}/chat`, `/cuadernos/${NB}/fuentes`, `/cuadernos/${NB}/materiales`, `/cuadernos/${NB}/estudiar`,
];

async function focusInfo(page: Page) {
  return page.evaluate(() => {
    const e = document.activeElement as HTMLElement | null;
    if (!e || e === document.body) return null;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    // look at pseudo-element focus rings (after:) too
    const after = getComputedStyle(e, '::after');
    const outlined = (c: CSSStyleDeclaration) => c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0;
    let shadow = cs.boxShadow !== 'none';
    // A wrapper may draw the ring via :focus-within (e.g. the chat composer card around the textarea).
    for (let p = e.parentElement, i = 0; p && i < 4 && !shadow; p = p.parentElement, i++) {
      const pc = getComputedStyle(p);
      if (p.matches(':focus-within') && (outlined(pc) || pc.boxShadow !== 'none')) shadow = true;
    }
    const id = e.tagName.toLowerCase() + (e.getAttribute('aria-label') ? `[${e.getAttribute('aria-label')}]` : '') + ' "' + (e.innerText || '').trim().slice(0, 25) + '"';
    // ancestors with :focus-within styling can't be detected; include border change as indicator
    return { id, indicator: outlined(cs) || outlined(after) || shadow, offscreen: r.bottom < 0 || r.top > innerHeight, size: [Math.round(r.width), Math.round(r.height)], hidden: r.width === 0 || r.height === 0, key: e.tagName + (e.id || '') + r.x.toFixed(0) + r.y.toFixed(0) };
  });
}

for (const url of SCREENS) {
  test(`keyboard tab-through ${url}`, async ({ page }, ti) => {
    await setTheme(page, 'light');
    await page.goto(url); await waitSettled(page);
    await page.locator('body').click({ position: { x: 2, y: 2 } }).catch(() => {});
    const seen = new Map<string, number>();
    const noRing: string[] = [];
    const invisible: string[] = [];
    let trap = false;
    let sequence: string[] = [];
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press('Tab');
      const f = await focusInfo(page);
      if (!f) continue;
      sequence.push(f.key);
      seen.set(f.key, (seen.get(f.key) ?? 0) + 1);
      if (!f.indicator && !noRing.includes(f.id)) noRing.push(f.id);
      if (f.hidden && !invisible.includes(f.id)) invisible.push(f.id);
      // trap: cycling among <=3 elements for 12+ presses while many tab stops exist
      if (i >= 14) {
        const last = new Set(sequence.slice(-12));
        if (last.size <= 3) { trap = true; break; }
      }
    }
    const where = `${url} | ${ti.project.name}`;
    if (noRing.length) { record({ id: 'focus-indicator', severity: 'P1', where, detail: 'No outline/box-shadow on focus: ' + noRing.slice(0, 8).join(', ') }); await shot(page, `kbd_noring_${url}`); }
    if (invisible.length) record({ id: 'focus-hidden', severity: 'P1', where, detail: 'Focusable but zero-size/hidden: ' + invisible.join(', ') });
    if (trap) record({ id: 'focus-trap', severity: 'P0', where, detail: 'Tab cycles within <=3 elements' });
    expect.soft(noRing, `elements without visible focus indicator (${where})`).toEqual([]);
    expect.soft(invisible, 'focused but invisible').toEqual([]);
    expect.soft(trap, 'focus trap').toBe(false);
    expect.soft(seen.size, 'few tab stops').toBeGreaterThan(2);
  });
}

test('skip link / first tab stop is reachable', async ({ page }, ti) => {
  await page.goto('/cuadernos'); await waitSettled(page);
  await page.keyboard.press('Tab');
  const f = await focusInfo(page);
  record({ id: 'first-tab-stop', severity: 'info', where: ti.project.name, detail: String(f?.id) });
  const skip = await page.getByRole('link', { name: /Saltar|Ir al contenido|skip/i }).count();
  expect.soft(skip, 'no skip-to-content link (every page tab-walks through nav first)').toBeGreaterThan(0);
});

test('Escape closes dialogs and focus returns to trigger', async ({ page }, ti) => {
  test.setTimeout(90_000);
  await page.goto('/cuadernos'); await waitSettled(page);
  const cases: Array<[string, () => Promise<void>]> = [
    ['Nueva carpeta', async () => { await page.getByRole('button', { name: 'Nueva carpeta' }).first().click(); }],
    ['Nuevo cuaderno', async () => { await page.getByRole('button', { name: 'Nuevo cuaderno' }).first().click(); }],
  ];
  for (const [label, open] of cases) {
    await step(page, ti, `escape-${label}`, async () => {
      await open();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
      const back = await page.evaluate(() => (document.activeElement?.textContent || document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName || '').trim().slice(0, 30));
      expect.soft(back, `focus not restored to trigger after closing "${label}" (activeElement: ${back})`).toContain(label);
    });
  }
  await page.goto(`/cuadernos/${NB}/fuentes`); await waitSettled(page);
  await step(page, ti, 'escape-add-source', async () => {
    await page.getByRole('button', { name: /Añadir fuente/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
  await page.goto(`/cuadernos/${NB}/materiales`); await waitSettled(page);
  await step(page, ti, 'escape-create-material', async () => {
    await page.getByRole('button', { name: /Cuestionario/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
  await step(page, ti, 'account-menu-escape', async () => {
    await page.getByRole('button', { name: /^Cuenta/ }).first().click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
  });
});

test('dialog traps focus (Tab stays inside)', async ({ page }, ti) => {
  await page.goto('/cuadernos'); await waitSettled(page);
  await page.getByRole('button', { name: 'Nuevo cuaderno' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  let escaped = false;
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => { const a = document.activeElement; return !a || a === document.body || !!a.closest('dialog,[role=dialog]'); });
    if (!inside) { escaped = true; break; }
  }
  if (escaped) { await shot(page, 'dialog_focus_escapes'); record({ id: 'dialog-focus', severity: 'P1', where: ti.project.name, detail: 'Tab leaves modal dialog (Nuevo cuaderno)' }); }
  expect.soft(escaped, 'focus escaped modal dialog').toBe(false);
});
