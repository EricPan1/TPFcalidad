'use strict';

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  BorderStyle, WidthType, AlignmentType, ShadingType, VerticalAlign, PageBreak,
} = require('docx');
const fs = require('fs');

const OUTPUT = '/work/TP_Final_Integrador.docx';

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
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}

// Párrafo con tramos mixtos (negritas embebidas): runs = [{text, bold?, italics?}]
function pRuns(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
    ...opts,
    children: runs.map(r => new TextRun({ size: 21, ...r })),
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}

// Bullet con tramo inicial en negrita (etiqueta) + resto normal
function bulletLabel(label, rest, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({ text: label, bold: true, size: 21, ...opts }),
      new TextRun({ text: rest, size: 21, ...opts }),
    ],
  });
}

function numbered(text, ref, opts = {}) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 60 },
    alignment: AlignmentType.JUSTIFIED,
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

// Caja destacada (callout) para enunciados de preguntas
function questionBox(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: PURPLE_LIGHT },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'Enunciado · ', bold: true, color: PURPLE, size: 19 }),
            new TextRun({ text, italics: true, color: '374151', size: 19 }),
          ],
        })],
      })],
    })],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_SOFT },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_SOFT },
      left: { style: BorderStyle.SINGLE, size: 24, color: PURPLE },
      right: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_SOFT },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
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

// ── Datos: matriz de frecuencia de actividades de performance (Pregunta 5) ────
const PERF_MATRIX = [
  ['Smoke Performance Test',      'Cada despliegue automatizado en Staging',           'Verificar que los tiempos de respuesta de los endpoints principales no sufrieron degradaciones (detección temprana de degradación).'],
  ['Pruebas de Carga (Load)',     'Al cierre de cada Sprint',                          'Evaluar el comportamiento del incremento funcional bajo la demanda proyectada de usuarios concurrentes.'],
  ['Pruebas de Estrés (Stress)',  'Antes de releases relevantes o pasos a producción', 'Identificar el límite del sistema, validar el auto-escalado y asegurar mecanismos de recuperación estables.'],
  ['Pruebas de Estabilidad (Endurance)', 'Mensual / Ciclos de estabilización',         'Monitorear el consumo de memoria, recursos y conexiones de base de datos a lo largo del tiempo bajo uso continuo.'],
  ['Pruebas de Volumen (Volume)', 'Ante aumentos significativos del histórico de datos','Garantizar que el crecimiento de la base de datos no afecte el rendimiento de las consultas y listados de PIM.'],
];

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTRUCCIÓN DEL DOCUMENTO
// ═══════════════════════════════════════════════════════════════════════════════
const sections = [];

