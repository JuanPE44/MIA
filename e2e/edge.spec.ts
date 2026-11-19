import { test, expect, type Page } from '@playwright/test';
import { NB, setTheme, attachCollectors, waitSettled, step, shot, record, domAudit } from './helpers';

const LONG = 'Cuaderno-con-un-nombre-extraordinariamente-largo-sin-espacios-' + 'x'.repeat(120);
const LONG_WORDS = 'Introducción a la termodinámica estadística aplicada a sistemas fuera del equilibrio y su relación con la teoría de la información '.repeat(3);

/** On phone "Nueva carpeta" lives inside the "Más acciones" menu. */
async function openNewFolderDialog(page: Page, phone: boolean) {
  if (phone) {
    await page.getByRole('button', { name: 'Más acciones' }).click();
    await page.getByRole('menuitem', { name: 'Nueva carpeta' }).click();
  } else {
    await page.getByRole('button', { name: 'Nueva carpeta' }).first().click();
  }
}

test.beforeEach(async ({ page }) => { await setTheme(page, 'light'); });

test('very long folder + notebook names do not break layout', async ({ page }, ti) => {
  const errors = attachCollectors(page);
  await page.goto('/cuadernos'); await waitSettled(page);
  await step(page, ti, 'create-long-folder', async () => {
    await openNewFolderDialog(page, ti.project.name === 'phone');
    await page.getByLabel(/Nombre/).fill(LONG);
    await page.getByRole('dialog').getByRole('button', { name: /Crear|Guardar/ }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
  await step(page, ti, 'create-long-notebook', async () => {
    await page.getByRole('button', { name: 'Nuevo cuaderno' }).first().click();
    await page.getByRole('dialog').getByLabel(/Título/).fill(LONG_WORDS);
    await page.getByRole('dialog').getByLabel(/Materia/).fill(LONG);
    await page.getByRole('dialog').getByRole('button', { name: /Crear/ }).click();
    await page.waitForURL(/\/cuadernos\/.+/, { timeout: 6000 });
  });
  for (const u of [null, 'fuentes', 'materiales', 'estudiar']) {
    await step(page, ti, `long-name-layout-${u ?? 'chat'}`, async () => {
      if (u) await page.goto(page.url().replace(/\/(chat|fuentes|materiales|estudiar).*$/, `/${u}`)); await waitSettled(page);
      const d = await domAudit(page, ti.project.name === 'phone');
      await shot(page, `longname_${u ?? 'chat'}_${ti.project.name}`);
      expect.soft(d.overflow, `horizontal overflow with long notebook name on ${u ?? 'chat'}`).toEqual([]);
      for (const o of d.overflow) record({ id: 'long-name-overflow', severity: 'P1', where: `${u ?? 'chat'} | ${ti.project.name}`, detail: o });
    });
  }
  await page.goto('/cuadernos'); await waitSettled(page);
  await step(page, ti, 'long-name-library-layout', async () => {
    const d = await domAudit(page, ti.project.name === 'phone');
    await shot(page, `longname_library_${ti.project.name}`);
    for (const o of d.overflow) record({ id: 'long-name-overflow', severity: 'P1', where: `library | ${ti.project.name}`, detail: o });
    expect.soft(d.overflow, 'overflow in library with long names').toEqual([]);
  });
  expect.soft([...new Set(errors)]).toEqual([]);
});

test('empty / whitespace inputs', async ({ page }, ti) => {
  await page.goto('/cuadernos'); await waitSettled(page);
  await step(page, ti, 'folder-whitespace-name', async () => {
    await openNewFolderDialog(page, ti.project.name === 'phone');
    await page.getByLabel(/Nombre/).fill('   ');
    await page.getByRole('dialog').getByRole('button', { name: /Crear|Guardar/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByText(/obligatori|Escribe|nombre|Ponle/i).first()).toBeVisible();
    await page.keyboard.press('Escape');
  });
  await page.goto(`/cuadernos/${NB}/chat`); await waitSettled(page);
  await step(page, ti, 'chat-whitespace-not-sendable', async () => {
    await page.getByPlaceholder(/Pregunta sobre tus fuentes/).fill('    ');
    await expect(page.getByRole('button', { name: 'Enviar pregunta' })).toBeDisabled();
  });
  await step(page, ti, 'chat-very-long-message', async () => {
    const long = 'palabra '.repeat(1500);
    await page.getByPlaceholder(/Pregunta sobre tus fuentes/).fill(long);
    await page.getByRole('button', { name: 'Enviar pregunta' }).click();
    await page.waitForTimeout(2500);
    const d = await domAudit(page, ti.project.name === 'phone');
    await shot(page, `chat_long_message_${ti.project.name}`);
    expect.soft(d.overflow).toEqual([]);
  });
});

test('double-click create does not duplicate', async ({ page }, ti) => {
  await page.goto('/cuadernos'); await waitSettled(page);
  const name = `Doble ${Date.now() % 10000}`;
  await step(page, ti, 'double-click-new-folder', async () => {
    await openNewFolderDialog(page, ti.project.name === 'phone');
    await page.getByLabel(/Nombre/).fill(name);
    await page.getByRole('dialog').getByRole('button', { name: /Crear|Guardar/ }).dblclick();
    await page.waitForTimeout(800);
    const n = await page.getByRole('button', { name: new RegExp(name) }).count() + await page.getByText(name, { exact: true }).count();
    const stored = await page.evaluate((nm) => Object.entries(localStorage).filter(([k]) => k.startsWith('focused_folders_')).map(([, v]) => (JSON.parse(v!) as any[]).filter((f) => f.name === nm || f.title === nm).length)[0], name);
    expect.soft(stored, `folder created ${stored}x on double click`).toBe(1);
  });
  await page.keyboard.press('Escape');
  await step(page, ti, 'double-click-new-notebook', async () => {
    await page.getByRole('button', { name: 'Nuevo cuaderno' }).first().click();
    await page.getByRole('dialog').getByLabel(/Título/).fill(name);
    await page.getByRole('dialog').getByRole('button', { name: /Crear/ }).dblclick();
    await page.waitForTimeout(1000);
    const stored = await page.evaluate((nm) => Object.entries(localStorage).filter(([k]) => k.startsWith('focused_notebooks_')).map(([, v]) => (JSON.parse(v!) as any[]).filter((f) => f.title === nm).length)[0], name);
    expect.soft(stored, `notebook created ${stored}x on double click`).toBe(1);
  });
});

test('reload mid-flow keeps state; back button', async ({ page }, ti) => {
  await page.goto(`/cuadernos/${NB}/fuentes`); await waitSettled(page);
  await step(page, ti, 'reload-keeps-route-and-data', async () => {
    await page.reload(); await waitSettled(page);
    await expect(page).toHaveURL(new RegExp(`${NB}/fuentes`));
    await expect(page.locator('main').getByText(/Lean Startup|Canvas/).first()).toBeVisible();
  });
  await step(page, ti, 'chat-message-survives-reload', async () => {
    await page.goto(`/cuadernos/${NB}/chat`); await waitSettled(page);
    const msg = `Persistencia ${Date.now() % 1000}`;
    await page.getByPlaceholder(/Pregunta sobre tus fuentes/).fill(msg);
    await page.getByRole('button', { name: 'Enviar pregunta' }).click();
    await expect(page.getByText(msg).first()).toBeVisible();
    await page.waitForTimeout(3500);
    await page.reload(); await waitSettled(page);
    await expect(page.getByText(msg).first()).toBeVisible();
  });
  await step(page, ti, 'unsent-draft-lost-on-reload (info)', async () => {
    await page.getByPlaceholder(/Pregunta sobre tus fuentes/).fill('borrador sin enviar');
    await page.reload(); await waitSettled(page);
    const v = await page.getByPlaceholder(/Pregunta sobre tus fuentes/).inputValue();
    record({ id: 'draft-persist', severity: 'info', where: ti.project.name, detail: `composer draft after reload: "${v}"` });
  }, 'P2');
  await step(page, ti, 'back-forward-sections', async () => {
    await page.goto('/cuadernos'); await waitSettled(page);
    await page.getByRole('link', { name: /Lean Startup/ }).first().click();
    await page.waitForURL(/chat/);
    await page.goBack();
    await expect(page).toHaveURL(/\/cuadernos$/);
    await page.goForward();
    await expect(page).toHaveURL(/chat/);
  });
  await step(page, ti, 'notebook-index-redirect-no-back-trap', async () => {
    await page.goto('/cuadernos'); await page.goto(`/cuadernos/${NB}`);
    await page.waitForURL(/chat/);
    await page.goBack();
    // Back must not bounce forward again to /chat (redirect loop)
    await page.waitForTimeout(600);
    expect(page.url(), 'Back from redirected notebook index bounces forward again').toMatch(/\/cuadernos\/?$/);
  });
});

test('404 and invalid ids', async ({ page }, ti) => {
  const errors = attachCollectors(page);
  await step(page, ti, '404-page', async () => {
    await page.goto('/ruta/inexistente'); await waitSettled(page);
    await expect(page.getByRole('heading', { name: /no existe/i })).toBeVisible();
    await page.getByRole('link', { name: /Mis cuadernos/ }).click();
    await expect(page).toHaveURL(/\/cuadernos$/);
  });
  await step(page, ti, 'unknown-notebook-id', async () => {
    await page.goto('/cuadernos/id-que-no-existe/chat'); await waitSettled(page);
    await shot(page, `unknown_notebook_${ti.project.name}`);
    await expect(page.getByText(/no existe|no encontr|no está disponible/i).first()).toBeVisible();
  });
  await step(page, ti, 'unknown-artifact-id', async () => {
    await page.goto(`/cuadernos/${NB}/materiales/xxx`); await waitSettled(page);
    await shot(page, `unknown_artifact_${ti.project.name}`);
    await expect(page.getByText(/no existe|no encontr|no está disponible|Not found/i).first()).toBeVisible();
  });
  await step(page, ti, 'unknown-thread-id', async () => {
    await page.goto(`/cuadernos/${NB}/chat/zzz`); await waitSettled(page);
    await shot(page, `unknown_thread_${ti.project.name}`);
    await expect(page.locator('main')).toBeVisible();
  });
  expect.soft([...new Set(errors)].filter((e) => !/404/.test(e))).toEqual([]);
});
