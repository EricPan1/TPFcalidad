/**
 * SPRINT N+2 – Admin > User Management > Users > Add
 * Funcionalidad: Asignación de perfil/usuario a empleado existente (usuario Admin)
 *
 * CP-021  [SMOKE]      El listado de usuarios (Admin > Users) carga correctamente
 * CP-022  [REGRESSION] El formulario de alta de usuario contiene todos los campos
 * CP-023  [REGRESSION] Guardar formulario vacío muestra errores de validación
 * CP-024               Contraseñas que no coinciden muestran error de confirmación
 * CP-025  [SMOKE]      Se puede filtrar el listado de usuarios por rol
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

test.describe('Sprint N+2 – Admin Add User (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/web/index.php/admin/viewSystemUsers`);
    await page.waitForLoadState('networkidle');
  });

  test('CP-021 [SMOKE] El listado de usuarios carga correctamente', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'System Users' })).toBeVisible();

    const table = page.locator('.oxd-table');
    await expect(table).toBeVisible();

    const rows = page.locator('.oxd-table-body .oxd-table-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('CP-022 [REGRESSION] Formulario de alta contiene todos los campos requeridos', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForURL(`**\/admin\/saveSystemUser`, { timeout: 15_000 });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Add User' })).toBeVisible();

    // Verificar presencia de campos clave
    const labels = await page.locator('label.oxd-label').allTextContents();
    const normalized = labels.map(l => l.toLowerCase().trim());

    expect(normalized.some(l => l.includes('user role'))).toBeTruthy();
    expect(normalized.some(l => l.includes('employee name'))).toBeTruthy();
    expect(normalized.some(l => l.includes('status'))).toBeTruthy();
    expect(normalized.some(l => l.includes('username'))).toBeTruthy();
    expect(normalized.some(l => l.includes('password'))).toBeTruthy();
  });

  test('CP-023 [REGRESSION] Guardar formulario vacío muestra errores de validación', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForURL(`**\/admin\/saveSystemUser`, { timeout: 15_000 });
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Save' }).click();

    const errors = page.locator('.oxd-input-field-error-message');
    const count  = await errors.count();
    expect(count).toBeGreaterThan(0);

    // Los campos obligatorios muestran "Required"
    const texts = await errors.allTextContents();
    expect(texts.some(t => /required/i.test(t))).toBeTruthy();
  });

  test('CP-024 Contraseñas no coincidentes muestran error de confirmación', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForURL(`**\/admin\/saveSystemUser`, { timeout: 15_000 });
    await page.waitForLoadState('networkidle');

    // Completar campos mínimos para llegar a la validación de contraseña
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.first().fill('Admin@12345');
    await passwordInputs.last().fill('DiferentePass!99');

    await page.getByRole('button', { name: 'Save' }).click();

    const errors = page.locator('.oxd-input-field-error-message');
    const texts  = await errors.allTextContents();
    const hasMismatch = texts.some(t => /match|password/i.test(t));
    expect(hasMismatch).toBeTruthy();
  });

  test('CP-025 [SMOKE] Se puede filtrar el listado por User Role', async ({ page }) => {
    // Seleccionar el dropdown de User Role en el formulario de búsqueda
    const roleSelect = page.locator('.oxd-select-wrapper').first();
    await roleSelect.click();

    const adminOption = page.locator('.oxd-select-dropdown span').filter({ hasText: /^Admin$/ });
    await adminOption.click();

    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    // Verificar que el resultado tiene al menos un usuario con rol Admin
    const rows = page.locator('.oxd-table-body .oxd-table-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});
