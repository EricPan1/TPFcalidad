import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export const AUTH_FILE = path.join(__dirname, '.auth', 'admin.json');

const BASE_URL =
  process.env.ORANGEHRM_URL || 'https://opensource-demo.orangehrmlive.com';

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/web/index.php/auth/login`);
  await page.fill('input[name="username"]', 'Admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**\/dashboard\/index`, { timeout: 30_000 });

  await page.context().storageState({ path: AUTH_FILE });
  await browser.close();

  console.log('[global-setup] Sesion de Admin guardada en', AUTH_FILE);
}
