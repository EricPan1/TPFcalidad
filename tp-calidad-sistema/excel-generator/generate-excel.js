const ExcelJS = require('exceljs');
const fs = require('fs');

const INPUT  = '/work/playwright-report/results.json';
const OUTPUT = '/work/Casos_de_Prueba_OrangeHRM.xlsx';

// ── Colores que coinciden con el template ─────────────────────────────────────
const COLOR_HEADER_FILL = 'FF9B8DC8';   // morado del template
const COLOR_HEADER_FONT = 'FFFFFFFF';   // texto blanco
const COLOR_PASS_FILL   = 'FFE2EFDA';   // verde suave
const COLOR_FAIL_FILL   = 'FFFCE4D6';   // rojo suave
const COLOR_SKIP_FILL   = 'FFFFFED1';   // amarillo suave
const COLOR_ROW_ALT     = 'FFF2F2F2';   // gris alternado

if (!fs.existsSync(INPUT)) {
  console.error('❌  No se encontró results.json.');
  console.error('    Primero corré: docker compose run --rm e2e-tests');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

// ── Parseo del JSON de Playwright ─────────────────────────────────────────────
// Estructura: suites[file] → suites[describe] → specs[test]
const groups = [];

function walk(suites) {
  for (const suite of (suites || [])) {
    if (suite.specs && suite.specs.length > 0) {
      groups.push({
        name: suite.title,
        cases: suite.specs.map(spec => {
          const result  = spec.tests?.[0];
          const status  = result?.status ?? 'unknown';   // 'expected' | 'unexpected' | 'skipped'
          const retries = result?.results?.length ?? 0;
          return {
            id:      spec.title.split(' ')[0],            // "CP-026"
            title:   spec.title,
            status,
            retries,
          };
        }),
      });
    }
    walk(suite.suites);
  }
}

walk(raw.suites);

if (groups.length === 0) {
  console.error('❌  El archivo results.json no contiene resultados.');
  process.exit(1);
}

// ── Construcción del workbook ─────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator  = 'Sistema QA – Taller Calidad de Software';
wb.created  = new Date();

const ws = wb.addWorksheet('Casos de Prueba', {
  views: [{ state: 'frozen', ySplit: 1 }],
  properties: { defaultColWidth: 20 },
});

// Encabezado de columnas (fila 1)
ws.columns = [
  { header: 'Caso',       key: 'caso',    width: 22 },
  { header: 'Título',     key: 'titulo',  width: 75 },
  { header: 'Resultado',  key: 'result',  width: 16 },
  { header: 'Reintentos', key: 'retry',   width: 13 },
];

const headerRow = ws.getRow(1);
headerRow.eachCell(cell => {
  cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  cell.font   = { bold: true, color: { argb: COLOR_HEADER_FONT }, size: 11 };
  cell.border = makeBorder();
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
});
headerRow.height = 20;

// Filas de datos
let caseGlobal = 0;

groups.forEach((group, gi) => {
  // ── Fila de funcionalidad (cabecera morada) ──────────────────────────────
  const fRow = ws.addRow([
    `Funcionalidad ${gi + 1}: ${group.name}`,
    '',
    '',
    '',
  ]);
  fRow.height = 18;
  ws.mergeCells(fRow.number, 1, fRow.number, 4);
  const fCell = fRow.getCell(1);
  fCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  fCell.font      = { bold: true, color: { argb: COLOR_HEADER_FONT }, size: 10.5 };
  fCell.border    = makeBorder();
  fCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // ── Filas de casos ───────────────────────────────────────────────────────
  group.cases.forEach((c, ci) => {
    caseGlobal++;
    const isAlt  = ci % 2 === 1;
    const fillBg = c.status === 'expected'   ? COLOR_PASS_FILL
                 : c.status === 'unexpected' ? COLOR_FAIL_FILL
                 : c.status === 'skipped'    ? COLOR_SKIP_FILL
                 : isAlt                     ? COLOR_ROW_ALT
                 : 'FFFFFFFF';

    const resultLabel = c.status === 'expected'   ? '✓ PASÓ'
                      : c.status === 'unexpected' ? '✗ FALLÓ'
                      : c.status === 'skipped'    ? '⊘ SALTADO'
                      : c.status;

    const row = ws.addRow([
      `Caso ${ci + 1}`,
      c.title,
      resultLabel,
      c.retries > 1 ? c.retries - 1 : '',
    ]);
    row.height = 16;

    row.eachCell(cell => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillBg } };
      cell.border    = makeBorder();
      cell.alignment = { vertical: 'middle', wrapText: false };
    });

    // Colorear columna Resultado
    const resultCell = row.getCell(3);
    resultCell.font = {
      bold:  true,
      color: { argb: c.status === 'expected'   ? 'FF375623'
                    : c.status === 'unexpected' ? 'FF9C0006'
                    : 'FF7F7F00' },
    };
    resultCell.alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Fila separadora vacía entre grupos
  const sep = ws.addRow(['', '', '', '']);
  sep.height = 6;
});

// Fila de totales al final
const totals = groups.reduce((a, g) => {
  g.cases.forEach(c => {
    if (c.status === 'expected')   a.pass++;
    else if (c.status === 'unexpected') a.fail++;
    else a.skip++;
  });
  return a;
}, { pass: 0, fail: 0, skip: 0 });

ws.addRow(['', '', '', '']);
const totalRow = ws.addRow([
  `Total: ${caseGlobal} casos`,
  `${totals.pass} PASARON   ·   ${totals.fail} FALLARON   ·   ${totals.skip} SALTADOS`,
  '',
  '',
]);
ws.mergeCells(totalRow.number, 1, totalRow.number, 4);
totalRow.getCell(1).fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
totalRow.getCell(1).font  = { bold: true, size: 10.5 };
totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
totalRow.height = 18;

// ── Guardar ───────────────────────────────────────────────────────────────────
wb.xlsx.writeFile(OUTPUT).then(() => {
  console.log(`✔  Excel generado: ${OUTPUT}`);
  console.log(`   ${groups.length} funcionalidades · ${caseGlobal} casos`);
  console.log(`   ${totals.pass} PASARON  ${totals.fail} FALLARON  ${totals.skip} SALTADOS`);
}).catch(err => {
  console.error('❌  Error al generar el Excel:', err.message);
  process.exit(1);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeBorder() {
  const s = { style: 'thin', color: { argb: 'FFB8B8B8' } };
  return { top: s, left: s, bottom: s, right: s };
}
