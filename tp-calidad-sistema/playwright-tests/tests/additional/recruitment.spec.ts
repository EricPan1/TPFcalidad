/**
 * Funcionalidad: Recruitment
 * Funcionalidad: Gestión de candidatos y vacantes (usuario Admin)
 *
 * CP-096  [SMOKE]      La página Candidates carga correctamente
 * CP-097               La tabla/lista de candidatos es visible
 * CP-098               El botón "Add" para agregar candidatos está disponible
 * CP-099  [REGRESSION] El formulario de alta de candidato contiene campos obligatorios
 * CP-100               Guardar formulario vacío de candidato muestra validación
 * CP-101               Se puede filtrar candidatos por Vacancy
 * CP-102               Se puede filtrar candidatos por Status
 * CP-103               El botón Reset limpia los filtros de candidatos
 * CP-104  [SMOKE]      La página Vacancies carga correctamente
 * CP-105               La tabla de Vacancies muestra filas o "No Records Found"
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

const CANDIDATES_URL = `${BASE_URL}/web/index.php/recruitment/viewCandidates`;
const VACANCIES_URL  = `${BASE_URL}/web/index.php/recruitment/viewJobVacancy`;

test.describe('Funcionalidad: Recruitment – Candidates', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(CANDIDATES_URL);
    await page.waitForLoadState('networkidle');
  });

  test('CP-096 [SMOKE] La página Candidates carga correctamente', async ({ page }) => {
    await expect(page.locator('.oxd-topbar-header-breadcrumb h6')).toHaveText(/candidates/i);
  });

  test('CP-097 La tabla/lista de candidatos es visible', async ({ page }) => {
    await expect(page.locator('.oxd-table, .orangehrm-container').first()).toBeVisible();
  });

  test('CP-098 El botón "Add" para agregar candidatos está disponible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
  });

  test('CP-099 [REGRESSION] El formulario de alta de candidato contiene campos obligatorios', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForLoadState('networkidle');

    const labels = (await page.locator('label.oxd-label').allTextContents()).map(l => l.toLowerCase().trim());
    expect(labels.some(l => l.includes('first name'))).toBeTruthy();
    expect(labels.some(l => l.includes('last name'))).toBeTruthy();
    expect(labels.some(l => l.includes('vacancy'))).toBeTruthy();
  });

  test('CP-100 Guardar formulario vacío de candidato muestra validación', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.oxd-input-field-error-message').first()).toBeVisible();
  });

  test('CP-101 Se puede filtrar candidatos por Vacancy', async ({ page }) => {
    const vacancySelect = page.locator('.oxd-select-wrapper').first();
    await vacancySelect.click();
    const dropdown = page.locator('.oxd-select-dropdown');
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    await dropdown.locator('span').first().click();

    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    const rows   = page.locator('.oxd-table-body .oxd-table-row');
    const noRecs = page.getByText('No Records Found');
    expect((await rows.count()) > 0 || await noRecs.isVisible()).toBeTruthy();
  });

  test('CP-102 Se puede filtrar candidatos por Status', async ({ page }) => {
    const statusSelect = page.locator('.oxd-select-wrapper').nth(1);
    await statusSelect.click();
    const dropdown = page.locator('.oxd-select-dropdown');
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    await dropdown.locator('span').first().click();

    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    const rows   = page.locator('.oxd-table-body .oxd-table-row');
    const noRecs = page.getByText('No Records Found');
    expect((await rows.count()) > 0 || await noRecs.isVisible()).toBeTruthy();
  });

  test('CP-103 El botón Reset limpia los filtros de candidatos', async ({ page }) => {
    const resetBtn = page.getByRole('button', { name: 'Reset' });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.oxd-table, .orangehrm-container').first()).toBeVisible();
  });
});

test.describe('Funcionalidad: Recruitment – Vacancies', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(VACANCIES_URL);
    await page.waitForLoadState('networkidle');
  });

  test('CP-104 [SMOKE] La página Vacancies carga correctamente', async ({ page }) => {
    await expect(page.locator('.oxd-topbar-header-breadcrumb h6')).toHaveText(/vacanc/i);
  });

  test('CP-105 La tabla de Vacancies muestra filas o el mensaje "No Records Found"', async ({ page }) => {
    const rows   = page.locator('.oxd-table-body .oxd-table-row');
    const noRecs = page.getByText('No Records Found');
    expect((await rows.count()) > 0 || await noRecs.isVisible()).toBeTruthy();
  });
});
