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
  await page.waitForLoadState('networkidle');

  // Ir al primer empleado editable
  const firstRow   = page.locator('.oxd-table-body .oxd-table-row').first();
  const editButton = firstRow.locator('button i.bi-pencil-fill').first()
    .or(firstRow.locator('[data-v-*] button').first());

  // Navegar directamente al employee editable usando el link de edición
  const editLinks = firstRow.locator('a[href*="viewPersonalDetails"]');
  if (await editLinks.count() > 0) {
    await editLinks.first().click();
  } else {
    await firstRow.locator('button').first().click();
  }
  await page.waitForLoadState('networkidle');

  // Buscar y hacer clic en la pestaña Report-to
  const reportToTab = page.locator('a.orangehrm-tabs-item, [role="tab"]')
    .filter({ hasText: /report.to/i });
  await reportToTab.first().click();
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

    const supervisorsSection = page.locator('.orangehrm-card-container')
      .filter({ hasText: /supervisors/i }).first();

    await expect(supervisorsSection).toBeVisible();

    const addBtn = supervisorsSection.getByRole('button', { name: 'Add' });
    await expect(addBtn).toBeVisible();
  });

  test('CP-018 [REGRESSION] Formulario de agregar supervisor muestra campos requeridos', async ({ page }) => {
    await navigateToReportTo(page);

    const supervisorsSection = page.locator('.orangehrm-card-container')
      .filter({ hasText: /supervisors/i }).first();

    await supervisorsSection.getByRole('button', { name: 'Add' }).click();
    await page.waitForLoadState('networkidle');

    // Debe aparecer un campo de búsqueda de empleado (autocomplete)
    const autocomplete = page.locator('.oxd-autocomplete-text-input input').last();
    await expect(autocomplete).toBeVisible();

    // Debe haber un dropdown de método de reporte
    const methodSelect = page.locator('.oxd-select-wrapper').last();
    await expect(methodSelect).toBeVisible();
  });

  test('CP-019 Cancel en formulario de supervisor no guarda cambios', async ({ page }) => {
    await navigateToReportTo(page);

    const supervisorsSection = page.locator('.orangehrm-card-container')
      .filter({ hasText: /supervisors/i }).first();

    const initialRowCount = await supervisorsSection.locator('.oxd-table-row').count();

    await supervisorsSection.getByRole('button', { name: 'Add' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Cancel' }).last().click();
    await page.waitForLoadState('networkidle');

    const finalRowCount = await supervisorsSection.locator('.oxd-table-row').count();
    expect(finalRowCount).toBe(initialRowCount);
  });

  test('CP-020 [SMOKE] La sección Subordinates está presente en la página', async ({ page }) => {
    await navigateToReportTo(page);

    const pageText = await page.locator('body').textContent();
    expect(pageText).toMatch(/subordinates/i);
  });
});
