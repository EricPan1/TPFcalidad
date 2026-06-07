'use strict';

const fs = require('fs');
const path = require('path');
const HTMLtoDOCX = require('html-to-docx');

const WORK_DIR = '/work';
const OUTPUT = path.join(WORK_DIR, 'Documentacion_HTML_Consolidada.docx');

const SOURCES = [
  { file: 'plan-pruebas.html',        title: 'a) Plan de Pruebas General' },
  { file: 'casos-de-prueba.html',     title: 'b) Diseño de Casos de Prueba Frontend (Sprint N, N+1, N+2)' },
  { file: 'api-casos-de-prueba.html', title: 'c) Diseño de Casos de Prueba de la API del Clima' },
];

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1] : html;
}

function pageBreak() {
  return '<p style="page-break-before:always"> </p>';
}

function buildMergedHtml() {
  const parts = [];

  parts.push(`
    <h1 style="text-align:center;margin-top:120px;">Documentación de Procesos de Testing</h1>
    <h2 style="text-align:center;color:#6B7280;font-weight:normal;">
      Sistema OrangeHRM (Sprints N / N+1 / N+2 / N+3) + Weather API
    </h2>
    <p style="text-align:center;color:#7C3AED;"><em>Consigna 7 — Documento consolidado a partir de las fuentes HTML del proyecto</em></p>
    <p style="text-align:center;color:#6B7280;font-size:9pt;">
      Fusiona en un solo archivo: ${SOURCES.map(s => s.title).join(' · ')}
    </p>
  `);

  SOURCES.forEach((src, i) => {
    const fullPath = path.join(WORK_DIR, src.file);
    const html = fs.readFileSync(fullPath, 'utf-8');
    const body = extractBody(html);
    parts.push(pageBreak());
    parts.push(`<h1 style="color:#4C1D95;">${src.title}</h1>`);
    parts.push(`<p style="color:#6B7280;font-size:9pt;"><em>Fuente original: ${src.file}</em></p>`);
    parts.push(body);
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${parts.join('\n')}</body></html>`;
}

async function main() {
  const mergedHtml = buildMergedHtml();

  const buffer = await HTMLtoDOCX(mergedHtml, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
    title: 'Documentación de Procesos de Testing — Consigna 7',
    creator: 'Sistema QA – Taller de Calidad de Software',
  });

  fs.writeFileSync(OUTPUT, buffer);
  const kb = (fs.statSync(OUTPUT).size / 1024).toFixed(0);
  console.log(`✔  Documento generado: ${OUTPUT}  (${kb} KB)`);

  for (const src of SOURCES) {
    const fullPath = path.join(WORK_DIR, src.file);
    fs.unlinkSync(fullPath);
    console.log(`🗑  Eliminado: ${fullPath}`);
  }
}

main().catch(err => {
  console.error('❌  Error al generar el documento:', err.message);
  process.exit(1);
});
