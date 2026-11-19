import { test, expect } from '@playwright/test';
import { NB, setTheme, attachCollectors, waitSettled, step, shot, record } from './helpers';


test.beforeEach(async ({ page }) => { await setTheme(page, 'light'); });

test('J2 create folder + notebook', async ({ page }, ti) => {
  const errors = attachCollectors(page);
  await page.goto('/cuadernos'); await waitSettled(page);
  const folder = `QA Carpeta ${Date.now() % 10000}`;
  await step(page, ti, 'new-folder', async () => {
    await page.getByRole('button', { name: 'Nueva carpeta' }).first().click();
    await page.getByLabel(/Nombre/).fill(folder);
    await page.getByRole('dialog').getByRole('button', { name: /Crear|Guardar/ }).click();
    await expect(page.getByText(folder).first()).toBeVisible();
  });
  await step(page, ti, 'new-notebook-empty-submit-shows-error', async () => {
    await page.getByRole('button', { name: 'Nuevo cuaderno' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /Crear/ }).click();
    await expect(page.getByRole('dialog').getByText(/obligatorio|título|Escribe|Ponle/i).nth(1)).toBeVisible();
  });
  await step(page, ti, 'new-notebook', async () => {
    await page.getByRole('dialog').getByLabel(/Título/).fill('QA Cuaderno');
    await page.getByRole('dialog').getByRole('button', { name: /Crear/ }).click();
    await page.waitForURL(/\/cuadernos\/.+/, { timeout: 5000 });
  });
  expect.soft([...new Set(errors)], 'runtime errors').toEqual([]);
});

test('J4 add text source', async ({ page }, ti) => {
  await page.goto(`/cuadernos/${NB}/fuentes`); await waitSettled(page);
  await step(page, ti, 'add-empty-shows-errors', async () => {
    await page.getByRole('button', { name: /Añadir fuente/ }).first().click();
    await page.getByRole('radio', { name: /Texto/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Añadir|Agregar|Guardar/ }).last().click();
    await expect(page.getByRole('dialog').getByText(/Ponle un título|Pega o escribe/).first()).toBeVisible();
  });
  await step(page, ti, 'add-text-source', async () => {
    await page.getByRole('dialog').getByLabel(/Título/).fill('Fuente QA');
    await page.getByRole('dialog').getByLabel(/Texto|Contenido/).first().fill('La startup lean valida hipótesis con experimentos rápidos. '.repeat(5));
    await page.getByRole('dialog').getByRole('button', { name: /Añadir|Agregar|Guardar/ }).last().click();
    await expect(page.getByText('Fuente QA').first()).toBeVisible({ timeout: 8000 });
  });
});

test('J5 chat send', async ({ page }, ti) => {
  const errors = attachCollectors(page);
  await page.goto(`/cuadernos/${NB}/chat`); await waitSettled(page);
  await step(page, ti, 'send-empty-disabled', async () => {
    const send = page.getByRole('button', { name: 'Enviar pregunta' });
    await expect(send).toBeDisabled();
  });
  await step(page, ti, 'send-and-answer', async () => {
    const box = page.getByPlaceholder(/Pregunta sobre tus fuentes/);
    await box.fill('¿Qué es un MVP?');
    await page.getByRole('button', { name: 'Enviar pregunta' }).click();
    await expect(page.getByText('¿Qué es un MVP?').first()).toBeVisible();
    await expect(page.locator('main').getByText(/MVP|producto mínimo/i).nth(1)).toBeVisible({ timeout: 25000 });
  });
  await step(page, ti, 'composer-cleared-after-send', async () => {
    await expect(page.getByPlaceholder(/Pregunta sobre tus fuentes/)).toHaveValue('');
  });
  await step(page, ti, 'double-send-no-dup', async () => {
    const box = page.getByPlaceholder(/Pregunta sobre tus fuentes/);
    await box.fill('Duplicado QA');
    const send = page.getByRole('button', { name: 'Enviar pregunta' });
    await send.dblclick();
    await page.waitForTimeout(1500);
    const n = await page.getByText('Duplicado QA', { exact: true }).count();
    expect(n, 'message rendered more than once after double-click').toBeLessThanOrEqual(1);
  });
  expect.soft([...new Set(errors)], 'runtime errors').toEqual([]);
});

