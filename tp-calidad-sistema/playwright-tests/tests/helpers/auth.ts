import { Page } from '@playwright/test';

export const BASE_URL =
  process.env.ORANGEHRM_URL || 'https://opensource-demo.orangehrmlive.com';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/web/index.php/auth/login`);
  await page.fill('input[name="username"]', 'Admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**\/dashboard\/index`, { timeout: 30_000 });
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
