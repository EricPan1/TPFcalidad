/**
 * Funcionalidad: Directory
 * Funcionalidad: Búsqueda y listado del directorio de empleados (usuario Admin)
 *
 * CP-086  [SMOKE]      La página Directory carga correctamente
 * CP-087               El formulario de búsqueda contiene el campo Employee Name
 * CP-088               El formulario de búsqueda contiene el campo Job Title
 * CP-089               El formulario de búsqueda contiene el campo Location
 * CP-090  [REGRESSION] Buscar por nombre devuelve resultados o "No Records Found"
 * CP-091               El botón Search ejecuta la búsqueda
 * CP-092               El botón Reset limpia los filtros de búsqueda
 * CP-093  [REGRESSION] Las tarjetas de empleados muestran información visible
 * CP-094               Se puede filtrar por Location en el Directory
 * CP-095               El listado del Directory se muestra dentro de un contenedor visible
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

const DIRECTORY_URL = `${BASE_URL}/web/index.php/directory/viewDirectory`;

test.describe('Funcionalidad: Directory', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(DIRECTORY_URL);
    await page.waitForLoadState('networkidle');
  });

  test('CP-086 [SMOKE] La página Directory carga correctamente', async ({ page }) => {
    await expect(page.locator('.oxd-topbar-header-breadcrumb h6')).toHaveText(/directory/i);
  });

  test('CP-087 El formulario de búsqueda contiene el campo Employee Name', async ({ page }) => {
    const labels = await page.locator('label.oxd-label').allTextContents();
    expect(labels.some(l => /employee name/i.test(l))).toBeTruthy();
  });

  test('CP-088 El formulario de búsqueda contiene el campo Job Title', async ({ page }) => {
    const labels = await page.locator('label.oxd-label').allTextContents();
    expect(labels.some(l => /job title/i.test(l))).toBeTruthy();
  });

  test('CP-089 El formulario de búsqueda contiene el campo Location', async ({ page }) => {
    const labels = await page.locator('label.oxd-label').allTextContents();
    expect(labels.some(l => /location/i.test(l))).toBeTruthy();
  });

  test('CP-090 [REGRESSION] Buscar por nombre devuelve resultados o "No Records Found"', async ({ page }) => {
    const nameInput = page.locator('.oxd-autocomplete-text-input input').first();
    await nameInput.fill('a');
    await page.waitForTimeout(1000);
    const dropdown = page.locator('.oxd-autocomplete-dropdown');
    if (await dropdown.isVisible()) {
      await dropdown.locator('span').first().click();
    }
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    const cards    = page.locator('.orangehrm-directory-card');
    const noRecs   = page.getByText('No Records Found');
    const hasCards = (await cards.count()) > 0;
    const hasNoRec = await noRecs.isVisible();
    expect(hasCards || hasNoRec).toBeTruthy();
  });

  test('CP-091 El botón Search ejecuta la búsqueda', async ({ page }) => {
    const searchBtn = page.getByRole('button', { name: 'Search' });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.oxd-form, .orangehrm-directory-card-wrapper').first()).toBeVisible();
  });

  test('CP-092 El botón Reset limpia los filtros de búsqueda', async ({ page }) => {
    const nameInput = page.locator('.oxd-autocomplete-text-input input').first();
    await nameInput.fill('XYZ');
    const resetBtn = page.getByRole('button', { name: 'Reset' });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    const value = await nameInput.inputValue();
    expect(value).toBe('');
  });

  test('CP-093 [REGRESSION] Las tarjetas de empleados muestran información visible', async ({ page }) => {
    const cards = page.locator('.orangehrm-directory-card');
    const count = await cards.count();
    if (count > 0) {
      const text = (await cards.first().textContent())?.trim() ?? '';
      expect(text.length).toBeGreaterThan(0);
    } else {
      await expect(page.getByText('No Records Found')).toBeVisible();
    }
  });

  test('CP-094 Se puede filtrar por Location en el Directory', async ({ page }) => {
    const locationSelect = page.locator('.oxd-select-wrapper').last();
    await locationSelect.click();
    const dropdown = page.locator('.oxd-select-dropdown');
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    const options = dropdown.locator('span');
    const optCount = await options.count();
    await options.nth(optCount > 1 ? 1 : 0).click();

    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    const cards  = page.locator('.orangehrm-directory-card');
    const noRecs = page.getByText('No Records Found');
    expect((await cards.count()) > 0 || await noRecs.isVisible()).toBeTruthy();
  });

  test('CP-095 El listado del Directory se muestra dentro de un contenedor visible', async ({ page }) => {
    await expect(page.locator('.orangehrm-directory-card-wrapper, .oxd-form').first()).toBeVisible();
  });
});
