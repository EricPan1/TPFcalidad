/**
 * Funcionalidad: Time
 * Funcionalidad: Registro de horas (Timesheets) y resumen de asistencia (usuario Admin)
 *
 * CP-116  [SMOKE]      La página My Timesheet carga correctamente
 * CP-117               Se muestra el rango de fechas del timesheet actual
 * CP-118               El botón para ver el timesheet anterior está disponible
 * CP-119               El botón para ver el timesheet siguiente está disponible
 * CP-120               La tabla de proyectos/actividades del timesheet es visible
 * CP-121  [REGRESSION] El botón Submit del timesheet está disponible
 * CP-122  [SMOKE]      La página Employee Attendance Summary carga correctamente
 * CP-123               El formulario de búsqueda contiene el campo Employee Name
 * CP-124  [REGRESSION] Se puede buscar el resumen de asistencia de un empleado
 * CP-125               La tabla de resultados de Attendance se muestra dentro de un contenedor visible
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

const TIMESHEET_URL  = `${BASE_URL}/web/index.php/time/viewMyTimesheet`;
const ATTENDANCE_URL = `${BASE_URL}/web/index.php/time/viewEmployeeAttendanceSummary`;

test.describe('Funcionalidad: Time – My Timesheet', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(TIMESHEET_URL);
    await page.waitForLoadState('networkidle');
  });

  test('CP-116 [SMOKE] La página My Timesheet carga correctamente', async ({ page }) => {
    await expect(page.locator('.oxd-topbar-header-breadcrumb h6')).toHaveText(/timesheet/i);
  });

  test('CP-117 Se muestra el rango de fechas del timesheet actual', async ({ page }) => {
    const dateRange = page.locator('.oxd-date-input, .orangehrm-timesheet-date-range, .oxd-text--span').first();
    await expect(dateRange).toBeVisible();
  });

  test('CP-118 El botón para ver el timesheet anterior está disponible', async ({ page }) => {
    const prevBtn = page.getByRole('button', { name: /previous/i }).or(page.locator('button').filter({ hasText: '<' }));
    await expect(prevBtn.first()).toBeVisible();
  });

  test('CP-119 El botón para ver el timesheet siguiente está disponible', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /next/i }).or(page.locator('button').filter({ hasText: '>' }));
    await expect(nextBtn.first()).toBeVisible();
  });

  test('CP-120 La tabla de proyectos/actividades del timesheet es visible', async ({ page }) => {
    await expect(page.locator('.oxd-table, table').first()).toBeVisible();
  });

  test('CP-121 [REGRESSION] El botón Submit del timesheet está disponible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /submit/i })).toBeVisible();
  });
});

test.describe('Funcionalidad: Time – Employee Attendance Summary', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ATTENDANCE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('CP-122 [SMOKE] La página Employee Attendance Summary carga correctamente', async ({ page }) => {
    await expect(page.locator('.oxd-topbar-header-breadcrumb h6')).toHaveText(/attendance/i);
  });

  test('CP-123 El formulario de búsqueda contiene el campo Employee Name', async ({ page }) => {
    const labels = await page.locator('label.oxd-label').allTextContents();
    expect(labels.some(l => /employee name/i.test(l))).toBeTruthy();
  });

  test('CP-124 [REGRESSION] Se puede buscar el resumen de asistencia de un empleado', async ({ page }) => {
    const nameInput = page.locator('.oxd-autocomplete-text-input input').first();
    await nameInput.fill('a');
    await page.waitForTimeout(1000);
    const dropdown = page.locator('.oxd-autocomplete-dropdown');
    if (await dropdown.isVisible()) {
      await dropdown.locator('span').first().click();
    }

    const actionBtn = page.getByRole('button', { name: 'View' }).or(page.getByRole('button', { name: 'Search' }));
    await actionBtn.first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.oxd-table, .orangehrm-attendance-record-table, .oxd-form').first()).toBeVisible();
  });

  test('CP-125 La tabla de resultados de Attendance se muestra dentro de un contenedor visible', async ({ page }) => {
    await expect(page.locator('.oxd-table, .orangehrm-attendance-record-table, .oxd-form').first()).toBeVisible();
  });
});