test('J6 generate artifact', async ({ page }, ti) => {
  const errors = attachCollectors(page);
  await page.goto(`/cuadernos/${NB}/materiales`); await waitSettled(page);
  const before = await page.getByRole('heading', { name: /Tus materiales/ }).innerText().catch(() => '');
  await step(page, ti, 'create-quiz', async () => {
    await page.getByRole('button', { name: /Cuestionario/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Generar' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
  await step(page, ti, 'viewer-opens-after-generate', async () => {
    await page.waitForURL(/materiales\/.+/, { timeout: 40000 });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });
  await step(page, ti, 'back-returns-to-list-with-new-artifact', async () => {
    await page.goBack();
    await expect(page).toHaveURL(/materiales$/);
    await expect(page.getByRole('heading', { name: /Tus materiales/ })).not.toHaveText(before);
  });
  expect.soft([...new Set(errors)], 'runtime errors').toEqual([]);
});

test('J8 study: start focus mode, exit', async ({ page }, ti) => {
  await page.goto(`/cuadernos/${NB}/estudiar`); await waitSettled(page);
  await step(page, ti, 'start', async () => {
    await page.evaluate(() => { (document.documentElement as any).requestFullscreen = () => Promise.resolve(); });
    await page.getByRole('button', { name: 'Empezar sesión' }).click();
    await expect(page.getByRole('region', { name: 'Sesión en curso' }).or(page.getByLabel('Sesión en curso')).first()).toBeVisible();
  });
  await step(page, ti, 'visibilitychange-warns', async () => {
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(500);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  }, 'P2');
  await step(page, ti, 'dismiss-tab-left-dialog', async () => {
    await page.getByRole('button', { name: 'Volver a la sesión' }).click();
  }, 'P2');
  await step(page, ti, 'exit-button-exits', async () => {
    await page.getByRole('button', { name: /Salir del modo blindado/ }).click();
    await page.waitForTimeout(600);
    await expect(page.getByRole('button', { name: 'Pausar' }).or(page.getByRole('button', { name: 'Terminar' })).first()).toBeVisible();
    await shot(page, 'focus_after_exit_blindado');
  });
  await step(page, ti, 'end-session', async () => {
    await page.getByRole('button', { name: 'Terminar' }).click();
    const d = page.getByRole('alertdialog').or(page.getByRole('dialog').filter({ has: page.getByRole('button') }));
    if (await d.first().isVisible().catch(() => false)) await d.first().getByRole('button', { name: /Terminar|Sí|Confirmar/ }).first().click();
    await expect(page.getByRole('button', { name: 'Empezar sesión' }).or(page.getByText(/Resumen|terminad/i)).first()).toBeVisible();
  });
});

test('J9 active recall + flashcards', async ({ page }, ti) => {
  const errors = attachCollectors(page);
  await page.goto(`/cuadernos/${NB}/estudiar/repaso`); await waitSettled(page);
  await step(page, ti, 'recall-has-action', async () => {
    await expect(page.locator('main').getByRole('button').first()).toBeVisible();
  });
  await page.goto(`/cuadernos/${NB}/estudiar/tarjetas`); await waitSettled(page);
  await step(page, ti, 'flashcards-render', async () => {
    await expect(page.locator('main').getByRole('button').first()).toBeVisible();
  });
  expect.soft([...new Set(errors)], 'runtime errors').toEqual([]);
});

test('J12 logout', async ({ page }, ti) => {
  await page.goto('/cuadernos'); await waitSettled(page);
  await step(page, ti, 'logout', async () => {
    await page.getByRole('button', { name: /^Cuenta/ }).first().click();
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeVisible({ timeout: 8000 });
  });
  await step(page, ti, 'protected-route-after-logout', async () => {
    await page.goto('/cuadernos');
    await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeVisible();
  });
});

test('plan gating: free user sees lock/upsell', async ({ browser }, ti) => {
  const ctx = await browser.newContext({ storageState: 'e2e/.auth/free.json', viewport: ti.project.use.viewport! });
  const page = await ctx.newPage();
  await setTheme(page, 'light');
  await page.goto('/progreso'); await waitSettled(page);
  await step(page, ti, 'progress-locked-feature', async () => {
    await expect(page.getByText(/plan|Mejorar|Ver planes/i).first()).toBeVisible();
  });
  await page.goto(`/cuadernos/${NB}/materiales`); await waitSettled(page);
  await step(page, ti, 'materials-lock-badge', async () => {
    await expect(page.getByText('No está en tu plan').first()).toBeVisible();
  }, 'P2');
  await step(page, ti, 'locked-tile-click-goes-to-plans', async () => {
    await page.getByRole('button', { name: /Modelo de examen/ }).click();
    await expect(page).toHaveURL(/\/planes/);
    // UX probe: does the plans page say which feature triggered the upsell?
    const mentions = await page.getByText(/Modelo de examen/i).count();
    expect.soft(mentions, 'plans page gives no context about the locked feature the user clicked').toBeGreaterThan(0);
  });
  await page.goto(`/cuadernos/${NB}/chat`); await waitSettled(page);
  await step(page, ti, 'web-search-locked', async () => {
    await page.getByRole('button', { name: /Buscar en la web/ }).first().click();
    await expect(page.getByText(/plan/i).first()).toBeVisible();
  }, 'P2');
  await ctx.close();
});

test('fresh account empty states', async ({ browser }, ti) => {
  const ctx = await browser.newContext({ viewport: ti.project.use.viewport!, storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  const errors = attachCollectors(page);
  await setTheme(page, 'light');
  await page.goto('/'); await waitSettled(page);
  const email = `qa+${Date.now()}@example.com`;
  await step(page, ti, 'signup', async () => {
    await page.getByRole('tab', { name: /Crear cuenta/ }).or(page.getByRole('radio', { name: /Crear cuenta/ })).or(page.getByRole('button', { name: /^Crear cuenta$/ })).first().click();
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('MiaTest123!');
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).last().click();
    await page.waitForURL(/\/cuadernos/, { timeout: 15000 });
  });
  await waitSettled(page);
  await shot(page, `fresh_first_screen_${ti.project.name}`);
  await step(page, ti, 'onboarding-or-empty-state-visible', async () => {
    await expect(page.getByText(/Crea tu primer cuaderno/i).first()).toBeVisible();
  });
  expect.soft([...new Set(errors)], 'runtime errors').toEqual([]);
  await ctx.close();
});
