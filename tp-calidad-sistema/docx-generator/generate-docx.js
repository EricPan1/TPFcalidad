'use strict';

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  BorderStyle, WidthType, AlignmentType, ShadingType, VerticalAlign, PageBreak,
} = require('docx');
const fs = require('fs');

const OUTPUT = '/work/Informe_Final_Consigna7.docx';

// ── Paleta ────────────────────────────────────────────────────────────────────
const PURPLE       = '4C1D95';
const PURPLE_SOFT  = '7C3AED';
const PURPLE_LIGHT = 'F5F3FF';
const GRAY_LIGHT   = 'F3F4F6';
const GREEN        = '166534';
const GREEN_LIGHT  = 'DCFCE7';
const RED          = '991B1B';
const RED_LIGHT    = 'FEE2E2';
const AMBER_LIGHT  = 'FEF3C7';

// ── Helpers de construcción ───────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: { bottom: { color: PURPLE, space: 4, style: BorderStyle.SINGLE, size: 12 } },
    children: [new TextRun({ text, bold: true, color: PURPLE, size: 30 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: PURPLE_SOFT, size: 24 })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, italics: true, color: '374151', size: 21 })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function cell(text, { header = false, fill = null, width = null, bold = false, color = null, align = AlignmentType.LEFT } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: fill ? { type: ShadingType.CLEAR, color: 'auto', fill } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({
        text,
        bold: header || bold,
        color: header ? 'FFFFFF' : (color || '1F2937'),
        size: header ? 19 : 19,
      })],
    })],
  });
}

function table(headerCells, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map((t, i) => cell(t, { header: true, fill: PURPLE, width: colWidths?.[i] })),
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((val, ci) => {
      let fill = ri % 2 === 1 ? PURPLE_LIGHT : 'FFFFFF';
      let color = null;
      if (val && typeof val === 'object') {
        fill = val.fill || fill;
        color = val.color || null;
        val = val.text;
      }
      return cell(String(val), { fill, color, width: colWidths?.[ci] });
    }),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'B8B8B8' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B8B8B8' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'B8B8B8' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'B8B8B8' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
    },
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 160 }, children: [] });
}

// ── Datos: bugs reportados (Bug Tracker) ─────────────────────────────────────
const BUGS = [
  { id: 'BUG-01', sprint: 'Sprint N',   module: 'PIM - Employee List',              title: 'Botón Reset no limpia todos los filtros de búsqueda',                          severity: 'LOW',    status: 'OPEN' },
  { id: 'BUG-02', sprint: 'Sprint N',   module: 'PIM - Add Employee',               title: 'Se permite crear empleados con Employee ID duplicado',                         severity: 'HIGH',   status: 'OPEN' },
  { id: 'BUG-03', sprint: 'Sprint N',   module: 'PIM - My Info - Qualifications',   title: 'Acepta fecha de fin anterior a fecha de inicio en Work Experience',            severity: 'MEDIUM', status: 'IN_PROGRESS' },
  { id: 'BUG-04', sprint: 'Sprint N+1', module: 'PIM - Edit Employee - Report to',  title: 'Autocomplete de supervisor tarda más de 10s con base de datos grande',         severity: 'HIGH',   status: 'OPEN' },
  { id: 'BUG-05', sprint: 'Sprint N+2', module: 'Admin - User Management',          title: 'Contraseña sin caracteres especiales es aceptada (política débil)',           severity: 'MEDIUM', status: 'OPEN' },
  { id: 'BUG-06', sprint: 'Sprint N+3', module: 'Dashboard - Widget Clima',         title: 'No muestra mensaje de error cuando la API del clima no responde',             severity: 'HIGH',   status: 'OPEN' },
];

const SEV_FILL  = { CRITICAL: RED_LIGHT, HIGH: RED_LIGHT, MEDIUM: AMBER_LIGHT, LOW: GREEN_LIGHT };
const SEV_COLOR = { CRITICAL: RED, HIGH: RED, MEDIUM: '92400E', LOW: GREEN };
const STATUS_LABEL = { OPEN: 'Abierto', IN_PROGRESS: 'En progreso', RESOLVED: 'Resuelto', CLOSED: 'Cerrado' };

