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

function extractError(test) {
  if (!test?.results?.length) return '';
  // Tomar el último intento (después de retries)
  const lastResult = test.results[test.results.length - 1];
  if (!lastResult?.error) return '';
  // Quedarse solo con la primera línea del mensaje (sin el stack trace)
  const msg = lastResult.error.message || '';
  const firstLine = msg.split('\n').find(l => l.trim().length > 0) || '';
  // Limpiar códigos ANSI de color
  return firstLine.replace(/\[[0-9;]*m/g, '').trim();
}

// Traduce el mensaje técnico de Playwright a una descripción en lenguaje
// humano, pensada para copiar/pegar como descripción de una tarjeta de Trello.
function humanizeError(msg) {
  if (!msg) return '';

  if (/strict mode violation.*resolved to (\d+) element/i.test(msg)) {
    const n = msg.match(/resolved to (\d+) element/i)?.[1] ?? 'varios';
    return `El selector usado encontró ${n} elementos en la página en lugar de uno solo `
         + `(selector ambiguo). Hay que revisar la pantalla y hacer el selector más específico `
         + `para que apunte a un único elemento.`;
  }

  if (/toBeGreaterThan.*\n?[\s\S]*Received:\s*0/i.test(msg) || /Expected:\s*>\s*0[\s\S]*Received:\s*0/i.test(msg)) {
    return `Se esperaba encontrar al menos un resultado/elemento en la lista o tabla, `
         + `pero apareció vacía. Puede que los datos de prueba no estén cargados, que el `
         + `filtro no devuelva nada, o que la página no haya terminado de cargar.`;
  }

  if (/Timed out[\s\S]*toBeVisible[\s\S]*getByRole\('heading'/i.test(msg) || /Timed out[\s\S]*toBeVisible[\s\S]*heading/i.test(msg)) {
    const name = msg.match(/name:\s*['"]([^'"]+)['"]/i)?.[1];
    return `No apareció en pantalla el título/encabezado${name ? ` "${name}"` : ''} esperado `
         + `dentro del tiempo límite. Puede que el texto haya cambiado en la aplicación, `
         + `que la página tarde más en cargar, o que ya no se muestre como encabezado.`;
  }

  if (/locator\.click:\s*Timeout|Timed out[\s\S]*waiting for locator[\s\S]*\.click/i.test(msg)) {
    return `No se pudo hacer clic en el botón/elemento porque no apareció (o no quedó `
         + `habilitado) a tiempo en la pantalla. Conviene revisar si el selector sigue `
         + `siendo correcto o si hace falta esperar a que cargue algo antes de hacer clic.`;
  }

  if (/Timed out[\s\S]*toBeVisible/i.test(msg)) {
    return `Un elemento que el test espera ver en pantalla no llegó a aparecer dentro `
         + `del tiempo límite. Puede que el selector ya no coincida con nada, que la `
         + `pantalla cambió de diseño, o que la carga haya tardado más de lo normal.`;
  }

  if (/toHaveURL|waitForURL/i.test(msg)) {
    return `Después de la acción, la página no navegó a la dirección (URL) que el test `
         + `esperaba. Puede que el flujo cambió de pantalla, que hubo un error al guardar, `
         + `o que la navegación tardó demasiado.`;
  }

  if (/toHaveText|toHaveValue|toContainText|Expected (string|substring)/i.test(msg)) {
    return `El texto o valor mostrado en pantalla no coincide con lo que el test esperaba. `
         + `Conviene comparar el valor esperado contra lo que realmente muestra la aplicación `
         + `y actualizar el test o revisar si hay un error en la funcionalidad.`;
  }

  if (/toBeTruthy|toBeFalsy/i.test(msg)) {
    return `Una condición que el test verificaba no se cumplió (se esperaba algo presente/ `
         + `activo y no lo estaba, o viceversa). Hay que revisar manualmente esa pantalla `
         + `para confirmar si es un error real de la aplicación o un cambio en el comportamiento.`;
  }

  if (/net::ERR|ERR_CONNECTION|ECONNREFUSED|net::|socket hang up/i.test(msg)) {
    return `Hubo un problema de conexión con la aplicación durante la prueba (no respondió `
         + `o se cortó la conexión). Conviene reintentar la ejecución y revisar que el `
         + `entorno/servidor esté disponible y estable.`;
  }

  // Mensaje genérico de respaldo: limpiar y acortar la primera línea técnica.
  const clean = msg.replace(/\s+/g, ' ').trim();
  const short = clean.length > 220 ? `${clean.slice(0, 220)}…` : clean;
  return `Fallo inesperado durante la ejecución del test: "${short}". Revisar capturas, `
       + `video y traza adjuntos en el reporte para entender qué pasó en pantalla.`;
}

function walk(suites) {
  for (const suite of (suites || [])) {
    if (suite.specs && suite.specs.length > 0) {
      groups.push({
        name: suite.title,
        cases: suite.specs.map(spec => {
          const test    = spec.tests?.[0];
          const status  = test?.status ?? 'unknown';
          const retries = (test?.results?.length ?? 1) - 1;
          const error   = status === 'unexpected' ? extractError(test) : '';
          return {
            title: spec.title,
            status,
            retries,
            error,
            humanError: status === 'unexpected' ? humanizeError(error) : '',
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
  { header: 'Caso',                          key: 'caso',    width: 22 },
  { header: 'Título',                        key: 'titulo',  width: 70 },
  { header: 'Resultado',                     key: 'result',  width: 14 },
  { header: 'Detalle del fallo (técnico)',   key: 'error',   width: 60 },
  { header: 'Descripción para Trello',       key: 'human',   width: 70 },
  { header: 'Reintentos',                    key: 'retry',   width: 13 },
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
    '', '', '', '', '',
  ]);
  fRow.height = 18;
  ws.mergeCells(fRow.number, 1, fRow.number, 6);
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
      c.error || '',
      c.humanError || '',
      c.retries > 0 ? c.retries : '',
    ]);
    row.height = c.error ? 50 : 16;

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

    // Columna Detalle del fallo (técnico) — texto en rojo oscuro si hay error
    const errorCell = row.getCell(4);
    if (c.error) {
      errorCell.font      = { color: { argb: 'FF9C0006' }, italic: true, size: 9 };
      errorCell.alignment = { vertical: 'middle', wrapText: true };
    }

    // Columna Descripción para Trello — texto en lenguaje simple, listo para copiar
    const humanCell = row.getCell(5);
    if (c.humanError) {
      humanCell.font      = { color: { argb: 'FF1F4E78' }, size: 10 };
      humanCell.alignment = { vertical: 'middle', wrapText: true };
    }

    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Fila separadora vacía entre grupos
  const sep = ws.addRow(['', '', '', '', '', '']);
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

ws.addRow(['', '', '', '', '', '']);
const totalRow = ws.addRow([
  `Total: ${caseGlobal} casos`,
  `${totals.pass} PASARON   ·   ${totals.fail} FALLARON   ·   ${totals.skip} SALTADOS`,
  '', '', '', '',
]);
ws.mergeCells(totalRow.number, 1, totalRow.number, 6);
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
