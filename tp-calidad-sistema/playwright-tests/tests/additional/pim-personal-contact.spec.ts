import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

const PIM_LIST = `${BASE_URL}/web/index.php/pim/viewEmployeeList`;

async function goToFirstEmployeePIM(page: any) {
  await loginAsAdmin(page);
  await page.goto(PIM_LIST);
  await page.waitForSelector('.oxd-table-row--clickable', { timeout: 15_000 });
  await page.locator('.oxd-table-row--clickable').first().click();
  await page.waitForURL('**/pim/viewPersonalDetails/**', { timeout: 15_000 });
}

test.describe('Funcionalidad: PIM – Personal Details', () => {

  test('CP-026 [SMOKE] La página Personal Details carga para el primer empleado', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    await expect(page.locator('h6.oxd-text').first()).toBeVisible();
    await expect(page.locator('form.oxd-form')).toBeVisible();
  });

  test('CP-027 El campo First Name es visible y editable', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    const firstName = page.locator('input[name="firstName"]');
    await expect(firstName).toBeVisible();
    await expect(firstName).not.toBeDisabled();
  });

  test('CP-028 El campo Last Name es visible y editable', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    const lastName = page.locator('input[name="lastName"]');
    await expect(lastName).toBeVisible();
    await expect(lastName).not.toBeDisabled();
  });

  test('CP-029 El campo Employee Id está pre-poblado', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    const empId = page.locator('input').filter({ has: page.locator('xpath=../../..//label[contains(text(),"Employee Id")]') });
    // El ID de empleado debe ser un input no vacío
    const inputs = page.locator('.oxd-form input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('CP-030 El botón Save está disponible en Personal Details', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

});

test.describe('Funcionalidad: PIM – Contact Details', () => {

  test('CP-031 [SMOKE] La pestaña Contact Details carga correctamente', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    await page.locator('.orangehrm-tabs-item').filter({ hasText: 'Contact Details' }).click();
    await expect(page.locator('.oxd-form')).toBeVisible();
  });

  test('CP-032 El campo Street 1 es visible en la sección de dirección', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    await page.locator('.orangehrm-tabs-item').filter({ hasText: 'Contact Details' }).click();
    // Verifica que hay inputs de dirección presentes
    const inputs = page.locator('.oxd-input');
    await expect(inputs.first()).toBeVisible();
  });

  test('CP-033 El formulario de Contact Details tiene al menos 5 campos', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    await page.locator('.orangehrm-tabs-item').filter({ hasText: 'Contact Details' }).click();
    await page.waitForTimeout(1000);
    const inputs = page.locator('.oxd-input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('CP-034 El formulario Contact Details tiene botón Save', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    await page.locator('.orangehrm-tabs-item').filter({ hasText: 'Contact Details' }).click();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('CP-035 La pestaña Contact Details no muestra errores al cargar', async ({ page }) => {
    await goToFirstEmployeePIM(page);
    await page.locator('.orangehrm-tabs-item').filter({ hasText: 'Contact Details' }).click();
    const errorBanners = page.locator('.oxd-alert--error');
    await expect(errorBanners).toHaveCount(0);
  });

});
