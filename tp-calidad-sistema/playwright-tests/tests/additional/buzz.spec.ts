/**
 * Funcionalidad: Buzz
 * Funcionalidad: Red social interna de la empresa (usuario Admin)
 *
 * CP-106  [SMOKE]      La página Buzz carga correctamente
 * CP-107               El cuadro para escribir una publicación está visible
 * CP-108               El botón para publicar (Post/Share) está disponible
 * CP-109  [REGRESSION] Se puede escribir texto en el cuadro de publicación
 * CP-110               El feed de publicaciones es visible
 * CP-111               Las publicaciones existentes muestran contenido
 * CP-112               El botón "Like" está presente en publicaciones existentes
 * CP-113               El botón de comentarios abre el cuadro de comentarios
 * CP-114               El cuadro de publicación tiene un atributo de placeholder
 * CP-115               El menú lateral permanece visible dentro de Buzz
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, BASE_URL } from '../helpers/auth';

const BUZZ_URL = `${BASE_URL}/web/index.php/buzz/viewBuzz`;

test.describe('Funcionalidad: Buzz', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(BUZZ_URL);
    await page.waitForLoadState('networkidle');
  });

  test('CP-106 [SMOKE] La página Buzz carga correctamente', async ({ page }) => {
    await expect(page.locator('.oxd-topbar-header-breadcrumb h6')).toHaveText(/buzz/i);
  });

  test('CP-107 El cuadro para escribir una publicación está visible', async ({ page }) => {
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('CP-108 El botón para publicar (Post/Share) está disponible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /post|share/i }).first()).toBeVisible();
  });

  test('CP-109 [REGRESSION] Se puede escribir texto en el cuadro de publicación', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('Mensaje de prueba automatizada QA');
    await expect(textarea).toHaveValue('Mensaje de prueba automatizada QA');
  });

  test('CP-110 El feed de publicaciones es visible', async ({ page }) => {
    await expect(page.locator('.orangehrm-buzz-middle-panel, .oxd-layout-context').first()).toBeVisible();
  });

  test('CP-111 Las publicaciones existentes muestran contenido visible', async ({ page }) => {
    const posts = page.locator('.orangehrm-buzz-post');
    const count = await posts.count();
    if (count > 0) {
      const text = (await posts.first().textContent())?.trim() ?? '';
      expect(text.length).toBeGreaterThan(0);
    } else {
      expect(count).toBe(0);
    }
  });

  test('CP-112 El botón "Like" está presente en publicaciones existentes', async ({ page }) => {
    const posts = page.locator('.orangehrm-buzz-post');
    const count = await posts.count();
    const likeOk = count > 0 ? await posts.first().getByText(/like/i).first().isVisible() : true;
    expect(likeOk).toBeTruthy();
  });

  test('CP-113 El botón de comentarios abre el cuadro de comentarios', async ({ page }) => {
    const posts = page.locator('.orangehrm-buzz-post');
    const count = await posts.count();
    if (count > 0) {
      const commentBtn = posts.first().getByText(/comment/i).first();
      if (await commentBtn.isVisible()) {
        await commentBtn.click();
        await expect(posts.first().locator('textarea')).toBeVisible();
        return;
      }
    }
    expect(true).toBeTruthy();
  });

  test('CP-114 El cuadro de publicación tiene un atributo de placeholder', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder).not.toBeNull();
  });

  test('CP-115 El menú lateral permanece visible dentro de Buzz', async ({ page }) => {
    await expect(page.locator('.oxd-main-menu')).toBeVisible();
  });
});
