import { test, expect } from '@playwright/test';
import { NB, setTheme, attachCollectors, waitSettled } from './helpers';

// Quick end-to-end smoke (`pnpm e2e:smoke`): library -> notebook -> chat send -> navigation.
test('smoke: library, open notebook, chat send, navigate', async ({ page }) => {
  const errors = attachCollectors(page);
  await setTheme(page, 'light');

  await page.goto('/cuadernos');
  await waitSettled(page);
  await expect(page.getByRole('heading', { level: 1, name: /Mis cuadernos/ })).toBeVisible();

  await page.getByRole('link', { name: /Lean Startup/ }).first().click();
  await expect(page).toHaveURL(new RegExp(`/cuadernos/${NB}/chat`));

  const msg = `Smoke ${Date.now() % 10000}`;
  await page.getByPlaceholder(/Pregunta sobre tus fuentes/).fill(msg);
  await page.getByRole('button', { name: 'Enviar pregunta' }).click();
  await expect(page.getByText(msg).first()).toBeVisible();
  await expect(page.getByPlaceholder(/Pregunta sobre tus fuentes/)).toHaveValue('');

  for (const [slug, re] of [['fuentes', /Resumen del cuaderno/], ['materiales', /Crear material/]] as const) {
    await page.goto(`/cuadernos/${NB}/${slug}`);
    await waitSettled(page);
    await expect(page.getByRole('heading', { name: re }).or(page.getByText(re).first()).first()).toBeVisible();
  }

  await page.goto('/progreso');
  await waitSettled(page);
  await expect(page).toHaveURL(/\/progreso$/);
  expect([...new Set(errors)], 'runtime errors').toEqual([]);
});
