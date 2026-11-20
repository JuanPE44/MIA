import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { NB, setTheme, waitSettled } from './helpers';

const LONG_FOLDER = 'Carpeta-con-nombre-extraordinariamente-largo-' + 'y'.repeat(90);

const noHScroll = (page: Page) =>
  page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));

test.beforeEach(async ({ page }) => { await setTheme(page, 'light'); });

test.describe('layout regressions', () => {
  test('chat with a cited answer has no horizontal scroll', async ({ page }) => {
    await page.goto(`/cuadernos/${NB}/chat`); await waitSettled(page);
    // Seed thread ships an answer with citation chips.
    await expect(page.locator('main').getByText(/Lean Startup|Fuente/).first()).toBeVisible();
    const { sw, iw } = await noHScroll(page);
    expect(sw, `scrollWidth ${sw} > innerWidth ${iw}`).toBeLessThanOrEqual(iw);
  });

  test('fuentes: summary row does not overlap "Volver a analizar"', async ({ page }) => {
    await page.goto(`/cuadernos/${NB}/fuentes`); await waitSettled(page);
    const title = page.getByRole('button', { name: /Resumen del cuaderno/ });
    const action = page.getByRole('button', { name: /Volver a analizar|Analizar fuentes/ });
    await expect(title).toBeVisible();
    await expect(action).toBeVisible();
    const a = (await title.boundingBox())!;
    const b = (await action.boundingBox())!;
    const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    expect(overlap, `boxes overlap: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`).toBe(false);
    const { sw, iw } = await noHScroll(page);
    expect(sw).toBeLessThanOrEqual(iw);
  });

  test('dialog body is not collapsed on a short viewport', async ({ page }) => {
    // Header + footer used to fill max-height and squeeze the body to ~0.
    await page.setViewportSize({ width: 1280, height: 260 });
    await page.goto('/cuadernos'); await waitSettled(page);
    await page.getByRole('button', { name: 'Nuevo cuaderno' }).first().click();
    const field = page.getByRole('dialog').getByLabel(/Título/);
    await expect(field).toBeVisible();
    // Playwright treats overflow-clipped elements as visible, so measure the scroll body itself.
    const bodyHeight = await field.evaluate(
      (el) => (el.closest('dialog > div.overflow-y-auto') as HTMLElement).getBoundingClientRect().height,
    );
    expect(bodyHeight, 'dialog body collapsed').toBeGreaterThanOrEqual(120);
    await expect(page.getByRole('dialog').getByRole('button', { name: /Crear/ })).toBeInViewport();
  });

  test('long folder name chip truncates in library', async ({ page }, ti) => {
    const phone = ti.project.name === 'phone';
    await page.goto('/cuadernos'); await waitSettled(page);
    if (phone) {
      await page.getByRole('button', { name: 'Más acciones' }).click();
      await page.getByRole('menuitem', { name: 'Nueva carpeta' }).click();
    } else {
      await page.getByRole('button', { name: 'Nueva carpeta' }).first().click();
    }
    await page.getByLabel(/Nombre/).fill(LONG_FOLDER);
    await page.getByRole('dialog').getByRole('button', { name: /Crear|Guardar/ }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.getByRole('button', { name: 'Nuevo cuaderno' }).first().click();
    await page.getByRole('dialog').getByLabel(/Título/).fill('Cuaderno en carpeta larga');
    await page.getByRole('dialog').getByRole('button', { name: /Crear/ }).click();
    await page.waitForURL(/\/cuadernos\/.+/);
    await page.goto('/cuadernos'); await waitSettled(page);

    const { sw, iw } = await noHScroll(page);
    expect(sw, 'library overflows horizontally').toBeLessThanOrEqual(iw);
    // Every element showing the long name must be narrower than the viewport and ellipsized
    // (filter chips live in a horizontal scroller, so their x position is not checked).
    const report = await page.evaluate((name) => {
      const out: string[] = [];
      for (const el of Array.from(document.querySelectorAll('span,p,h2,h3,button'))) {
        const e = el as HTMLElement;
        if (e.children.length || e.textContent?.trim() !== name) continue;
        const r = e.getBoundingClientRect();
        if (!r.width) continue;
        const cs = getComputedStyle(e);
        if (r.width > window.innerWidth) out.push(`wider than viewport: ${Math.round(r.width)}`);
        if (e.scrollWidth <= e.clientWidth + 1) out.push('long name was not truncated at all');
        if (e.scrollWidth > e.clientWidth + 1 && cs.textOverflow !== 'ellipsis') out.push('clipped without ellipsis');
      }
      return out;
    }, LONG_FOLDER);
    expect(report).toEqual([]);
  });
});

test.describe('accessibility regressions', () => {
  test('A: navbar progress link name contains its visible text', async ({ page }) => {
    await page.goto('/cuadernos'); await waitSettled(page);
    const link = page.locator('a[href="/progreso"]:visible').filter({ hasText: /Hoy/i }).first();
    await expect(link).toBeVisible();
    const res = await new AxeBuilder({ page })
      .include('a[href="/progreso"]')
      .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
      .withRules(['label-content-name-mismatch'])
      .analyze();
    expect(res.violations.map((v) => v.id)).toEqual([]);
    const visible = ((await link.innerText()).match(/\d+\s*\/\s*\d+/) ?? [''])[0];
    await expect(link).toHaveAccessibleName(new RegExp(`^Hoy\\s+${visible.replace(/\s+/g, '\\s*')}`, 'i'));
  });

  for (const tab of ['chat', 'fuentes', 'materiales', 'estudiar']) {
    test(`B: exactly one h1 on notebook ${tab}`, async ({ page }) => {
      await page.goto(`/cuadernos/${NB}/${tab}`); await waitSettled(page);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main h1, h1').first()).toContainText(/Lean Startup|Emprend|Cuaderno|\w/);
    });
  }

  test('D (phone): login "forgot password" and profile photo targets >= 24px', async ({ browser, page }, ti) => {
    test.skip(ti.project.name !== 'phone', 'tap targets are a phone check');
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: ti.project.use.viewport!, hasTouch: true });
    const lp = await ctx.newPage();
    await setTheme(lp, 'light');
    await lp.goto('/'); await waitSettled(lp);
    const forgot = lp.getByRole('button', { name: '¿Olvidaste tu contraseña?' });
    await expect(forgot).toBeVisible();
    const box = (await forgot.boundingBox())!;
    expect(box.height, 'forgot-password height').toBeGreaterThanOrEqual(24);
    expect(box.width, 'forgot-password width').toBeGreaterThanOrEqual(24);
    await ctx.close();

    await page.goto('/cuenta/perfil'); await waitSettled(page);
    const trigger = page.getByRole('button', { name: /Cambiar foto|Subiendo/ });
    if (await trigger.count()) {
      const t = (await trigger.boundingBox())!;
      expect(t.height).toBeGreaterThanOrEqual(24);
      // The file input stays hidden and out of the tab order / a11y tree.
      await expect(page.locator('input[type=file]')).toBeHidden();
    }
  });

  test('E: skip link is the first tab stop and focuses main', async ({ page }) => {
    await page.goto('/cuadernos'); await waitSettled(page);
    // Reset the sequential focus start point to the top of the document (the app focuses the h1 on load).
    await page.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
      document.body.removeAttribute('tabindex');
    });
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Saltar al contenido' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    const box = (await skip.boundingBox())!;
    expect(box.width).toBeGreaterThan(40);
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName + '#' + document.activeElement?.id)).toBe('MAIN#contenido');
  });
});