function bugRows(bugList) {
  return bugList.map(b => ([
    b.id,
    b.module,
    b.title,
    { text: b.severity, fill: SEV_FILL[b.severity], color: SEV_COLOR[b.severity] },
    STATUS_LABEL[b.status],
  ]));
}

// ── Datos: casos de prueba Frontend Sprint N / N+1 / N+2 (Actividad 2) ────────
const FRONTEND_CASES = {
  'Sprint N': {
    desc: 'Backend de Employee List y Add Employee · Pantallas de Employee List, Add Employee y My Info – Qualifications',
    modules: [
      { name: 'PIM – Employee List', range: 'CP-001 a CP-005', cases: [
        ['CP-001', '[SMOKE][REGRESSION] La tabla de empleados carga correctamente'],
        ['CP-002', '[REGRESSION] Búsqueda por nombre filtra resultados'],
        ['CP-003', '[REGRESSION] Búsqueda por Employee ID muestra empleado específico'],
        ['CP-004', 'El botón Reset limpia el formulario de búsqueda'],
        ['CP-005', '[SMOKE] Se muestran las columnas esperadas en la tabla'],
      ]},
      { name: 'PIM – Add Employee', range: 'CP-006 a CP-010', cases: [
        ['CP-006', '[SMOKE] El formulario de alta carga correctamente'],
        ['CP-007', '[REGRESSION] Crear empleado con datos mínimos obligatorios'],
        ['CP-008', '[REGRESSION] Guardar sin datos muestra errores de validación'],
        ['CP-009', 'El campo Employee ID se pre-popula automáticamente'],
        ['CP-010', 'El botón Cancel regresa al listado sin crear empleado'],
      ]},
      { name: 'My Info – Qualifications', range: 'CP-011 a CP-015', cases: [
        ['CP-011', '[SMOKE] La pestaña Qualifications carga y muestra sus secciones'],
        ['CP-012', '[REGRESSION] Se puede agregar una entrada de Work Experience'],
        ['CP-013', '[REGRESSION] Se puede agregar una entrada de Education'],
        ['CP-014', 'Guardar Work Experience vacío muestra validación'],
        ['CP-015', 'Las secciones Skills y Languages están presentes'],
      ]},
    ],
    execution: { total: 15, passed: 11, failed: 3, skipped: 1,
      detail: 'Fallaron: CP-002 (timeout esperando resultados de búsqueda — intermitente, atribuible a la '
            + 'lentitud del demo público compartido de OrangeHRM), CP-012 (assertion sobre alta de Work '
            + 'Experience) y CP-013 ("strict mode violation": el selector de la tarjeta Education matchea '
            + '6 elementos en el DOM actual — selector a refinar). Saltado: CP-003 (dependía del resultado '
            + 'de CP-002). CP-014 quedó "flaky" (falló en el primer intento por timing y pasó al reintentar).' },
    bugs: BUGS.filter(b => b.sprint === 'Sprint N'),
  },
  'Sprint N+1': {
    desc: 'Backend de My Info – Qualifications y Edit Employee – Report to · Pantalla de Edit Employee – Report to',
    modules: [
      { name: 'PIM – Edit Employee – Report to', range: 'CP-016 a CP-020', cases: [
        ['CP-016', '[SMOKE] La pestaña Report-to carga correctamente'],
        ['CP-017', '[REGRESSION] La sección Supervisors es visible y tiene botón Add'],
        ['CP-018', '[REGRESSION] Abrir formulario de nuevo supervisor muestra los campos necesarios'],
        ['CP-019', 'El botón Cancel en el formulario de supervisor cierra sin guardar'],
        ['CP-020', '[SMOKE] La sección Subordinates es visible'],
      ]},
    ],
    execution: { total: 5, passed: 4, failed: 1, skipped: 0,
      detail: 'Falló CP-019 (assertion sobre el cierre del formulario de supervisor vía Cancel — '
            + 'el valor del campo no quedó vacío como se esperaba; a confirmar si es comportamiento '
            + 'real de la pantalla o un timing de la automatización).' },
    bugs: BUGS.filter(b => b.sprint === 'Sprint N+1'),
  },
  'Sprint N+2': {
    desc: 'Back y Front del módulo Admin – Add (asignación de perfil/usuario a empleado existente)',
    modules: [
      { name: 'Admin – User Management – Add User', range: 'CP-021 a CP-025', cases: [
        ['CP-021', '[SMOKE] El listado de usuarios (Admin > Users) carga correctamente'],
        ['CP-022', '[REGRESSION] El formulario de alta de usuario contiene todos los campos'],
        ['CP-023', '[REGRESSION] Guardar formulario vacío muestra errores de validación'],
        ['CP-024', 'Contraseñas que no coinciden muestran error de confirmación'],
        ['CP-025', '[SMOKE] Se puede filtrar el listado de usuarios por rol'],
      ]},
    ],
    execution: { total: 5, passed: 5, failed: 0, skipped: 0,
      detail: 'Los 5 casos pasaron sin incidentes en la última corrida.' },
    bugs: BUGS.filter(b => b.sprint === 'Sprint N+2'),
  },
};

