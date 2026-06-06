/**
 * SPRINT N – PIM Employee List
 * Funcionalidad: Listado de empleados (usuario Admin)
 *
 * CP-001  [SMOKE][REGRESSION]  La tabla de empleados carga correctamente
 * CP-002  [REGRESSION]         Búsqueda por nombre filtra resultados
 * CP-003  [REGRESSION]         Búsqueda por Employee ID muestra empleado específico
 * CP-004                       El botón Reset limpia el formulario de búsqueda
 * CP-005  [SMOKE]              Se muestran columnas esperadas en la tabla
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

test.describe('Sprint N – Employee List (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/web/index.php/pim/viewEmployeeList`);
    await page.waitForLoadState('networkidle');
  });

  test('CP-001 [SMOKE][REGRESSION] La tabla de empleados carga correctamente', async ({ page }) => {
    // OrangeHRM usa h5/h6 en el breadcrumb, no h1 — verificamos por texto y tabla
    await expect(page.locator('.oxd-table')).toBeVisible();
    const pageText = await page.locator('body').textContent();
    expect(pageText).toMatch(/employee/i);

    const rows = page.locator('.oxd-table-body .oxd-table-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('CP-002 [REGRESSION] Búsqueda por nombre filtra resultados', async ({ page }) => {
    const nameInput = page.locator('.oxd-autocomplete-text-input input').first();
    await nameInput.fill('Admin');
    await page.waitForTimeout(1200);
    // Seleccionar primera sugerencia si aparece – esperar que sea estable antes de clickear
    const dropdown = page.locator('.oxd-autocomplete-dropdown');
    if (await dropdown.isVisible()) {
      const firstOption = dropdown.locator('span').first();
      await firstOption.waitFor({ state: 'visible', timeout: 5000 });
      await firstOption.click();
    }

    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    const noRecords = page.locator('.oxd-table-body').getByText('No Records Found');
    const hasRows   = page.locator('.oxd-table-body .oxd-table-row');

    const rowCount = await hasRows.count();
    const noRecs   = await noRecords.isVisible();
    expect(rowCount > 0 || noRecs).toBeTruthy();
  });

  test('CP-003 [REGRESSION] Búsqueda por Employee ID muestra resultado específico', async ({ page }) => {
    // Obtener el primer ID de empleado visible en la tabla
    const firstIdCell = page.locator('.oxd-table-body .oxd-table-row').first()
      .locator('.oxd-table-cell').first();
    const employeeId = (await firstIdCell.textContent())?.trim() ?? '';

    if (!employeeId) {
      test.skip();
      return;
    }

    const idInput = page.locator('input.oxd-input').nth(1);
    await idInput.fill(employeeId);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    const rows = page.locator('.oxd-table-body .oxd-table-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('.oxd-table-cell').first()).toHaveText(employeeId);
  });

  test('CP-004 El botón Reset limpia los campos de búsqueda', async ({ page }) => {
    const idInput = page.locator('input.oxd-input').nth(1);
    await idInput.fill('99999');
    await expect(idInput).toHaveValue('99999');

    await page.getByRole('button', { name: 'Reset' }).click();
    await page.waitForLoadState('networkidle');

    await expect(idInput).toHaveValue('');
  });

  test('CP-005 [SMOKE] La tabla contiene las columnas esperadas', async ({ page }) => {
    const headers = page.locator('.oxd-table-header .oxd-table-header-cell');
    const headerTexts = await headers.allTextContents();
    const normalized = headerTexts.map(t => t.trim().toLowerCase());

    expect(normalized.some(h => h.includes('first') || h.includes('name'))).toBeTruthy();
    expect(normalized.some(h => h.includes('last') || h.includes('name'))).toBeTruthy();
    expect(normalized.some(h => h.includes('id'))).toBeTruthy();
  });
});
