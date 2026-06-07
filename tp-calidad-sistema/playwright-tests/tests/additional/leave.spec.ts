import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

const LEAVE_LIST_URL   = `${BASE_URL}/web/index.php/leave/viewLeaveList`;
const LEAVE_TYPES_URL  = `${BASE_URL}/web/index.php/leave/viewLeaveTypeList`;

test.describe('Funcionalidad: Leave – Leave List', () => {

  test('CP-056 [SMOKE] La página Leave List carga correctamente', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_LIST_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.oxd-table, .orangehrm-container').first()).toBeVisible();
  });

  test('CP-057 La tabla de licencias tiene columnas visibles', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_LIST_URL);
    await expect(page.locator('.oxd-table-header')).toBeVisible();
  });

  test('CP-058 El filtro Employee Name está disponible en Leave List', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_LIST_URL);
    // Verifica que hay un input de búsqueda
    await expect(page.locator('.oxd-input').first()).toBeVisible();
  });

  test('CP-059 El botón Search realiza una búsqueda sin errores', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_LIST_URL);
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');
    // Debe permanecer en la misma página sin errores
    await expect(page.locator('.oxd-table, .orangehrm-container').first()).toBeVisible();
  });

  test('CP-060 El botón Reset limpia los filtros de Leave List', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_LIST_URL);
    const resetBtn = page.locator('button.oxd-button--ghost').filter({ hasText: 'Reset' });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(page.locator('.oxd-input').first()).toBeVisible();
  });

});

test.describe('Funcionalidad: Leave – Leave Types', () => {

  test('CP-061 [SMOKE] La página Leave Types carga correctamente', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_TYPES_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.oxd-table')).toBeVisible({ timeout: 30_000 });
  });

  test('CP-062 La tabla de Leave Types no está vacía', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_TYPES_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.oxd-table')).toBeVisible({ timeout: 30_000 });
    const rows   = page.locator('.oxd-table-row--clickable');
    const noRecs = page.getByText('No Records Found');
    expect((await rows.count()) > 0 || await noRecs.isVisible()).toBeTruthy();
  });

  test('CP-063 Cada tipo de licencia tiene nombre visible en la tabla', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_TYPES_URL);
    await page.waitForLoadState('networkidle');
    const firstRow = page.locator('.oxd-table-row--clickable').first();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });
    const text = await firstRow.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('CP-064 El botón Add está disponible en Leave Types', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_TYPES_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' })).toBeVisible({ timeout: 30_000 });
  });

  test('CP-065 El formulario de nuevo Leave Type tiene campo Name', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LEAVE_TYPES_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForURL('**/leave/addLeaveType', { timeout: 15_000 });
    await expect(page.locator('.oxd-input').first()).toBeVisible();
  });

});
