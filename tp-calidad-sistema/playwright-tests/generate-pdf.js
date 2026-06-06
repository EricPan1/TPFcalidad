'use strict';

// Genera Plan_de_Pruebas_General.pdf a partir de plan-pruebas.html
// Ejecutar con: docker compose run --rm pdf-generator
// (usa el contenedor Playwright que ya tiene Chromium instalado)

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
  const htmlSrc = '/work/plan-pruebas.html';
  const pdfOut  = '/work/Plan_de_Pruebas_General.pdf';

  if (!fs.existsSync(htmlSrc)) {
    console.error(`Error: no se encontró ${htmlSrc}`);
    process.exit(1);
  }

  console.log('Iniciando Chromium...');
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  console.log('Cargando plan-pruebas.html...');
  await page.goto(`file://${htmlSrc}`, { waitUntil: 'networkidle', timeout: 30_000 });

  console.log('Generando PDF...');
  await page.pdf({
    path: pdfOut,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    displayHeaderFooter: false,
  });

  await browser.close();

  const size = (fs.statSync(pdfOut).size / 1024).toFixed(0);
  console.log(`✔  PDF generado: Plan_de_Pruebas_General.pdf  (${size} KB)`);
})();