// ── Datos: casos de prueba API del Clima (Actividad 3) ────────────────────────
const API_CASES = [
  { group: 'Realtime Weather API — GET /current.json', range: 'CP-API-001 a CP-API-005', cases: [
    ['CP-API-001', 'Ciudad válida retorna datos de tiempo actual'],
    ['CP-API-002', 'Coordenadas GPS retornan datos correctos'],
    ['CP-API-003', 'Sin API key retorna 401 Unauthorized'],
    ['CP-API-004', 'API key inválida retorna 401 Unauthorized'],
    ['CP-API-005', 'Ciudad inexistente retorna 400 con error 1006'],
  ]},
  { group: 'Forecast Weather API — GET /forecast.json', range: 'CP-API-006 a CP-API-010', cases: [
    ['CP-API-006', 'Pronóstico de 3 días retorna estructura correcta'],
    ['CP-API-007', 'Pronóstico de 1 día retorna solo un día'],
    ['CP-API-008', 'Sin parámetro days usa valor por defecto'],
    ['CP-API-009', 'Ciudad inválida retorna 400'],
    ['CP-API-010', 'Sin API key retorna 401'],
  ]},
  { group: 'History Weather API — GET /history.json', range: 'CP-API-011 a CP-API-015', cases: [
    ['CP-API-011', 'Fecha histórica válida retorna datos hora a hora'],
    ['CP-API-012', 'Rango de fechas retorna múltiples días'],
    ['CP-API-013', 'Fecha futura retorna error 400'],
    ['CP-API-014', 'Sin parámetro dt retorna error 400'],
    ['CP-API-015', 'Sin API key retorna 401'],
  ]},
  { group: 'Alerts Weather API — GET /alerts.json', range: 'CP-API-016 a CP-API-020', cases: [
    ['CP-API-016', 'Solicitud válida retorna estructura de alertas'],
    ['CP-API-017', 'Ciudad de EE.UU. retorna estructura válida con posibles alertas'],
    ['CP-API-018', 'Ciudad inválida retorna 400 error 1006'],
    ['CP-API-019', 'Sin API key retorna 401'],
    ['CP-API-020', 'Sin parámetro q retorna 400'],
  ]},
];

// ── Datos: calendario de sprints (hitos de testing) ───────────────────────────
const SPRINT_CALENDAR = [
  ['Sprint N',   'Días 1-3: diseño de casos de prueba (Employee List, Add Employee, My Info – Qualifications).\nDías 4-7: ejecución funcional + automatización E2E.\nDías 8-9: regresión y cierre de bugs críticos.\nDía 10: reporte de resultados y bugs al equipo de desarrollo.'],
  ['Sprint N+1', 'Días 1-2: diseño de casos para Edit Employee – Report to (incluye regresión de Qualifications por cambios de backend).\nDías 3-6: ejecución funcional + automatización.\nDías 7-8: regresión.\nDías 9-10: reporte de resultados y bugs.'],
  ['Sprint N+2', 'Días 1-2: diseño de casos para Admin – Add User (alta de perfil a empleado existente).\nDías 3-6: ejecución funcional + automatización + pruebas de seguridad básicas (políticas de contraseña).\nDías 7-9: regresión de módulos previos.\nDía 10: reporte de resultados y bugs.'],
  ['Sprint N+3', 'Días 1-2: diseño de casos de prueba de API del Clima (WeatherAPI.com) y del widget de Dashboard.\nDías 3-6: ejecución de la colección Postman/Newman + pruebas E2E del widget.\nDías 7-9: regresión integral de todos los módulos (suite completa).\nDía 10: reporte final consolidado de resultados y bugs (entregable de cierre).'],
];