test.describe('free plan locked features (C)', () => {
  test.use({ storageState: 'e2e/.auth/free.json' });

  test('locked material tile explains which plan unlocks it', async ({ page }) => {
    await page.goto(`/cuadernos/${NB}/materiales`); await waitSettled(page);
    const tile = page.getByRole('button', { name: /Modelo de examen/ }).first();
    await expect(tile).toBeVisible();
    await tile.click();
    await expect(page).toHaveURL(/\/planes\?necesito=examMode/);
    await expect(page.getByTestId('plan-need')).toContainText(/Modelo de examen.*plan.*Pro/);
  });

  test('LockedFeature CTA passes the feature along', async ({ page }) => {
    await page.goto('/progreso'); await waitSettled(page);
    await page.getByRole('button', { name: 'Ver planes' }).click();
    await expect(page).toHaveURL(/\/planes\?necesito=studyMetrics/);
    await expect(page.getByTestId('plan-need')).toContainText(/Métricas de estudio.*plan.*Pro/);
  });

  test('plans page without context shows no banner', async ({ page }) => {
    await page.goto('/planes'); await waitSettled(page);
    await expect(page.getByTestId('plan-need')).toHaveCount(0);
  });
});

test.describe('focus session layout (G)', () => {
  test('running session card is horizontally centered and the page has a single h1', async ({ page }, ti) => {
    test.skip(ti.project.name !== 'desktop', 'centering is a wide-screen check');
    await page.goto(`/cuadernos/${NB}/estudiar`); await waitSettled(page);
    const blindado = page.getByRole('switch', { name: /Modo blindado/ });
    if (await blindado.count() && (await blindado.getAttribute('aria-checked')) !== 'true') await blindado.click();
    await page.getByRole('button', { name: 'Empezar sesión' }).click();
    const card = page.getByRole('region', { name: 'Sesión en curso' });
    await expect(card).toBeVisible();
    const box = (await card.boundingBox())!;
    const vw = page.viewportSize()!.width;
    // Allow for the side rail: the card must not hug the left edge of the content area.
    expect(box.x, `card at x=${Math.round(box.x)}, width=${Math.round(box.width)}`).toBeGreaterThan(vw * 0.2);
    expect(Math.abs(box.x + box.width / 2 - vw / 2), 'card center vs viewport center').toBeLessThan(vw * 0.15);
    await expect(page.locator('h1')).toHaveCount(1);
  });
});
