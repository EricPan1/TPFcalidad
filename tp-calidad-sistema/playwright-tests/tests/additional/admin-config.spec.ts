import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

const JOB_TITLES_URL   = `${BASE_URL}/web/index.php/admin/viewJobTitleList`;
const LOCATIONS_URL    = `${BASE_URL}/web/index.php/admin/viewLocations`;
const NATIONALITIES_URL = `${BASE_URL}/web/index.php/admin/viewNationalityList`;

test.describe('Funcionalidad: Admin – Job Titles', () => {

  test('CP-066 [SMOKE] La página Job Titles carga correctamente', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(JOB_TITLES_URL);
    await expect(page.locator('.oxd-table')).toBeVisible();
  });

  test('CP-067 La tabla de Job Titles no está vacía', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(JOB_TITLES_URL);
    const rows = page.locator('.oxd-table-row--clickable');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('CP-068 El botón Add Job Title está disponible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(JOB_TITLES_URL);
    await expect(page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' })).toBeVisible();
  });

  test('CP-069 El formulario de Job Title tiene campo Job Title', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(JOB_TITLES_URL);
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForURL('**/admin/saveJobTitle', { timeout: 10_000 });
    await expect(page.locator('.oxd-input').first()).toBeVisible();
  });

  test('CP-070 Guardar formulario vacío de Job Title muestra validación', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(JOB_TITLES_URL);
    await page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' }).click();
    await page.waitForURL('**/admin/saveJobTitle', { timeout: 10_000 });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.oxd-input-field-error-message').first()).toBeVisible();
  });

});

test.describe('Funcionalidad: Admin – Locations', () => {

  test('CP-071 [SMOKE] La página Locations carga correctamente', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LOCATIONS_URL);
    await expect(page.locator('.oxd-table')).toBeVisible();
  });

  test('CP-072 La tabla de Locations no está vacía', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LOCATIONS_URL);
    const rows = page.locator('.oxd-table-row--clickable');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('CP-073 Se puede buscar una Location por nombre', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LOCATIONS_URL);
    await page.locator('.oxd-input').first().fill('Head');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.oxd-table')).toBeVisible();
  });

  test('CP-074 El botón Add Location está disponible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LOCATIONS_URL);
    await expect(page.locator('button.oxd-button--secondary').filter({ hasText: 'Add' })).toBeVisible();
  });

  test('CP-075 El botón Reset limpia la búsqueda de Locations', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(LOCATIONS_URL);
    await page.locator('.oxd-input').first().fill('XYZ');
    const resetBtn = page.locator('button.oxd-button--ghost').filter({ hasText: 'Reset' });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    const inputValue = await page.locator('.oxd-input').first().inputValue();
    expect(inputValue).toBe('');
  });

});
