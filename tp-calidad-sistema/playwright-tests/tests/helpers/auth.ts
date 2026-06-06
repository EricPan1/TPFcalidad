import { Page } from '@playwright/test';

export const BASE_URL =
  process.env.ORANGEHRM_URL || 'https://opensource-demo.orangehrmlive.com';

/**
 * Garantiza que la página está autenticada como Admin.
 * Con storageState en playwright.config el contexto ya viene logueado,
 * por lo que esta función solo navega al dashboard (~500ms en lugar de ~5s).
 * Si la sesión venció, hace el login completo como fallback.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  if (page.url().includes('/dashboard/index')) return;

  await page.goto(`${BASE_URL}/web/index.php/dashboard/index`);

  if (page.url().includes('/auth/login')) {
    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`**\/dashboard\/index`, { timeout: 30_000 });
  }
}

export async function logout(page: Page): Promise<void> {
  await page.click('.oxd-userdropdown-tab');
  await page.click('text=Logout');
  await page.waitForURL(`**\/auth\/login`);
}

/** Genera un texto único usando timestamp para evitar colisiones en el demo compartido. */
export function unique(prefix: string): string {
  return `${prefix}_${Date.now()}`;
}
