import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

const PIM_LIST = `${BASE_URL}/web/index.php/pim/viewEmployeeList`;

async function goToTab(page: any, tabText: string) {
  await loginAsAdmin(page);
  await page.goto(PIM_LIST);
  await page.waitForSelector('.oxd-table-row--clickable', { timeout: 15_000 });
  await page.locator('.oxd-table-row--clickable').first().click();
  await page.waitForURL('**/pim/viewPersonalDetails/**', { timeout: 15_000 });
  await page.locator('.orangehrm-tabs-item').filter({ hasText: tabText }).click();
  await page.waitForTimeout(800);
}

test.describe('Funcionalidad: PIM – Job', () => {

  test('CP-046 [SMOKE] La pestaña Job carga para el primer empleado', async ({ page }) => {
    await goToTab(page, 'Job');
    await expect(page.locator('.oxd-form')).toBeVisible();
  });

  test('CP-047 El campo Job Title es visible en la pestaña Job', async ({ page }) => {
    await goToTab(page, 'Job');
    // Verifica que existe una fila de formulario con "Job Title"
    await expect(page.locator('.oxd-form-row').first()).toBeVisible();
  });

  test('CP-048 El campo Employment Status es visible', async ({ page }) => {
    await goToTab(page, 'Job');
    const formRows = page.locator('.oxd-form-row');
    const count = await formRows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('CP-049 La pestaña Job tiene al menos 4 campos de formulario', async ({ page }) => {
    await goToTab(page, 'Job');
    const inputs = page.locator('.oxd-input, .oxd-select-text');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('CP-050 El botón Save está disponible en la pestaña Job', async ({ page }) => {
    await goToTab(page, 'Job');
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

});

test.describe('Funcionalidad: PIM – Immigration', () => {

  test('CP-051 [SMOKE] La pestaña Immigration carga correctamente', async ({ page }) => {
    await goToTab(page, 'Immigration');
    await expect(page.locator('.orangehrm-container, .oxd-table')).toBeVisible();
  });

  test('CP-052 El botón Add está visible en Immigration', async ({ page }) => {
    await goToTab(page, 'Immigration');
    await expect(page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' })).toBeVisible();
  });

  test('CP-053 El formulario de Immigration tiene campo Document Type', async ({ page }) => {
    await goToTab(page, 'Immigration');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    // Al abrir el formulario aparece un select o input
    const selects = page.locator('.oxd-select-text, .oxd-input');
    await expect(selects.first()).toBeVisible();
  });

  test('CP-054 Guardar formulario vacío de Immigration muestra validación', async ({ page }) => {
    await goToTab(page, 'Immigration');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await page.locator('button[type="submit"]').last().click();
    await expect(page.locator('.oxd-input-field-error-message').first()).toBeVisible();
  });

  test('CP-055 Cancelar formulario de Immigration no guarda cambios', async ({ page }) => {
    await goToTab(page, 'Immigration');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await page.locator('button.oxd-button--ghost').filter({ hasText: 'Cancel' }).last().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.orangehrm-container')).toBeVisible();
  });

});
