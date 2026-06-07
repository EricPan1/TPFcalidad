/**
 * Funcionalidad: Dashboard
 * Funcionalidad: Vista principal al iniciar sesión (usuario Admin)
 *
 * CP-076  [SMOKE]      El Dashboard carga y muestra widgets
 * CP-077               El widget "Time at Work" es visible
 * CP-078               El widget "My Actions" es visible
 * CP-079  [REGRESSION] El widget "Quick Launch" muestra accesos directos
 * CP-080               El widget "Employees on Leave Today" es visible
 * CP-081               El widget "Employee Distribution by Sub Unit" es visible
 * CP-082  [SMOKE]      El logo de OrangeHRM aparece en el encabezado
 * CP-083  [REGRESSION] El menú lateral incluye los módulos principales
 * CP-084               El nombre del usuario aparece en el menú superior
 * CP-085               La cabecera muestra el título "Dashboard"
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

const DASHBOARD_URL = `${BASE_URL}/web/index.php/dashboard/index`;

test.describe('Funcionalidad: Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
  });

  test('CP-076 [SMOKE] El Dashboard carga y muestra widgets', async ({ page }) => {
    await expect(page.locator('.oxd-topbar-header-breadcrumb')).toBeVisible();
    const widgets = page.locator('.orangehrm-dashboard-widget');
    expect(await widgets.count()).toBeGreaterThan(0);
  });

  test('CP-077 El widget "Time at Work" es visible', async ({ page }) => {
    await expect(page.getByText('Time at Work').first()).toBeVisible();
  });

  test('CP-078 El widget "My Actions" es visible', async ({ page }) => {
    await expect(page.getByText('My Actions').first()).toBeVisible();
  });

  test('CP-079 [REGRESSION] El widget "Quick Launch" muestra accesos directos', async ({ page }) => {
    const quickLaunch = page.locator('.orangehrm-dashboard-widget').filter({ hasText: 'Quick Launch' });
    await expect(quickLaunch.first()).toBeVisible();
    const shortcuts = quickLaunch.first().locator('.oxd-grid-item, button, a');
    expect(await shortcuts.count()).toBeGreaterThan(0);
  });

  test('CP-080 El widget "Employees on Leave Today" es visible', async ({ page }) => {
    await expect(page.getByText('Employees on Leave Today').first()).toBeVisible();
  });

  test('CP-081 El widget "Employee Distribution by Sub Unit" es visible', async ({ page }) => {
    await expect(page.getByText(/Employee Distribution/i).first()).toBeVisible();
  });

  test('CP-082 [SMOKE] El logo de OrangeHRM aparece en el encabezado', async ({ page }) => {
    await expect(page.locator('.oxd-brand-banner img, .oxd-brand-logo').first()).toBeVisible();
  });

  test('CP-083 [REGRESSION] El menú lateral incluye los módulos principales', async ({ page }) => {
    const menu = page.locator('.oxd-main-menu');
    await expect(menu).toBeVisible();
    const text = (await menu.textContent())?.toLowerCase() ?? '';
    expect(text).toMatch(/admin/);
    expect(text).toMatch(/pim/);
    expect(text).toMatch(/leave/);
  });

  test('CP-084 El nombre del usuario aparece en el menú superior', async ({ page }) => {
    const userDropdown = page.locator('.oxd-userdropdown-name');
    await expect(userDropdown).toBeVisible();
    const name = (await userDropdown.textContent())?.trim() ?? '';
    expect(name.length).toBeGreaterThan(0);
  });

  test('CP-085 La cabecera muestra el título "Dashboard"', async ({ page }) => {
    await expect(page.locator('.oxd-topbar-header-breadcrumb h6')).toHaveText(/dashboard/i);
  });
});
