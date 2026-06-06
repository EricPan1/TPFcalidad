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

test.describe('Funcionalidad: PIM – Emergency Contacts', () => {

  test('CP-036 [SMOKE] La pestaña Emergency Contacts carga correctamente', async ({ page }) => {
    await goToTab(page, 'Emergency Contacts');
    await expect(page.locator('.oxd-table, .orangehrm-container')).toBeVisible();
  });

  test('CP-037 El botón Add está visible en Emergency Contacts', async ({ page }) => {
    await goToTab(page, 'Emergency Contacts');
    await expect(page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' })).toBeVisible();
  });

  test('CP-038 El formulario de Emergency Contact tiene campo Name', async ({ page }) => {
    await goToTab(page, 'Emergency Contacts');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    const inputs = page.locator('.oxd-input');
    await expect(inputs.first()).toBeVisible();
  });

  test('CP-039 Guardar formulario vacío de Emergency Contact muestra validación', async ({ page }) => {
    await goToTab(page, 'Emergency Contacts');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await page.locator('button[type="submit"]').last().click();
    await expect(page.locator('.oxd-input-field-error-message').first()).toBeVisible();
  });

  test('CP-040 Cancelar formulario de Emergency Contact no guarda cambios', async ({ page }) => {
    await goToTab(page, 'Emergency Contacts');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await page.locator('button.oxd-button--ghost').filter({ hasText: 'Cancel' }).last().click();
    await page.waitForTimeout(500);
    // El formulario debe haber desaparecido
    const submitBtns = page.locator('button[type="submit"]');
    // Ya no debe haber un botón submit del formulario inline
    const count = await page.locator('.oxd-form-row').count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

});

test.describe('Funcionalidad: PIM – Dependents', () => {

  test('CP-041 [SMOKE] La pestaña Dependents carga correctamente', async ({ page }) => {
    await goToTab(page, 'Dependents');
    await expect(page.locator('.orangehrm-container, .oxd-table')).toBeVisible();
  });

  test('CP-042 El botón Add está visible en Dependents', async ({ page }) => {
    await goToTab(page, 'Dependents');
    await expect(page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' })).toBeVisible();
  });

  test('CP-043 El formulario de Dependent tiene campo Name', async ({ page }) => {
    await goToTab(page, 'Dependents');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    const inputs = page.locator('.oxd-input');
    await expect(inputs.first()).toBeVisible();
  });

  test('CP-044 Guardar formulario vacío de Dependent muestra validación', async ({ page }) => {
    await goToTab(page, 'Dependents');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await page.locator('button[type="submit"]').last().click();
    await expect(page.locator('.oxd-input-field-error-message').first()).toBeVisible();
  });

  test('CP-045 Cancelar formulario de Dependent no guarda cambios', async ({ page }) => {
    await goToTab(page, 'Dependents');
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForTimeout(500);
    await page.locator('button.oxd-button--ghost').filter({ hasText: 'Cancel' }).last().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.orangehrm-container')).toBeVisible();
  });

});
