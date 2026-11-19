import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';

const PASSWORD = 'MiaTest123!';

for (const who of ['pro', 'free']) {
  setup(`login ${who}`, async ({ page }) => {
    fs.mkdirSync('e2e/.auth', { recursive: true });
    await page.goto('/');
    await page.getByLabel('Correo').fill(`${who}@mia.test`);
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await page.waitForURL(/\/cuadernos/, { timeout: 20_000 });
    await page.waitForTimeout(1000);
    await page.context().storageState({ path: `e2e/.auth/${who}.json` });
  });
}