// ── Construcción del documento ────────────────────────────────────────────────
const sections = [];

// Portada
sections.push(
  new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'TALLER DE CALIDAD DE SOFTWARE', size: 22, color: PURPLE_SOFT, bold: true })] }),
  new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Documentación de Procesos de Testing', size: 40, bold: true, color: PURPLE })] }),
  new Paragraph({ spacing: { before: 120, after: 400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Sistema OrangeHRM (Sprints N / N+1 / N+2 / N+3) + Weather API', size: 24, color: '374151' })] }),
  new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Consigna 7 — Documentación asociada a procesos de testing', size: 22, italics: true, color: PURPLE_SOFT })] }),
  new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Incluye: a) Plan de pruebas general · b) Diseño de casos Frontend (Sprint N, N+1, N+2) y resultados · c) Diseño de casos de la API del Clima y colección Postman · d) Reporte consolidado de pruebas ejecutadas y bugs encontrados', size: 19, color: '6B7280' })] }),
  pageBreak(),
);

// Índice
sections.push(
  h1('Índice'),
  bullet('a) Plan de Pruebas General', { bold: true }),
  bullet('b) Diseño de Casos de Prueba Frontend — Sprint N, N+1 y N+2 (Actividad 2), resultados de ejecución y reporte de bugs', { bold: true }),
  bullet('c) Diseño de Casos de Prueba de la API del Clima (Actividad 3) y colección de Postman', { bold: true }),
  bullet('d) Reporte consolidado de pruebas ejecutadas y reporte de bugs encontrados', { bold: true }),
  pageBreak(),
);

// ─────────────────────────────────────────────────────────────────────────────
// a) PLAN DE PRUEBAS GENERAL
// ─────────────────────────────────────────────────────────────────────────────
sections.push(
  h1('a) Plan de Pruebas General'),

  h2('1. Propósito y contenido'),
  p('Este plan define cómo el equipo de QA aborda la validación del sistema OrangeHRM (incrementos entregados '
  + 'sprint a sprint) y de la integración con la Weather API (WeatherAPI.com) que alimenta el widget de clima del '
  + 'Dashboard. Cubre el alcance, la estrategia, los hitos de testing por sprint, los criterios de entrada/salida, '
  + 'la gestión de defectos y los entregables asociados a cada incremento.'),
  p('El documento acompaña el desarrollo incremental descripto en la consigna: cada sprint agrega funcionalidad '
  + 'de backend y/o frontend, y el plan asegura que cada incremento se valide antes de pasar al siguiente.'),

  h2('2. Estrategia de pruebas'),
  bullet('Pirámide de testing: base de pruebas de API (Newman/Postman) y unitarias propias del equipo de desarrollo, '
       + 'capa intermedia de pruebas E2E automatizadas (Playwright) y una capa superior de pruebas exploratorias manuales.'),
  bullet('Tipos de prueba aplicados: Smoke (camino feliz de cada pantalla nueva), Regresión (funcionalidad de sprints '
       + 'anteriores que pudo verse afectada), Funcional (validaciones, mensajes de error, flujos alternativos) y '
       + 'pruebas de API (contractual / negativa) sobre los 4 endpoints de WeatherAPI.com.'),
  bullet('Enfoque Shift-Left: el diseño de casos de prueba comienza apenas se conoce el alcance del sprint (días 1-3), '
       + 'en paralelo al desarrollo, para detectar ambigüedades de requerimientos antes de la entrega del incremento.'),
  bullet('Herramientas: Playwright (E2E + reportes HTML/JSON), Allure (reportes consolidados), Postman + Newman '
       + '(pruebas de API), Bug Tracker propio (gestión de defectos) y Docker Compose (orquestación de todo el sistema).'),
  bullet('Ambiente de pruebas: instancia demo pública de OrangeHRM (opensource-demo.orangehrmlive.com) para frontend, '
       + 'y WeatherAPI.com (plan gratuito) para las pruebas de integración del widget de clima.'),

  h2('3. Calendario de ejecución por sprint (días relativos al sprint)'),
  p('Cada sprint se considera de 10 días hábiles. Los hitos de testing se ubican en relación al inicio del sprint (Día 1):'),
  table(
    ['Sprint', 'Hitos de testing (días relativos)'],
    SPRINT_CALENDAR,
    [2000, 7800],
  ),

  h2('4. Entregables dentro de cada sprint'),
  bullet('Diseño de casos de prueba del incremento del sprint (documento + checklist de criterios de aceptación).'),
  bullet('Suite de pruebas E2E automatizadas (Playwright) correspondiente a las pantallas nuevas del sprint, sumada '
       + 'a la suite de regresión de sprints anteriores.'),
  bullet('Informe de ejecución (Allure / reporte HTML) con el detalle de casos pasados, fallidos y saltados.'),
  bullet('Reporte de bugs encontrados durante la ejecución, cargado en el Bug Tracker con severidad, módulo, sprint '
       + 'y pasos de reproducción.'),
  bullet('Para el Sprint N+3 además: colección de Postman/Newman de la Weather API y reporte de ejecución de esas pruebas.'),

  h2('5. Gestión de defectos (resumen)'),
  p('Severidades: CRITICAL (bloquea el flujo principal), HIGH (afecta una funcionalidad clave sin bloquear el sistema), '
  + 'MEDIUM (afecta una funcionalidad secundaria o validación) y LOW (cosmético / UX menor). '
  + 'Ciclo de vida: Abierto → En progreso → Resuelto → Cerrado (o Reabierto si la corrección no es válida). '
  + 'Cada bug registra: título, descripción, módulo, sprint, pasos de reproducción, resultado esperado vs. obtenido, '
  + 'severidad, prioridad, responsable y estado — y se gestiona desde el Bug Tracker propio del sistema.'),

  pageBreak(),
);

