/**
 * SPRINT N – PIM Add Employee
 * Funcionalidad: Alta de empleados (usuario Admin)
 *
 * CP-006  [SMOKE]      El formulario de alta carga con campos obligatorios
 * CP-007  [REGRESSION] Guardar con nombre y apellido crea el empleado
 * CP-008  [REGRESSION] Guardar sin datos muestra errores de validación
 * CP-009               El campo Employee ID viene pre-poblado automáticamente
 * CP-010               El botón Cancel regresa al listado sin crear empleado
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL, unique } from '../helpers/auth';

test.describe('Sprint N – Add Employee (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/web/index.php/pim/addEmployee`);
    await page.waitForLoadState('networkidle');
  });

  test('CP-006 [SMOKE] El formulario de alta carga correctamente', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Add Employee' })).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('CP-007 [REGRESSION] Crear empleado con datos mínimos obligatorios', async ({ page }) => {
    const firstName = unique('AutoTest');
    const lastName  = unique('QA');

    await page.fill('input[name="firstName"]', firstName);
    await page.fill('input[name="lastName"]', lastName);
    await page.getByRole('button', { name: 'Save' }).click();

    // Esperar redirección al perfil del empleado recién creado
    await page.waitForURL(`**\/pim\/viewPersonalDetails\/empNumber\/**`, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Personal Details' })).toBeVisible();

    // Limpieza: ir al listado y eliminar el empleado recién creado
    await page.goto(`${BASE_URL}/web/index.php/pim/viewEmployeeList`);
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('.oxd-autocomplete-text-input input').first();
    await nameInput.fill(firstName);
    await page.waitForTimeout(800);
    const dropdown = page.locator('.oxd-autocomplete-dropdown');
    if (await dropdown.isVisible()) {
      await dropdown.locator('span').first().click();
    }
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    const deleteBtn = page.locator('.oxd-table-row').first().locator('button').filter({ hasText: /delete/i });
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.getByRole('button', { name: 'Yes, Delete' }).click();
    }
  });

  test('CP-008 [REGRESSION] Guardar sin datos muestra errores de validación', async ({ page }) => {
    await page.getByRole('button', { name: 'Save' }).click();

    const errors = page.locator('.oxd-input-field-error-message, span.oxd-text--span');
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);

    const firstErrorText = (await errors.first().textContent())?.trim();
    expect(firstErrorText).toBeTruthy();
  });

  test('CP-009 El campo Employee ID se pre-popula automáticamente', async ({ page }) => {
    // El Employee ID es el segundo input de tipo texto en el formulario
    const empIdInput = page.locator('.oxd-form input.oxd-input').nth(1);
    const value = await empIdInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
    expect(Number(value)).toBeGreaterThan(0);
  });

  test('CP-010 El botón Cancel regresa al listado sin crear empleado', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'TemporalTest');
    await page.fill('input[name="lastName"]', 'ShouldNotSave');

    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForURL(`**\/pim\/viewEmployeeList`, { timeout: 15_000 });

    await expect(page.getByRole('heading', { name: 'Employee List' })).toBeVisible();
  });
});
