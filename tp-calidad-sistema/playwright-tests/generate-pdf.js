'use strict';

// Uso:
//   node generate-pdf.js [html-source] [pdf-output]
//
// Ejemplos:
//   node generate-pdf.js /work/plan-pruebas.html   /work/Plan_de_Pruebas_General.pdf
//   node generate-pdf.js /work/casos-de-prueba.html /work/Casos_de_Prueba_Frontend.pdf

const { chromium } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

(async () => {
  const htmlSrc = process.argv[2] || '/work/plan-pruebas.html';
  const pdfOut  = process.argv[3] || '/work/Plan_de_Pruebas_General.pdf';

  if (!fs.existsSync(htmlSrc)) {
    console.error(`Error: no se encontró ${htmlSrc}`);
    process.exit(1);
  }

  console.log(`Fuente : ${htmlSrc}`);
  console.log(`Destino: ${pdfOut}`);
  console.log('Iniciando Chromium...');

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  await page.goto(`file://${htmlSrc}`, { waitUntil: 'networkidle', timeout: 30_000 });

  // Esperar que los scripts de render terminen (para HTML con JS dinámico)
  await page.waitForTimeout(1000);

  await page.pdf({
    path: pdfOut,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    displayHeaderFooter: false,
  });

  await browser.close();

  const kb = (fs.statSync(pdfOut).size / 1024).toFixed(0);
  console.log(`\n✔  PDF generado: ${path.basename(pdfOut)}  (${kb} KB)`);
})();
