import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth', 'admin.json');

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',

  // Cada archivo spec corre en paralelo en su propio worker.
  // Tests DENTRO de un mismo archivo corren en secuencia (safe para el demo compartido).
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 4,

  // Timeouts ajustados: el demo responde en <5s en condiciones normales
  timeout: 60_000,
  expect: { timeout: 15_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['allure-playwright', {
      detail: true,
      outputFolder: process.env.ALLURE_RESULTS_DIR || 'allure-results',
      suiteTitle: true,
    }],
  ],

  use: {
    baseURL: process.env.ORANGEHRM_URL || 'https://opensource-demo.orangehrmlive.com',
    // Reutiliza la sesion guardada por globalSetup en todos los tests
    storageState: AUTH_FILE,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