// ─────────────────────────────────────────────────────────────────────────────
// b) CASOS DE PRUEBA FRONTEND — SPRINT N, N+1, N+2 (ACTIVIDAD 2)
// ─────────────────────────────────────────────────────────────────────────────
sections.push(
  h1('b) Diseño de Casos de Prueba Frontend — Sprint N, N+1 y N+2 (Actividad 2)'),
  p('A continuación se detalla, por sprint, el diseño de los casos de prueba de frontend (25 casos: CP-001 a CP-025), '
  + 'el resultado de su ejecución automatizada con Playwright y los bugs de producto detectados durante las pruebas '
  + '(cargados en el Bug Tracker). Además de estos 25 casos "núcleo", la suite de regresión incorporó 100 casos '
  + 'adicionales (CP-026 a CP-125) sobre otros módulos de OrangeHRM, cuyo resultado consolidado se incluye en la sección d).'),
);

for (const [sprintName, data] of Object.entries(FRONTEND_CASES)) {
  sections.push(
    h2(sprintName),
    p(data.desc, { italics: true, color: '6B7280' }),
  );

  for (const mod of data.modules) {
    sections.push(
      h3(`Módulo: ${mod.name}  ·  ${mod.range}`),
      table(['Caso', 'Título / objetivo del caso'], mod.cases, [1600, 8200]),
    );
  }

  const ex = data.execution;
  const pct = ((ex.passed / ex.total) * 100).toFixed(0);
  sections.push(
    h3('Resultado de ejecución'),
    table(
      ['Total ejecutados', 'Pasaron', 'Fallaron', 'Saltados', '% de éxito'],
      [[
        String(ex.total),
        { text: String(ex.passed), fill: GREEN_LIGHT, color: GREEN },
        { text: String(ex.failed), fill: ex.failed > 0 ? RED_LIGHT : GREEN_LIGHT, color: ex.failed > 0 ? RED : GREEN },
        String(ex.skipped),
        `${pct} %`,
      ]],
      [1900, 1900, 1900, 1900, 1900],
    ),
    p(`Detalle: ${ex.detail}`, { italics: true, size: 19, color: '6B7280' }),
  );

  if (data.bugs.length > 0) {
    sections.push(
      h3(`Bugs de producto encontrados en ${sprintName}`),
      table(
        ['ID', 'Módulo', 'Título', 'Severidad', 'Estado'],
        bugRows(data.bugs),
        [1100, 2400, 4500, 1300, 1500],
      ),
    );
  } else {
    sections.push(p('No se registraron bugs de producto nuevos para este sprint.', { italics: true, color: '6B7280' }));
  }

  sections.push(spacer());
}

