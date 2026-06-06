/**
 * SPRINT N+1 – PIM Edit Employee > Report-to
 * Funcionalidad: Asignación de supervisor / subordinados (usuario Admin)
 *
 * CP-016  [SMOKE]      La pestaña Report-to carga correctamente
 * CP-017  [REGRESSION] La sección "Supervisors" es visible y tiene botón Add
 * CP-018  [REGRESSION] Abrir formulario de nuevo supervisor muestra los campos necesarios
 * CP-019               El botón Cancel en el formulario de supervisor cierra sin guardar
 * CP-020  [SMOKE]      La sección "Subordinates" es visible
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

async function navigateToReportTo(page: any) {
  await page.goto(`${BASE_URL}/web/index.php/pim/viewEmployeeList`);
  await page.waitForSelector('.oxd-table-row--clickable', { timeout: 15_000 });
  await page.locator('.oxd-table-row--clickable').first().click();
  await page.waitForURL('**/pim/viewPersonalDetails/**', { timeout: 15_000 });

  await page.locator('.orangehrm-tabs-item').filter({ hasText: /report.to/i }).click();
  await page.waitForLoadState('networkidle');
}

test.describe('Sprint N+1 – Edit Employee Report-to (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('CP-016 [SMOKE] La pestaña Report-to carga correctamente', async ({ page }) => {
    await navigateToReportTo(page);

    const heading = page.getByText('Supervisors').or(page.getByText('Report-to'));
    await expect(heading.first()).toBeVisible();
  });

  test('CP-017 [REGRESSION] La sección Supervisors tiene botón Add visible', async ({ page }) => {
    await navigateToReportTo(page);
    // La página Report-to tiene dos secciones: Supervisors y Subordinates.
    // El primer botón Add de la página corresponde a Supervisors.
    const addBtn = page.getByRole('button', { name: 'Add' }).first();
    await expect(addBtn).toBeVisible();
    // Verificar que el texto "Supervisors" está en la página
    await expect(page.getByText('Assigned Supervisors').first()).toBeVisible();
  });

  test('CP-018 [REGRESSION] Formulario de agregar supervisor muestra campos requeridos', async ({ page }) => {
    await navigateToReportTo(page);
    // Primer botón Add = sección Supervisors
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.waitForLoadState('networkidle');

    // Debe aparecer un autocomplete para buscar el empleado supervisor
    const autocomplete = page.locator('.oxd-autocomplete-text-input input').last();
    await expect(autocomplete).toBeVisible();

    // Debe haber un dropdown de Reporting Method
    const methodSelect = page.locator('.oxd-select-wrapper').last();
    await expect(methodSelect).toBeVisible();
  });

  test('CP-019 Cancel en formulario de supervisor no guarda cambios', async ({ page }) => {
    await navigateToReportTo(page);
    const initialRowCount = await page.locator('.oxd-table-row').count();

    // Abrir formulario de Supervisors (primer Add)
    await page.getByRole('button', { name: 'Add' }).first().click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Cancel' }).last().click();
    await page.waitForLoadState('networkidle');

    // El número de filas no debe haber aumentado
    const finalRowCount = await page.locator('.oxd-table-row').count();
    expect(finalRowCount).toBe(initialRowCount);
  });

  test('CP-020 [SMOKE] La sección Subordinates está presente en la página', async ({ page }) => {
    await navigateToReportTo(page);

    const pageText = await page.locator('body').textContent();
    expect(pageText).toMatch(/subordinates/i);
  });
});