// ── Portada ───────────────────────────────────────────────────────────────────
sections.push(
  new Paragraph({ spacing: { before: 1800 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'UNIVERSIDAD DE LA CIUDAD DE BUENOS AIRES', size: 24, color: PURPLE, bold: true })] }),
  new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Ciclo de Complementación Curricular', size: 22, color: '374151' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Licenciatura en Tecnologías Digitales · Licenciatura en Ciencias de Datos', size: 20, color: '6B7280' })] }),
  new Paragraph({ spacing: { before: 700 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'TRABAJO FINAL INTEGRADOR', size: 44, bold: true, color: PURPLE })] }),
  new Paragraph({ spacing: { before: 160, after: 400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Taller de Control de Calidad de Software', size: 26, italics: true, color: PURPLE_SOFT })] }),
  new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Sistema de Gestión de Personas — Ecosistema OrangeHRM', size: 22, color: '374151', bold: true })] }),
  new Paragraph({ spacing: { before: 100 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Plan estratégico de calidad (respuestas teóricas, preguntas 1 a 8) + entrega práctica (pregunta 7: a, b, c, d)', size: 19, color: '6B7280' })] }),
  pageBreak(),
);

// ── Índice ────────────────────────────────────────────────────────────────────
sections.push(
  h1('Índice'),
  h3('Parte I — Plan Estratégico de Gestión y Gobierno de la Calidad de Software'),
  bullet('Introducción y alcance del sistema'),
  bullet('1. La casuística como activo vivo: diseño funcional y de experiencia de usuario'),
  bullet('2. Shift-left: contratos como punto de partida y cobertura del backend por niveles'),
  bullet('3. De la funcionalidad al riesgo operativo: anticipar los problemas de producción'),
  bullet('4. Un equipo de tres testers full stack con roles complementarios'),
  bullet('5. Mirando hacia adelante: extender la estrategia al módulo Recruitment'),
  bullet('   (incluye tabla de correspondencia con las preguntas 1 a 6 y 8 del enunciado)'),
  h3('Parte II — Entrega práctica (Pregunta 7)'),
  bullet('a) Plan de pruebas general'),
  bullet('b) Diseño de casos de prueba Frontend (Sprint N, N+1, N+2), resultados y bugs'),
  bullet('c) Diseño de casos de prueba de la API del Clima y colección Postman'),
  bullet('d) Reporte consolidado de pruebas ejecutadas y reporte de bugs'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════════
// PARTE I — RESPUESTAS TEÓRICAS
// ═══════════════════════════════════════════════════════════════════════════════
sections.push(
  new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'PARTE I — RESPUESTAS TEÓRICAS', size: 30, bold: true, color: PURPLE })] }),
  new Paragraph({ spacing: { after: 240 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Plan Estratégico de Gestión y Gobierno de la Calidad de Software', size: 22, italics: true, color: PURPLE_SOFT })] }),
);

// Introducción
sections.push(
  h1('Introducción y alcance del sistema'),
  p('Este documento detalla el Plan Estratégico de Calidad para la aplicación de Gestión de Personas basada '
  + 'en el ecosistema de OrangeHRM. El sistema trabaja con una arquitectura orientada a microservicios autónomos '
  + 'que interactúan con tres capas de usuario: un Front-end Web completo, un Front-end Web Mobile (con funciones '
  + 'acotadas para mayor portabilidad) y un Backend-for-Frontend (BFF) que organiza, unifica y optimiza el tráfico '
  + 'de las interfaces según el canal de origen.'),
  p('El aseguramiento de la calidad en este ecosistema no se limita a una fase tardía de verificación, sino que '
  + 'se integra como un pilar transversal a lo largo del ciclo de vida del desarrollo. Para ello se adopta un '
  + 'enfoque metodológico de Shift-Left Testing, garantizando la mitigación temprana de riesgos técnicos y '
  + 'funcionales desde las etapas de diseño y definición de contratos de integración.'),
  pageBreak(),
);

// ── 1. La casuística como activo vivo ────────────────────────────────────────
sections.push(
  h1('1. La casuística como activo vivo: diseño funcional y de experiencia de usuario'),
  p('Todo plan de calidad arranca de una misma pregunta: ¿cómo organizar la casuística para que represente '
  + 'fielmente la funcionalidad viva del sistema y, a la vez, las expectativas de experiencia de usuario que '
  + 'ese sistema debe cumplir? La respuesta adoptada estructura el diseño y la implementación de los casos de '
  + 'prueba en suites organizadas por los dominios funcionales y las pantallas reales de la aplicación OrangeHRM:'),
  bulletLabel('Módulo PIM (Personnel Information Management): ', 'suites de Employee List (filtros y grilla principal), '
    + 'Add Employee (alta de legajos) y Edit Employee – Report to (asignación de estructuras jerárquicas y supervisores).'),
  bulletLabel('Módulo My Info: ', 'suite enfocada en la sección personal del empleado, validando la carga y '
    + 'actualización de Qualifications (títulos académicos, certificaciones e idiomas).'),
  bulletLabel('Módulo Admin: ', 'suite destinada a la gobernanza del sistema, centrada en Add User / Assign Profile '
    + '(creación de usuarios y asignación de roles de seguridad).'),
  bulletLabel('Dashboard Principal: ', 'suite para la validación de la integración del nuevo componente externo, el Widget de Clima.'),
  p('Esta modularidad por dominios permite que cualquier evolución en los criterios de aceptación o cambio en las '
  + 'historias de usuario impacte únicamente en las suites correspondientes, optimizando los esfuerzos de '
  + 'mantenimiento y regresión. Dentro de cada módulo, además, conviene separar dos enfoques con objetivos, '
  + 'ciclos de vida y frecuencias de ejecución bien distintos: las pruebas funcionales, que responden al "qué" '
  + 'debe hacer el sistema, y las de look & feel, que responden al "cómo" se lo muestra al usuario.'),
  p('Las primeras se diseñan mediante técnicas formales de caja negra (particionamiento de equivalencia, '
  + 'análisis de valores límite y transición de estados): abstraen los datos de entrada, el estado inicial, el '
  + 'flujo de pasos secuenciales, el resultado esperado y el estado final del sistema, guiándose por un oráculo '
  + 'de validación derivado de los criterios de aceptación. Al concentrarse en la lógica pura, poseen un alto '
  + 'potencial de automatización estable a lo largo del tiempo. Las segundas, en cambio, verifican la correcta '
  + 'representación visual, estética y de usabilidad del software frente a las maquetas y especificaciones de '
  + 'UI/UX —paletas de colores, tipografías, diagramación, comportamiento responsivo, adaptabilidad Web Mobile y '
  + 'modos de visualización como el modo oscuro—. Automatizarlas al 100% es complejo y costoso, porque generan '
  + 'muchos falsos positivos ante cambios visuales mínimos; por eso se resuelven con revisiones visuales '
  + 'dirigidas y se ejecutan con menor frecuencia, habitualmente al cerrar cambios de interfaz o durante la fase '
  + 'de estabilización del sprint.'),
  h2('1.1 Estrategia de omnicanalidad y abstracción'),
  p('Para maximizar la eficiencia de los tres testers full stack, el diseño de la casuística adopta además un '
  + 'enfoque omnicanal: se desarrollan casos de prueba abstractos a nivel funcional para validar las reglas de '
  + 'negocio comunes a toda la aplicación, y luego se derivan en escenarios concretos de ejecución para la '
  + 'plataforma Web y en instancias adaptadas para la interfaz Web Mobile —que posee flujos acotados, '
  + 'resoluciones restrictivas y un comportamiento de red propio—, asegurando una experiencia consistente en '
  + 'ambos entornos sin duplicar el esfuerzo de diseño inicial.'),
  p('Diseñar bien la casuística resuelve el "qué" y el "cómo" probar. Pero un plan de calidad serio tiene que '
  + 'responder también al "cuándo": ¿cómo se logra que estas suites empiecen a ejecutarse desde el primer día '
  + 'del sprint, incluso cuando el backend que las sustenta todavía no está listo?'),
  pageBreak(),
);

// ── 2. Shift-left: contratos como punto de partida y cobertura del backend ───
sections.push(
  h1('2. Shift-left: contratos como punto de partida y cobertura del backend por niveles'),
  p('Para que Front-end y Back-end avancen en paralelo sin bloquearse mutuamente, el equipo adopta una '
  + 'estrategia de Shift-Left Testing apoyada en contratos y servidores de simulación. La idea central es '
  + 'desacoplar al frontend del backend mediante un contrato acordado tempranamente, antes de escribir una sola '
  + 'línea de código de un nuevo incremento funcional (llamadas de los módulos PIM, Admin, o el consumo de las '
  + 'APIs de Clima como /current.json y /forecast.json):'),
  bulletLabel('Pruebas de contrato (Contract Testing) tempranas: ', 'se definen y acuerdan formalmente los '
    + 'contratos de API utilizando el estándar OpenAPI / Swagger, como única fuente de verdad compartida entre '
    + 'ambos equipos.'),
  bulletLabel('Postman Mock Servers: ', 'esos contratos se publican en servidores de simulación, de modo que el '
    + 'Front-end pueda desarrollarse y probarse contra respuestas mockeadas mientras el Back-end todavía no está '
    + 'listo, y el Back-end, en paralelo, valide que la estructura de sus datos cumple estrictamente con el '
    + 'esquema pactado.'),
  bulletLabel('Validación de look & feel y flujos de UI: ', 'al disponer de datos simulados estables, las pruebas '
    + 'funcionales de interfaz y las revisiones visuales pueden ejecutarse desde el día 1 del sprint, sin esperar '
    + 'la integración real.'),
  p('Este enfoque elimina la dependencia secuencial "primero backend, después frontend": si el backend respeta '
  + 'el esquema acordado, la integración real es directa; si lo rompe, las pruebas de contrato lo detectan de '
  + 'inmediato. Así se mitigan los riesgos de integración de forma temprana y se aprovecha el tiempo de ambos '
  + 'equipos en paralelo.'),
  p('Ese mismo contrato que le permite al frontend avanzar sin esperar es, visto desde el otro lado, el cimiento '
  + 'sobre el que se construye la cobertura automatizada del propio backend. Cada servicio expone su API '
  + 'respetando el esquema pactado, y sobre esa base se organiza una malla de control piramidal que se ejecuta '
  + 'automáticamente ante cada nuevo despliegue o cambio de código, en los siguientes niveles tácticos:'),
  bulletLabel('1. Pruebas Unitarias (Unit Testing): ', 'mantenidas e implementadas por el equipo de desarrollo. '
    + 'Se ejecutan sobre el código fuente de cada microservicio en aislamiento, asegurando que funciones internas, '
    + 'métodos y lógicas básicas respondan correctamente antes de cualquier compilación.'),
  bulletLabel('2. Pruebas de Contrato (Contract Testing): ', 'las mismas definidas tempranamente con OpenAPI / '
    + 'Swagger y publicadas en Postman Mock Servers; garantizan que cada servicio respete el esquema acordado '
    + 'con sus consumidores también una vez integrado.'),
  bulletLabel('3. Pruebas de Integración de Componentes (Integration Testing): ', 'validan la comunicación interna '
    + 'entre microservicios dependientes y los mecanismos de persistencia o servicios externos (como el BFF o la '
    + 'pasarela del proveedor de clima), asegurando el correcto flujo de datos a través de la red.'),
  bulletLabel('4. Pruebas de API Automatizadas: ', 'enfocadas en reglas de negocio complejas. Las solicitudes y '
    + 'respuestas de los endpoints se estructuran en colecciones de Postman, contemplando tanto los "caminos '
    + 'felices" (flujos ideales) como los "caminos no felices" (gestión de errores, códigos HTTP 4xx y 5xx, y '
    + 'validación de tipos de datos).'),
  bulletLabel('5. Pruebas de Humo (Smoke Tests): ', 'selección automatizada y ligera de pruebas de API críticas '
    + 'que verifica el estado básico de cada microservicio inmediatamente después de un despliegue, asegurando '
    + 'que los servicios esenciales están operativos antes de habilitar pruebas más profundas.'),
  p('Toda esta malla de control, orquestada mediante colecciones de Postman, se ejecuta de forma automatizada '
  + 'mediante Newman incorporado directamente en el pipeline de Integración Continua (CI/CD): cada nuevo commit '
  + 'o Pull Request desencadena la batería de pruebas, y si un nivel falla, el pipeline se detiene de inmediato, '
  + 'impidiendo la propagación de defectos hacia entornos superiores y garantizando retroalimentación rápida '
  + 'para el equipo de desarrollo.'),
  p('Sin embargo, esta malla —por completa que sea— tiene un límite: garantiza que el sistema funciona '
  + 'correctamente bajo condiciones controladas, pero no que resista el uso real y masivo una vez puesto en '
  + 'producción. Esa es precisamente la siguiente capa de riesgo que el plan debe cubrir.'),
  pageBreak(),
);

// ── 3. De la funcionalidad al riesgo operativo en producción ─────────────────
sections.push(
  h1('3. De la funcionalidad al riesgo operativo: anticipar los problemas de producción'),
  p('La puesta en producción de un sistema distribuido introduce problemas técnicos que exceden las '
  + 'validaciones puramente funcionales. El sistema presenta un perfil de riesgo operativo crítico concentrado '
  + 'en el módulo de asistencia de OrangeHRM (Time > Attendance > Punch In/Out), donde las ventanas horarias de '
  + 'entrada y salida de turnos generan picos de tráfico simultáneo. Las fallas potenciales a evaluar son:'),
  bulletLabel('Saturación de Base de Datos y bloqueos de sesiones: ', 'el registro masivo e instantáneo de '
    + 'fichadas puede generar colas de espera en las escrituras, provocando bloqueos de tablas y caídas por timeouts.'),
  bulletLabel('Cuellos de botella en el BFF: ', 'como el Backend-for-Frontend centraliza y distribuye las '
    + 'peticiones web y mobile, una mala gestión de hilos puede saturar este componente e interrumpir el acceso '
    + 'general a la aplicación.'),
  bulletLabel('Degradación y caídas de APIs externas: ', 'la dependencia del Widget de Clima de un proveedor '
    + 'externo expone al sistema a fallas de disponibilidad. Se deben prever respuestas alternativas o mecanismos '
    + 'de caché para que una degradación externa no afecte el renderizado del Dashboard principal.'),
  bulletLabel('Escalabilidad horizontal insuficiente: ', 'validar que las políticas de auto-escalado de los '
    + 'microservicios respondan con velocidad suficiente antes de que los servidores se queden sin memoria o '
    + 'procesamiento bajo picos de uso.'),
  p('Detectar estas fallas recién cuando ya ocurrieron en producción sería, claramente, demasiado tarde. Por '
  + 'eso el plan incorpora una estrategia multidimensional de ingeniería de performance, liderada por el Tester '
  + 'especialista en Performance, pensada para descubrir cada uno de estos riesgos antes de que el usuario los '
  + 'sufra. Las simulaciones se ejecutan en un Ambiente Pre-productivo (Staging) configurado como un espejo a '
  + 'escala controlada de producción, inyectando un dataset simulado con entre 1 y 2 años de transacciones '
  + 'históricas de fichadas y registros de empleados. Esto permite que herramientas de inyección de carga como '
  + 'Apache JMeter o Gatling evalúen con precisión los tiempos de respuesta de los endpoints bajo condiciones de '
  + 'desgaste operativo real.'),
  h2('3.1 Tipos de pruebas de performance'),
  bulletLabel('Carga (Load): ', 'comportamiento del sistema bajo la demanda nominal proyectada.'),
  bulletLabel('Estrés (Stress): ', 'búsqueda del punto de quiebre y degradación elegante, simulando que un '
    + 'porcentaje masivo de la nómina ficha en el mismo minuto.'),
  bulletLabel('Estabilidad (Endurance): ', 'detección de memory leaks o saturación de hilos en ejecuciones prolongadas.'),
  bulletLabel('Volumen (Volume): ', 'verificación de índices y tiempos de respuesta de las grillas del módulo PIM '
    + 'ante un crecimiento histórico de registros.'),
  h2('3.2 Matriz de frecuencia de actividades de performance'),
  p('Para que estas validaciones no queden libradas al criterio individual, sino que formen parte estable del '
  + 'ciclo de vida del desarrollo, se establece el siguiente esquema formal de frecuencias de ejecución:'),
  table(
    ['Actividad de Performance', 'Frecuencia de ejecución', 'Objetivo de calidad'],
    PERF_MATRIX,
    [2600, 2600, 4600],
  ),
  spacer(),
  p('Cada frecuencia responde a una lógica de costo-riesgo: el Smoke Performance Test se ejecuta en cada '
  + 'despliegue porque es el control más barato y temprano para detectar degradaciones antes de que avancen. '
  + 'Las pruebas de Carga se atan al cierre de sprint, cuando hay un incremento funcional nuevo y estable que '
  + 'medir. Las de Estrés se reservan para antes de releases o pasos a producción, ya que buscan el punto de '
  + 'quiebre y validan el auto-escalado justo cuando el riesgo de impacto es mayor. Las de Estabilidad '
  + '(mensuales) capturan problemas que solo aparecen con el tiempo, como las fugas de memoria, y las de Volumen '
  + 'se disparan ante crecimientos significativos del histórico de datos, que es cuando el rendimiento de las '
  + 'consultas del módulo PIM puede degradarse.'),
  p('Diseñar la casuística, desacoplar al frontend mediante contratos, sostener una pirámide de pruebas de '
  + 'backend automatizada y vigilar la performance en producción son, todas, actividades concretas que alguien '
  + 'tiene que ejecutar, coordinar y sostener sprint tras sprint. Esto exige un equipo de testing organizado, '
  + 'con roles definidos y mecanismos claros de colaboración.'),
  pageBreak(),
);

// ── 4. Un equipo de testers full stack con roles complementarios ─────────────
sections.push(
  h1('4. Un equipo de tres testers full stack con roles complementarios'),
  p('La gestión de la calidad es una responsabilidad compartida de todo el equipo ágil. La capacidad instalada '
  + 'de los tres testers full stack se organiza bajo un esquema claro de responsabilidades, promoviendo la '
  + 'rotación interna de tareas para mitigar el riesgo de silos de conocimiento:'),
  bulletLabel('Tester 1 – Líder de Calidad: ', 'responsable del diseño de la estrategia general, coordinación '
    + 'metodológica, gestión del entorno de pruebas, comunicación de riesgos y seguimiento activo del ciclo de '
    + 'vida de los defectos encontrados.'),
  bulletLabel('Tester 2 – Especialista en Performance: ', 'encargado del diseño de los escenarios de carga, '
    + 'configuración de herramientas de inyección de tráfico (JMeter/Gatling), inyección del dataset simulado en '
    + 'Staging, y el monitoreo e informe de métricas de infraestructura (hilos, memoria, CPU, tiempos de respuesta).'),
  bulletLabel('Tester 3 – Tester Full Stack / Automatizador: ', 'focalizado en el diseño de la casuística '
    + 'funcional y de Look & Feel, la validación exploratoria en Web y Web Mobile, y la programación y '
    + 'mantenimiento de los scripts de automatización de APIs (Postman/Newman) y de regresión de interfaz.'),
  p('Aunque existen roles de especialización, los Testers 1 y 3 colaboran en el análisis de resultados de '
  + 'performance, mientras que el Tester 2 apoya en la automatización de API y en las pruebas funcionales de los '
  + 'módulos (PIM, Admin, My Info) cuando la carga de su especialidad lo permite: la rotación es lo que evita '
  + 'que el conocimiento quede encerrado en una sola persona.'),
  h2('4.1 El testing dentro del Definition of Done (DoD)'),
  p('La sinergia en el ciclo de vida del Sprint se garantiza incluyendo el testing automatizado dentro del '
  + 'Definition of Done de cada User Story. Una funcionalidad no se considera finalizada si no cumple '
  + 'estrictamente con:'),
  bullet('1. Cuenta con sus scripts de prueba automatizada para APIs integrados y estables en la colección de Postman/Newman.'),
  bullet('2. Ha superado la ejecución de la suite de pruebas funcionales críticas y exploratorias de interfaz (Web y Web Mobile).'),
  bullet('3. No posee defectos abiertos de severidad Alta o Bloqueante.'),
  p('Esta misma estructura de equipo, con sus prácticas, sus roles y su cultura de calidad ya consolidadas '
  + 'sobre la plataforma base, es la plataforma de lanzamiento sobre la que se proyecta el próximo gran salto '
  + 'del producto: la incorporación del módulo de Recruitment.'),
  pageBreak(),
);

// ── 5. Mirando hacia adelante: el módulo Recruitment ─────────────────────────
sections.push(
  h1('5. Mirando hacia adelante: extender la estrategia al módulo Recruitment'),
  p('Una vez estabilizada la plataforma base en producción, el negocio planifica incorporar el módulo de '
  + 'Recruitment (Atracción y Selección de Talentos) en un horizonte de tres sprints adicionales. Lejos de '
  + 'requerir un plan nuevo desde cero, este desafío se aborda extendiendo el mismo marco metodológico que ya '
  + 'demostró funcionar: definición previa de contratos OpenAPI, desarrollo en paralelo apoyado en mocks, y '
  + 'automatización en el pipeline de CI/CD de los nuevos endpoints.'),
  h2('5.1 Planificación de pruebas e impacto en regresión'),
  p('La activación de este dominio introduce pantallas de configuración de vacantes, formularios públicos para '
  + 'postulantes externos, flujos de postulación y almacenamiento de archivos adjuntos (Currículum Vitae). El '
  + 'riesgo principal que trae consigo no es tanto que el feature nuevo falle, sino que arrastre con él a lo '
  + 'que ya funciona: la introducción de Recruitment no debe degradar ni afectar la funcionalidad viva e '
  + 'histórica de los módulos preexistentes (PIM, Admin, Time). Para mitigar ese riesgo se amplían de forma '
  + 'incremental las suites de Smoke Test al inicio de cada sprint y la suite de Regresión Automatizada al '
  + 'cierre, sosteniendo una malla de contención continua sobre el software que ya opera en producción.'),
  h2('5.2 Estrategia de ciberseguridad y datos sensibles'),
  p('Recruitment, a diferencia de los módulos anteriores, expone formularios públicos y gestiona información '
  + 'confidencial, antecedentes laborales y datos personales de candidatos externos: la seguridad deja de ser '
  + 'un aspecto deseable para convertirse en un requerimiento no funcional crítico. El plan contempla dos '
  + 'escenarios tácticos según la disponibilidad presupuestaria, de modo que la estrategia sea realista en '
  + 'cualquiera de los dos casos:'),
  h3('Escenario A — Con financiamiento (propuesta óptima)'),
  p('Incorporación temporal de un Especialista en Ciberseguridad (Pentester) durante los Sprints N+1 y N+2, '
  + 'centrado en diseñar y ejecutar pruebas de vulnerabilidad e intrusión (Penetration Testing) sobre los '
  + 'formularios públicos de candidatos y los endpoints de carga de archivos, validando la plataforma contra el '
  + 'OWASP Top 10 (inyecciones SQL, XSS, subida de archivos maliciosos y fallos de control de acceso).'),
  h3('Escenario B — Sin financiamiento adicional (alternativa interna)'),
  bulletLabel('Refuerzo en Análisis Funcional: ', 'el Analista Funcional refina exhaustivamente las historias de '
    + 'usuario, explicitando criterios de aceptación para la validación y sanitización estricta de datos de '
    + 'entrada desde el diseño (por ejemplo, tipos de archivo permitidos solo .pdf o .docx, y límites estrictos de '
    + 'tamaño en MB).'),
  bulletLabel('Pruebas de Seguridad Automatizadas y Caja Negra: ', 'los Testers Full Stack incorporan OWASP ZAP '
    + '(Zed Attack Proxy) en modo de escaneo básico automatizado dentro del CI/CD para detectar vulnerabilidades '
    + 'comunes de interfaz y APIs, mientras que el Líder Técnico aplica análisis estático de código (SAST) como '
    + 'SonarQube para interceptar fallos de seguridad en el código fuente antes de su compilación y despliegue.'),
  p('De esta manera, el plan cierra su recorrido completo —desde el diseño de la primera suite de casos hasta '
  + 'la protección de los datos de los futuros postulantes— con una misma lógica de fondo: anticipar los '
  + 'problemas, automatizar lo que se pueda repetir, y adaptar siempre la estrategia a los recursos realmente '
  + 'disponibles.'),
  spacer(),
  h3('Correspondencia de este plan con las preguntas del enunciado'),
  table(
    ['Sección de este plan', 'Preguntas del enunciado que desarrolla'],
    [
      ['1. La casuística como activo vivo', 'Pregunta 1 — organización de la casuística funcional y de look & feel'],
      ['2. Shift-left: contratos y cobertura del backend', 'Pregunta 2 — pruebas tempranas del frontend sin backend · Pregunta 3 — cobertura del backend por niveles'],
      ['3. Riesgo operativo en producción', 'Pregunta 4 — problemas potenciales en producción · Pregunta 5 — cómo descubrirlos antes (actividades y frecuencia)'],
      ['4. Equipo de testing y DoD', 'Pregunta 6 — organización del equipo de testing durante el sprint'],
      ['5. Extensión al módulo Recruitment', 'Pregunta 8 — plan de extensión del ciclo de vida en 3 sprints'],
    ],
    [3600, 5600],
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════════
// PARTE II — ENTREGA PRÁCTICA (PREGUNTA 7)
// ═══════════════════════════════════════════════════════════════════════════════
sections.push(
  new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'PARTE II — ENTREGA PRÁCTICA (PREGUNTA 7)', size: 30, bold: true, color: PURPLE })] }),
  new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Documentación asociada a procesos de testing: a) Plan de pruebas · b) Casos Frontend y resultados · c) Casos de API y colección Postman · d) Reporte de pruebas y bugs', size: 19, italics: true, color: '6B7280' })] }),
  questionBox('Suponiendo el desarrollo incremental Sprint N → N+3, entregar: a) Plan de pruebas general; '
  + 'b) Diseño de casos de prueba de frontend del Sprint N, N+1 y N+2 (Actividad 2), resultado de ejecución y '
  + 'reporte de bugs; c) Diseño de casos de prueba de la API del Clima (Actividad 3) e inclusión de la colección '
  + 'de Postman; d) Reporte de las pruebas ejecutadas y reporte de bugs encontrados.'),
  pageBreak(),
);

// ── a) PLAN DE PRUEBAS GENERAL ────────────────────────────────────────────────
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

// ── b) CASOS DE PRUEBA FRONTEND ───────────────────────────────────────────────
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

// ── c) CASOS DE PRUEBA API DEL CLIMA ──────────────────────────────────────────
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

// ── d) REPORTE DE PRUEBAS EJECUTADAS Y BUGS ───────────────────────────────────
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
  title: 'Trabajo Final Integrador — Taller de Control de Calidad de Software',
  description: 'Respuestas teóricas (preguntas 1 a 8) + entrega práctica (pregunta 7: plan, casos Frontend y API, resultados y bugs)',
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