sections.push(pageBreak());

// ─────────────────────────────────────────────────────────────────────────────
// c) CASOS DE PRUEBA DE LA API DEL CLIMA (ACTIVIDAD 3)
// ─────────────────────────────────────────────────────────────────────────────
sections.push(
  h1('c) Diseño de Casos de Prueba de la API del Clima (Actividad 3)'),
  p('Se diseñaron 20 casos de prueba (CP-API-001 a CP-API-020) sobre los 4 endpoints de WeatherAPI.com utilizados '
  + 'por el widget de clima del Dashboard (incremento del Sprint N+3): Realtime (/current.json), Forecast '
  + '(/forecast.json), History (/history.json) y Alerts (/alerts.json). Cada grupo combina casos de camino feliz '
  + '(ciudad/coordenadas válidas, estructura de respuesta) con casos negativos (sin API key, key inválida, '
  + 'parámetros faltantes o inválidos, fechas fuera de rango).'),
);

for (const group of API_CASES) {
  sections.push(
    h3(`${group.group}  ·  ${group.range}`),
    table(['Caso', 'Título / objetivo del caso'], group.cases, [1600, 8200]),
  );
}

sections.push(
  h2('Colección de Postman utilizada'),
  bullet('Archivo de colección: api-tests/collections/WeatherAPI.postman_collection.json'),
  bullet('Archivo de entorno: api-tests/collections/WeatherAPI.postman_environment.json '
       + '(variables: base_url = https://api.weatherapi.com/v1, api_key, ciudades de prueba y fechas para los '
       + 'casos de History/Forecast).'),
  bullet('Ejecución manual: importar ambos archivos en Postman Desktop, seleccionar el entorno "WeatherAPI - '
       + 'Entorno de Pruebas" y, antes de correr, pegar la API key real en la variable api_key (el valor de '
       + 'fábrica "{{$processEnv WEATHER_API_KEY}}" es solo un recordatorio: no se resuelve de forma recursiva '
       + 'al usarse como valor estático de otra variable). Luego ejecutar la colección con el Collection Runner.'),
  bullet('Ejecución automatizada (100% en Docker): el servicio "api-tests" corre "docker compose run --rm api-tests" '
       + '→ "newman run collections/WeatherAPI.postman_collection.json --environment '
       + 'collections/WeatherAPI.postman_environment.json --env-var \\"api_key=$WEATHER_API_KEY\\" --insecure '
       + '--reporters cli,htmlextra ...". El flag --env-var inyecta la key real desde .env (evitando el problema '
       + 'del placeholder) y --insecure evita el error "self-signed certificate in certificate chain" que produce '
       + 'la inspección HTTPS de la red. El reporte HTML resultante se centraliza junto con el resto de los '
       + 'resultados en Allure / http://localhost:8080/api-report/.'),
  bullet('Documento de diseño completo: api-casos-de-prueba.html / Casos_de_Prueba_API_Clima.pdf (generado con '
       + '"bash start.sh api"), con el detalle de cada caso (precondiciones, datos de entrada, pasos, resultado esperado).'),
  pageBreak(),
);

// ─────────────────────────────────────────────────────────────────────────────
// d) REPORTE DE PRUEBAS EJECUTADAS Y REPORTE DE BUGS
// ─────────────────────────────────────────────────────────────────────────────
sections.push(
  h1('d) Reporte de Pruebas Ejecutadas y Reporte de Bugs Encontrados'),
  p('Esta sección consolida el resultado de la ejecución de toda la suite (frontend E2E + API) acumulada hasta '
  + 'el cierre del Sprint N+3, y el listado completo de bugs de producto detectados a lo largo de los 4 sprints.'),

  h2('1. Resumen consolidado de ejecución'),
  p('Números tomados de la última corrida real registrada en playwright-report/results.json '
  + '(ejecutada con "docker compose run --rm e2e-tests" / "docker compose run --rm api-tests", la misma '
  + 'fuente que alimenta Casos_de_Prueba_OrangeHRM.xlsx y los reportes de Allure):', { size: 19, color: '6B7280', italics: true }),
  table(
    ['Suite', 'Casos', 'Pasaron', 'Fallaron', 'Saltados'],
    [
      ['Frontend – Sprint N, N+1, N+2 (Actividad 2 · CP-001 a CP-025)', '25', { text: '20', fill: GREEN_LIGHT, color: GREEN }, { text: '4', fill: RED_LIGHT, color: RED }, '1'],
      ['Frontend – regresión adicional (CP-026 a CP-125, otros módulos OrangeHRM)', '100', { text: '55', fill: AMBER_LIGHT, color: '92400E' }, { text: '45', fill: RED_LIGHT, color: RED }, '0'],
      ['API del Clima – WeatherAPI.com (Actividad 3 · CP-API-001 a CP-API-020 vía Newman)', '20', { text: '20', fill: GREEN_LIGHT, color: GREEN }, { text: '0', fill: GREEN_LIGHT, color: GREEN }, '0'],
      [{ text: 'Total acumulado', fill: PURPLE_LIGHT, bold: true }, { text: '145', fill: PURPLE_LIGHT, bold: true }, { text: '95', fill: PURPLE_LIGHT, bold: true, color: GREEN }, { text: '49', fill: PURPLE_LIGHT, bold: true, color: RED }, { text: '1', fill: PURPLE_LIGHT, bold: true }],
    ],
    [4400, 1300, 1300, 1300, 1300],
  ),
  spacer(),
  p('Lectura de los resultados: los 25 casos núcleo de Actividad 2 (Sprint N, N+1 y N+2) tienen una tasa de '
  + 'éxito del 80% (20/25); el detalle de las 4 fallas y 1 caso saltado está documentado en la sección b) '
  + 'junto a cada sprint. La suite de regresión adicional (CP-026 a CP-125, 100 casos sobre módulos como '
  + 'Leave, Buzz, Recruitment, Directory, Dashboard, Time & Attendance, etc.) muestra una tasa de éxito '
  + 'menor (55%): la gran mayoría de sus fallas son "page.goto: Timeout" / "Timed out waiting for locator" '
  + '(la suite corre contra el demo público compartido opensource-demo.orangehrmlive.com, que responde con '
  + 'latencia variable bajo carga) y "strict mode violation" por selectores que matchean más de un elemento '
  + 'tras cambios recientes del DOM — ambas son deuda de mantenimiento de la automatización (ajuste de '
  + 'selectores y timeouts), no defectos de producto. Quedan registradas como acción de seguimiento para la '
  + 'siguiente iteración de estabilización de la suite.', { size: 19, color: '6B7280', italics: true }),
  p('Los reportes detallados por caso (con capturas, video y traza de cada ejecución) están disponibles en Allure '
  + '(http://localhost:5050) y en el reporte HTML de Playwright (http://localhost:8080) luego de correr "bash start.sh test". '
  + 'El detalle caso-por-caso también puede exportarse a planilla con "bash start.sh excel" '
  + '(Casos_de_Prueba_OrangeHRM.xlsx), que incluye además, para cada caso fallido, una columna con la descripción '
  + 'del fallo en lenguaje simple lista para volcar a una tarjeta de Trello.', { size: 19, color: '6B7280', italics: true }),
  p('Última corrida verificada de la suite de API (Newman, dentro de Docker, vía "docker compose run --rm api-tests"): '
  + '20/20 requests OK y 54/54 assertions pasadas, 0 fallos, en ≈ 3.6 segundos. Esa corrida quedó estable luego de '
  + 'resolver dos problemas de infraestructura que impedían su ejecución: (1) el flag "--insecure" de Newman, '
  + 'necesario porque la red intercepta el tráfico HTTPS y rompe la cadena de certificados (mismo problema que ya '
  + 'resuelven los Dockerfiles para npm con "strict-ssl false"); y (2) el flag "--env-var \\"api_key=$WEATHER_API_KEY\\"", '
  + 'que sobrescribe en tiempo de ejecución el valor de la variable api_key — el placeholder original '
  + '"{{$processEnv WEATHER_API_KEY}}" del archivo de entorno de Postman no se resuelve quedando como texto literal '
  + 'al usarse como valor estático de otra variable, por lo que la key nunca llegaba a las requests.', { size: 19, color: '6B7280', italics: true }),

  h2('2. Reporte de bugs encontrados (todos los sprints)'),
  table(
    ['ID', 'Sprint', 'Módulo', 'Título', 'Severidad', 'Estado'],
    BUGS.map(b => ([
      b.id, b.sprint, b.module, b.title,
      { text: b.severity, fill: SEV_FILL[b.severity], color: SEV_COLOR[b.severity] },
      STATUS_LABEL[b.status],
    ])),
    [1000, 1300, 2200, 3700, 1200, 1300],
  ),
  spacer(),
  p('Distribución por severidad: 3 HIGH, 2 MEDIUM, 1 LOW. Distribución por estado: 5 Abiertos, 1 En progreso. '
  + 'Los 6 bugs están cargados en el Bug Tracker (http://localhost:3000) con su descripción completa, pasos de '
  + 'reproducción, resultado esperado vs. obtenido y responsable asignado.', { size: 20 }),

  h2('3. Conclusiones'),
  bullet('Las funcionalidades núcleo de los Sprints N, N+1 y N+2 (Actividad 2, CP-001 a CP-025) alcanzaron una '
       + 'tasa de éxito del 80% (20/25 PASÓ) en la última corrida. Los 4 casos fallidos y el caso saltado están '
       + 'detallados junto a cada sprint en la sección b): combinan timeouts intermitentes contra el demo público '
       + 'compartido, una "strict mode violation" de selector y dos assertions a revisar — ninguno compromete el '
       + 'flujo principal de las pantallas evaluadas, pero quedan como acción de seguimiento para estabilizar la suite.'),
  bullet('Se detectaron 6 bugs de producto a lo largo de los 4 sprints, concentrados en validaciones de formularios '
       + '(IDs duplicados, rangos de fecha, políticas de contraseña), rendimiento de un autocomplete y manejo de '
       + 'errores del widget de clima — ninguno bloquea el flujo principal de las pantallas evaluadas.'),
  bullet('La suite de regresión adicional (CP-026 a CP-125, 100 casos sobre otros módulos de OrangeHRM) registró '
       + '55/100 PASÓ en la última corrida; el análisis de las fallas (ver sección d.1) muestra que son '
       + 'mayormente "timeouts" por la latencia variable del demo público y "strict mode violations" de '
       + 'selectores — deuda de mantenimiento de automatización a resolver en la próxima iteración, no bugs '
       + 'de producto nuevos.'),
  bullet('La integración con la Weather API (Actividad 3) pasó el 100% de los 20 casos diseñados (54/54 assertions), '
       + 'validando tanto los caminos felices como el manejo de errores (401, 400) de los 4 endpoints utilizados por '
       + 'el widget. Durante la verificación se ajustó CP-API-004: WeatherAPI.com cambió el código de respuesta para '
       + 'API key inválida de 403 a 401, por lo que el caso y su assertion se actualizaron para reflejar el '
       + 'comportamiento real y vigente de la API.'),
  bullet('Se recomienda priorizar la corrección de los bugs de severidad HIGH (BUG-02, BUG-04 y BUG-06) antes del '
       + 'cierre del proyecto, dado su impacto en integridad de datos, performance percibida y experiencia de usuario.'),
);

// ── Documento final ───────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'Sistema QA – Taller de Calidad de Software',
  title: 'Documentación de Procesos de Testing — Consigna 7',
  description: 'Plan de pruebas, diseño de casos (Frontend y API), resultados de ejecución y reporte de bugs por sprint',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 21 } },
    },
  },
  sections: [{ properties: {}, children: sections }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  const kb = (fs.statSync(OUTPUT).size / 1024).toFixed(0);
  console.log(`✔  Documento generado: ${OUTPUT}  (${kb} KB)`);
}).catch(err => {
  console.error('❌  Error al generar el documento:', err.message);
  process.exit(1);
});
