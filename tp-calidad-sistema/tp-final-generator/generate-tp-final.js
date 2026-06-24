'use strict';

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  BorderStyle, WidthType, AlignmentType, ShadingType, VerticalAlign, PageBreak,
  Header, Footer, PageNumber, TabStopType,
} = require('docx');
const fs = require('fs');

const OUTPUT = '/work/TP_Final_Integrador.docx';

// Datos compartidos (montados vía .:/work en docker-compose)
const D = require('/work/shared/qa-data.js');

// ── Paleta (alineada al documento entregado: morado-azulado + acentos naranja) ─
const BAND       = '5B5BA6';   // banda de portada / subrayado de encabezado
const BAND_DK    = '3F3D74';
const HEADING    = '4C3A8C';   // títulos principales
const HEADING2   = '5B5BA6';
const ORANGE     = 'E8852B';
const TBL_HEAD   = 'FCE5CD';   // encabezado de tabla (durazno)
const TBL_HEADTX = '7A3E00';
const TBL_BORDER = 'E69138';
const ZEBRA      = 'F6F4FB';
const LABEL_FILL = 'EFEDF7';
const GREEN      = '166534';
const GREEN_BG   = 'DCFCE7';
const RED        = '991B1B';
const RED_BG     = 'FEE2E2';
const AMBER      = '92400E';
const AMBER_BG   = 'FEF3C7';
const GREY       = '6B7280';

// ── Helpers de texto ──────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 340, after: 150 },
    border: { bottom: { color: ORANGE, space: 4, style: BorderStyle.SINGLE, size: 14 } },
    children: [new TextRun({ text, bold: true, color: HEADING, size: 30 })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 110 },
    children: [new TextRun({ text, bold: true, color: HEADING2, size: 24 })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 190, after: 90 },
    children: [new TextRun({ text, bold: true, underline: {}, color: '374151', size: 21 })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 110 }, alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 }, spacing: { after: 50 }, alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}
function bulletLabel(label, rest) {
  return new Paragraph({
    bullet: { level: 0 }, spacing: { after: 50 }, alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text: label, bold: true, size: 21 }), new TextRun({ text: rest, size: 21 })],
  });
}
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }
function spacer() { return new Paragraph({ spacing: { after: 140 }, children: [] }); }

// Nodo de mind map (bullet anidado por nivel + etiqueta de tipo)
const TAG_COLOR = { 'Principal': HEADING2, 'Crítica': RED, 'Nuevo': ORANGE, 'Futuro': GREY, 'Secundaria': GREY };
function mindNode(n) {
  const runs = [new TextRun({ text: n.t, size: n.lvl === 0 ? 23 : 20, bold: n.lvl <= 1, color: n.lvl === 0 ? HEADING : undefined })];
  if (n.tag) runs.push(new TextRun({ text: `   [${n.tag}]`, size: 16, italics: true, bold: true, color: TAG_COLOR[n.tag] || GREY }));
  return new Paragraph({ bullet: { level: n.lvl }, spacing: { after: 30 }, children: runs });
}

// Párrafo multilínea (separa por \n) con color/size opcional, para celdas
function multiPara(value, { size = 18, color = null, bold = false } = {}) {
  let text = value, c = color;
  if (value && typeof value === 'object') { text = value.text; c = value.color || color; }
  const lines = String(text).split('\n');
  const children = [];
  lines.forEach((ln, i) => {
    if (i > 0) children.push(new TextRun({ break: 1 }));
    children.push(new TextRun({ text: ln, size, bold, color: c || undefined }));
  });
  return new Paragraph({ children });
}

// ── Caja de enunciado ─────────────────────────────────────────────────────────
function enunciadoBox(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: ZEBRA },
      margins: { top: 90, bottom: 90, left: 160, right: 160 },
      children: [new Paragraph({ children: [
        new TextRun({ text: 'Consigna · ', bold: true, color: BAND, size: 19 }),
        new TextRun({ text, italics: true, color: '374151', size: 19 }),
      ] })],
    })] })],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BAND },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BAND },
      left: { style: BorderStyle.SINGLE, size: 22, color: ORANGE },
      right: { style: BorderStyle.SINGLE, size: 4, color: BAND },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
  });
}

// ── Tabla de datos (encabezado durazno) ───────────────────────────────────────
function tblBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: TBL_BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: TBL_BORDER },
    left: { style: BorderStyle.SINGLE, size: 4, color: TBL_BORDER },
    right: { style: BorderStyle.SINGLE, size: 4, color: TBL_BORDER },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'EBC9A6' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'EBC9A6' },
  };
}
function cellText(text, { bold = false, color = null, fill = null, header = false, width = null } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: fill ? { type: ShadingType.CLEAR, color: 'auto', fill } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: [multiPara({ text, color: header ? TBL_HEADTX : color }, { size: 18, bold: header || bold })],
  });
}
function table(headers, rows, widths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((t, i) => cellText(t, { header: true, fill: TBL_HEAD, width: widths?.[i] })),
  });
  const body = rows.map((r, ri) => new TableRow({
    children: r.map((val, ci) => {
      let fill = ri % 2 === 1 ? ZEBRA : 'FFFFFF';
      let color = null, bold = false;
      if (val && typeof val === 'object') { fill = val.fill || fill; color = val.color || null; bold = val.bold || false; val = val.text; }
      return cellText(String(val), { fill, color, bold, width: widths?.[ci] });
    }),
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...body], borders: tblBorders() });
}

// ── Ficha de caso (encabezado en banda + pares etiqueta/valor) ────────────────
function caseCard(title, pairs) {
  const headerRow = new TableRow({ children: [new TableCell({
    columnSpan: 2,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: BAND },
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, color: 'FFFFFF', size: 19 })] })],
  })] });
  const rows = pairs.map(([label, val]) => new TableRow({ children: [
    new TableCell({
      width: { size: 23, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: LABEL_FILL },
      margins: { top: 50, bottom: 50, left: 90, right: 90 },
      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] })],
    }),
    new TableCell({
      width: { size: 77, type: WidthType.PERCENTAGE },
      margins: { top: 50, bottom: 50, left: 90, right: 90 },
      children: [multiPara(val, { size: 18 })],
    }),
  ] }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...rows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BAND },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BAND },
      left: { style: BorderStyle.SINGLE, size: 4, color: BAND },
      right: { style: BorderStyle.SINGLE, size: 4, color: BAND },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'D6D3E8' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'D6D3E8' },
    },
  });
}

const ESTADO_COLOR = { 'PASÓ': GREEN, 'FALLÓ': RED, 'SALTADO': AMBER };

function feCard(c) {
  const obtColor = ESTADO_COLOR[c.estado] || null;
  return caseCard(`${c.id}  ·  ${c.tipo}  ·  Estado: ${c.estado}`, [
    ['Título / objetivo', c.titulo],
    ['Precondiciones', c.pre],
    ['Datos de entrada', c.datos],
    ['Pasos', c.pasos.map((s, i) => `${i + 1}. ${s}`).join('\n')],
    ['Resultado esperado', c.esperado],
    ['Resultado obtenido', { text: c.obtenido, color: obtColor }],
  ]);
}
function apiCard(c) {
  const obtColor = /FALL/i.test(c.obtenido) ? RED : GREEN;
  return caseCard(c.id, [
    ['Request', c.request],
    ['Precondición', c.pre],
    ['Pasos', c.pasos.map((s, i) => `${i + 1}. ${s}`).join('\n')],
    ['Resultado esperado', c.esperado],
    ['Resultado obtenido', { text: c.obtenido, color: obtColor }],
  ]);
}
function bugCard(b) {
  const sevColor = b.severity === 'HIGH' || b.severity === 'CRITICAL' ? RED : (b.severity === 'MEDIUM' ? AMBER : GREEN);
  return caseCard(`${b.id}  ·  ${b.module}  (${b.sprint})  ·  Severidad: ${b.severity}  ·  ${D.STATUS_LABEL[b.status]}`, [
    ['Título', { text: b.title, color: sevColor }],
    ['Prioridad', b.priority],
    ['Pasos de reproducción', b.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')],
    ['Resultado esperado', b.expected],
    ['Resultado obtenido', b.actual],
    ['Reportado por', b.reportedBy],
  ]);
}

// ── Encabezado y pie de página (estilo del documento entregado) ───────────────
function pageHeader() {
  return new Header({ children: [
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 },
      children: [new TextRun({ text: 'Taller: Control de Calidad de Software', bold: true, color: ORANGE, size: 16 })] }),
    new Paragraph({ spacing: { after: 60 },
      border: { bottom: { color: BAND, space: 2, style: BorderStyle.SINGLE, size: 18 } },
      children: [new TextRun({ text: 'Sistema de Gestión de Personas', bold: true, color: BAND, size: 22 })] }),
  ] });
}
function pageFooter() {
  return new Footer({ children: [new Paragraph({
    border: { top: { color: 'D6D3E8', space: 2, style: BorderStyle.SINGLE, size: 6 } },
    tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
    children: [
      new TextRun({ text: 'Universidad de la Ciudad de Buenos Aires · Grupo 9', color: GREY, size: 14 }),
      new TextRun({ text: '\t', size: 14 }),
      new TextRun({ text: 'Página ', color: GREY, size: 14 }),
      new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 14 }),
    ],
  })] });
}
const emptyHeader = new Header({ children: [new Paragraph({ children: [] })] });
const emptyFooter = new Footer({ children: [new Paragraph({ children: [] })] });

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENIDO
// ═══════════════════════════════════════════════════════════════════════════════
const body = [];

// ── Portada (estilo banda morada UCBA) ────────────────────────────────────────
body.push(
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: BAND },
      margins: { top: 240, bottom: 240, left: 200, right: 200 },
      children: [
        new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Taller: Control de Calidad de Software', bold: true, color: 'FFFFFF', size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 40 }, children: [new TextRun({ text: 'Universidad de la Ciudad de Buenos Aires', color: 'E6E4F4', size: 18 })] }),
      ],
    })] })],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
  }),
  new Paragraph({ spacing: { before: 700 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Grupo 9', bold: true, color: BAND_DK, size: 40 })] }),
  new Paragraph({ spacing: { before: 500 }, alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Sistema de Gestión', bold: true, color: ORANGE, size: 56 })] }),
  new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'de Personas', bold: true, color: ORANGE, size: 56 })] }),
  new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Trabajo Final Integrador', color: '374151', size: 26, italics: true })] }),
  new Paragraph({ spacing: { before: 40 }, alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Licenciatura en Tecnologías Digitales · Licenciatura en Ciencias de Datos', color: GREY, size: 18 })] }),
  new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Integrantes', bold: true, color: BAND, size: 20 })] }),
);
D.AUTHORS.forEach(a => body.push(
  new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 20 }, children: [new TextRun({ text: a, color: '374151', size: 20 })] }),
));
body.push(pageBreak());

// ── Índice / guía de lectura ──────────────────────────────────────────────────
body.push(
  h1('Índice y guía de lectura'),
  p('Para facilitar la corrección, cada sección indica el número de pregunta del enunciado y transcribe la consigna antes de responder.'),
  table(
    ['Pregunta del enunciado', 'Sección de este documento'],
    [
      ['Pregunta 1 — Casuística funcional y look&feel', 'Parte I · Pregunta 1'],
      ['Pregunta 2 — Pruebas tempranas de frontend sin backend', 'Parte I · Pregunta 2'],
      ['Pregunta 3 — Cobertura de backend en cada despliegue', 'Parte I · Pregunta 3'],
      ['Pregunta 4 — Problemas potenciales en producción', 'Parte I · Pregunta 4'],
      ['Pregunta 5 — Cómo descubrirlos antes (actividades y frecuencia)', 'Parte I · Pregunta 5'],
      ['Pregunta 6 — Organización del equipo de testing por sprint', 'Parte I · Pregunta 6'],
      ['Pregunta 7 a) — Plan de pruebas general', 'Parte II · 7a'],
      ['Pregunta 7 b) — Casos frontend Sprint N/N+1/N+2 + ejecución + bugs', 'Parte II · 7b'],
      ['Pregunta 7 c) — Casos de la API del Clima + colección Postman', 'Parte II · 7c'],
      ['Pregunta 7 d) — Reporte de pruebas ejecutadas y bugs', 'Parte II · 7d'],
      ['Pregunta 8 — Extensión al módulo Recruitment (3 sprints)', 'Parte I · Pregunta 8'],
    ],
    [5400, 4400],
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════════
// PARTE I — RESPUESTAS TEÓRICAS
// ═══════════════════════════════════════════════════════════════════════════════
body.push(
  new Paragraph({ spacing: { before: 120, after: 180 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'PARTE I — RESPUESTAS TEÓRICAS (PREGUNTAS 1 A 8)', size: 28, bold: true, color: HEADING })] }),
);

body.push(h1('Pregunta 1 — Organización de la casuística (funcional y look&feel)'), enunciadoBox(D.ENUNCIADOS.q1),
  p('Se organiza la casuística en suites por dominio funcional y pantalla real: PIM (Employee List, Add Employee, Edit Employee – Report to), My Info (Qualifications), Admin (Add User / asignación de perfil) y Dashboard (Widget de Clima). Esta modularidad logra que un cambio en una historia de usuario impacte solo en su suite, reduciendo el costo de mantenimiento y regresión.'),
  p('Dentro de cada suite se separan dos enfoques con objetivos y frecuencias distintas. Las pruebas funcionales (el "qué") se diseñan con técnicas de caja negra (partición de equivalencia, valores límite, transición de estados) y abstraen datos de entrada, estado inicial, pasos, resultado esperado y estado final; al apoyarse en un oráculo derivado de los criterios de aceptación, son objetivas y altamente automatizables. Las pruebas de look&feel (el "cómo") verifican estética, usabilidad y diseño (colores, tipografías, diagramación, responsive, Web Mobile, modo oscuro); como su automatización total genera muchos falsos positivos, se resuelven con revisiones visuales dirigidas, al cerrar cambios de interfaz o en la estabilización del sprint.'),
  p('Se adopta además un enfoque omnicanal: el caso se diseña abstracto a nivel funcional (regla de negocio común) y luego se deriva en escenarios concretos para Web y para Web Mobile (con flujos acotados y resoluciones restrictivas), evitando duplicar el diseño.'),
);

body.push(h1('Pregunta 2 — Pruebas tempranas del frontend sin backend listo'), enunciadoBox(D.ENUNCIADOS.q2),
  p('Con un enfoque Shift-Left basado en contratos. Antes de codificar el incremento se acuerda formalmente el contrato de cada API con el estándar OpenAPI / Swagger, que pasa a ser la única fuente de verdad compartida entre frontend y backend (contract-first / consumer-driven contracts).'),
  p('Ese contrato se publica en servidores de simulación: Postman Mock Server, o herramientas dedicadas como Mockoon o WireMock, que emulan con exactitud las respuestas y los códigos de estado HTTP del servidor real. Así el frontend desarrolla y prueba contra respuestas mockeadas estables desde el día 1 del sprint —incluyendo pruebas funcionales de UI, validaciones, mensajes de error, navegación y revisiones de look&feel— mientras el backend, en paralelo, valida que la estructura de sus respuestas cumple el esquema pactado.'),
  p('La transición a integración real se hace cuando el backend está operativo: se desactiva el mock y se conecta al servidor real para verificar que los contratos y respuestas coinciden con el comportamiento simulado. Si el backend rompe el contrato, las pruebas de contrato lo detectan de inmediato. Se elimina así la dependencia secuencial "primero backend, después frontend" y se reduce el costo de corregir defectos de interfaz de forma temprana.'),
);

body.push(h1('Pregunta 3 — Cobertura de backend por servicio en cada despliegue'), enunciadoBox(D.ENUNCIADOS.q3),
  p('Con una pirámide automatizada por microservicio, ejecutada por el pipeline de CI/CD ante cada commit o Pull Request; si un nivel falla, el pipeline se detiene e impide propagar el defecto. Prácticas incluidas:'),
  bulletLabel('1. Unitarias: ', 'del equipo de desarrollo, sobre la lógica interna en aislamiento.'),
  bulletLabel('2. Contrato: ', 'con OpenAPI/Swagger y Postman Mock Servers, para garantizar el esquema acordado con los consumidores.'),
  bulletLabel('3. Integración de componentes: ', 'validan la comunicación entre servicios dependientes, la persistencia y los servicios externos (BFF, proveedor de clima).'),
  bulletLabel('4. API automatizadas (Postman/Newman): ', 'reglas de negocio con caminos felices y no felices (4xx/5xx, tipos de datos).'),
  bulletLabel('5. Smoke de API: ', 'selección ligera que verifica que cada servicio está operativo inmediatamente después del despliegue.'),
);

body.push(h1('Pregunta 4 — Problemas potenciales en producción con picos de tráfico'), enunciadoBox(D.ENUNCIADOS.q4),
  p('El riesgo se concentra en Time > Attendance > Punch In/Out. Problemas previsibles:'),
  bulletLabel('Condiciones de carrera y marcaciones duplicadas: ', 'cuando muchos empleados fichan en el mismo minuto, con horarios inconsistentes.'),
  bulletLabel('Saturación de la base de datos y bloqueos: ', 'escrituras masivas simultáneas que generan colas, bloqueos de tablas y caídas por timeout.'),
  bulletLabel('Cuellos de botella en el BFF: ', 'al centralizar el tráfico web y mobile, una mala gestión de hilos puede saturarlo e interrumpir el acceso general.'),
  bulletLabel('Degradación o caída de APIs externas: ', 'el Widget de Clima depende de un proveedor externo; sin caché ni respuesta alternativa afecta el render del Dashboard.'),
  bulletLabel('Escalabilidad horizontal insuficiente: ', 'si el auto-escalado no reacciona a tiempo ante el pico.'),
);

body.push(h1('Pregunta 5 — Cómo descubrir esos problemas antes de producción'), enunciadoBox(D.ENUNCIADOS.q5),
  p('Con una estrategia de ingeniería de performance en un ambiente Staging espejo de producción, inyectando un dataset con 1 a 2 años de fichadas históricas y usando JMeter o Gatling. Los escenarios de carga y estrés incluyen pruebas de concurrencia de marcaciones simultáneas para verificar integridad de datos. La frecuencia responde a una lógica de costo-riesgo:'),
  table(['Actividad', 'Frecuencia', 'Objetivo / justificación'], D.PERF_MATRIX, [2600, 2600, 4600]),
);

body.push(h1('Pregunta 6 — Organización del equipo de testing por sprint'), enunciadoBox(D.ENUNCIADOS.q6),
  p('El equipo lo forman tres testers full stack (según el enunciado), insertos en un equipo mayor: cuatro desarrolladores full stack, un líder técnico, un analista funcional, un PO y un SM. La calidad es responsabilidad compartida, pero los tres testers se reparten responsabilidades con rotación para evitar silos:'),
  bulletLabel('Tester 1 – Líder de QA: ', 'estrategia general, coordinación, gestión del entorno, comunicación de riesgos y seguimiento del ciclo de vida de los defectos.'),
  bulletLabel('Tester 2 – Especialista en Performance: ', 'escenarios de carga, JMeter/Gatling, inyección del dataset en Staging y monitoreo de métricas (hilos, memoria, CPU, tiempos).'),
  bulletLabel('Tester 3 – Automatizador full stack: ', 'casuística funcional y look&feel, exploratorio en Web y Web Mobile, y scripts de automatización de API (Postman/Newman) y regresión de UI (Playwright).'),
  p('Cadencia dentro del sprint de 10 días para cubrir todos los tipos de prueba: días 1-2 diseño de casos en paralelo al desarrollo (Shift-Left), con los criterios de aceptación acordados junto al PO y al Analista Funcional en formato Dado/Cuando/Entonces (ATDD/BDD); días 3-7 ejecución funcional + automatización E2E y de API, con smoke en cada despliegue; días 7-9 regresión de módulos previos y prueba de carga al cierre; día 10 reporte. La rotación hace que los Testers 1 y 3 colaboren en el análisis de performance y el Tester 2 apoye en automatización de API y pruebas funcionales cuando su carga lo permite. El testing entra en el Definition of Done: una historia no está terminada sin scripts de API estables, suite funcional y exploratoria superada (Web y Mobile) y sin defectos abiertos de severidad Alta o Bloqueante. Para picos puntuales (por ejemplo seguridad en Recruitment) se puede sumar un perfil temporal, como prevé el enunciado.'),
);

body.push(h1('Pregunta 8 — Extensión al módulo Recruitment en 3 sprints'), enunciadoBox(D.ENUNCIADOS.q8),
  p('Con la plataforma base ya en producción, Recruitment se aborda con un enfoque de Testing Ágil "whole team": las pruebas guían cada etapa del ciclo y se reutiliza el marco que ya funcionó (contratos OpenAPI, desarrollo en paralelo sobre mocks y automatización en CI/CD). El riesgo dominante es la regresión sobre PIM, Admin y Time, por lo que la red de Smoke + Regresión automatizada se amplía de forma incremental en cada sprint para no degradar lo que ya opera en producción.'),
  h2('8.1 Implementación en tres sprints (R1, R2, R3)'),
  table(['Sprint', 'Alcance funcional', 'Foco estratégico de QA'],
    [
      ['R1', 'Estructura base y gestión de vacantes: ABM de búsquedas, parametrización de campos y publicación de solicitudes.', 'Validación de contratos de las nuevas APIs, pruebas funcionales de caja negra de alta/edición y control de look&feel.'],
      ['R2', 'Postulación y flujo del candidato: formulario público, carga de CV y transición de estados (entrevista, oferta, rechazo).', 'Front Web Mobile, sanitización estricta de entradas (solo .pdf/.docx y límite de tamaño) y reglas de transición de estados.'],
      ['R3', 'Integración con PIM (candidato seleccionado → empleado activo), reportes y estabilización.', 'E2E del flujo completo, regresión global, performance y escaneos de seguridad antes del despliegue final.'],
    ],
    [800, 4900, 4100]),
  h2('8.2 Recursos necesarios'),
  bulletLabel('Equipo base: ', 'PO y SM (prioridad de backlog y remoción de impedimentos), Analista Funcional (refina historias y criterios de aceptación), Líder Técnico (arquitectura de los nuevos microservicios e integración limpia con el backend existente) y 4 desarrolladores full stack.'),
  bulletLabel('Los 3 testers full stack: ', 'el Líder de QA coordina estrategia, métricas y riesgos; el Especialista en Performance ejecuta carga y estrés sobre los nuevos microservicios (crítico por sumar código a una plataforma productiva); y los tres conforman una célula de automatización y testing exploratorio.'),
  bulletLabel('Perfiles temporales sugeridos (lo permite el enunciado): ', 'un Especialista en Ciberseguridad (Pentester) en R2-R3 para los formularios públicos y la carga de archivos, y apoyo DevOps para reforzar el pipeline de Continuous Testing y la estabilidad de los entornos.'),
  h2('8.3 Herramientas'),
  bulletLabel('Gestión de pruebas y defectos: ', 'Bug Tracker propio del proyecto y/o herramienta tipo Jira/Mantis, con tablero Trello de enlace público para el seguimiento accesible al docente.'),
  bulletLabel('Automatización y API: ', 'Playwright para la regresión de interfaz y Postman/Newman para contratos e integración con APIs externas (por ejemplo, portales de empleo).'),
  bulletLabel('Seguridad y calidad de código: ', 'OWASP ZAP (escaneo dinámico en CI/CD) y SonarQube (análisis estático / SAST) antes del despliegue.'),
  bulletLabel('Captura de evidencias: ', 'Allure (captura, video y traza por caso) para documentar las anomalías de forma reproducible.'),
  h2('8.4 Estrategia de pruebas del nuevo feature'),
  bulletLabel('Diseño guiado por pruebas (ATDD/BDD): ', 'los criterios de aceptación se redactan en formato Dado/Cuando/Entonces antes de codificar, para fijar los requisitos complejos desde el inicio.'),
  bulletLabel('Prevención de regresión (crítico): ', 'al estar la base en producción, se prioriza la automatización de Smoke y Regresión en cada ciclo para no degradar PIM, Admin ni Time.'),
  bulletLabel('Caja negra + CRUD: ', 'partición de equivalencia y análisis de valores límite (p. ej. restricciones de edad, formatos de archivo) y validación del ciclo de vida de vacantes y candidatos.'),
  bulletLabel('Exploratorio por misiones: ', 'sesiones con objetivos concretos (p. ej. límites de tamaño y tipo en la subida de CV) para descubrir comportamientos no documentados.'),
  bulletLabel('No funcionales: ', 'usabilidad y compatibilidad multi-navegador y móvil (iOS/Android) del formulario público, además de seguridad alineada al OWASP Top 10.'),
  bulletLabel('Gestión de defectos en el sprint: ', 'cada bug se documenta con pasos, esperado vs. obtenido y evidencia, y se busca resolverlo dentro del mismo sprint para cerrar cada iteración con un incremento estable.'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════════
// PARTE II — ENTREGA PRÁCTICA (PREGUNTA 7)
// ═══════════════════════════════════════════════════════════════════════════════
body.push(
  new Paragraph({ spacing: { before: 120, after: 160 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'PARTE II — ENTREGA PRÁCTICA (PREGUNTA 7)', size: 28, bold: true, color: HEADING })] }),
  enunciadoBox(D.ENUNCIADOS.q7),
  p('Desarrollo incremental: Sprint N (backend Employee List y Add Employee; pantallas de Employee List y My Info – Qualifications), Sprint N+1 (backend My Info – Qualifications y Edit Employee – Report to; pantalla Report to), Sprint N+2 (back y front de Admin – Add), Sprint N+3 (Widget Clima front y back).'),
  h2('Entregables y enlaces de la práctica'),
  p('La entrega combina el detalle embebido en este documento con artefactos vivos del sistema (planilla, colección, tablero y reportes), de modo que cada punto sea fácil de revisar y reproducir:'),
  table(['Punto', 'Dónde está / artefacto'], D.ENTREGABLES, [3500, 6300]),
  pageBreak(),
);

// ── 7a) PLAN DE PRUEBAS ───────────────────────────────────────────────────────
body.push(
  h1('Pregunta 7 a) — Plan de Pruebas General'),
  h2('1. Propósito y contenido'),
  p('Define cómo el equipo de QA valida cada incremento de OrangeHRM y la integración con WeatherAPI.com que alimenta el widget de clima. Cubre alcance, estrategia, calendario por sprint (incluyendo hitos de performance), criterios de entrada y salida, gestión de defectos y entregables por sprint.'),
  h2('2. Estrategia de pruebas'),
  bulletLabel('Pirámide: ', 'base de API (Newman/Postman) y unitarias del equipo de desarrollo; capa intermedia E2E automatizada (Playwright); cúspide de exploratorio manual.'),
  bulletLabel('Tipos: ', 'Smoke (camino feliz de cada pantalla nueva), Regresión (funcionalidad previa afectada), Funcional (validaciones, mensajes de error) y API (contractual / negativa) sobre los 4 endpoints de la Weather API.'),
  bulletLabel('Herramientas: ', 'Playwright, Allure, Postman + Newman, Bug Tracker propio y Docker Compose. Ambiente: demo público opensource-demo.orangehrmlive.com (frontend) y WeatherAPI.com plan gratuito (integración).'),
  h2('3. Calendario de ejecución por sprint (incluye performance)'),
  p('Cada sprint se considera de 10 días hábiles. Los hitos se ubican en relación al inicio del sprint:'),
  table(['Sprint', 'Hitos de testing (funcional, automatización, regresión y PERFORMANCE)'], D.SPRINT_CALENDAR, [1700, 8100]),
  p('Nota: además de los hitos por sprint, el smoke de performance corre en cada despliegue a Staging y las pruebas de estrés se ejecutan antes de releases relevantes, según la matriz de la Pregunta 5.', { italics: true, size: 19, color: GREY }),
  h2('4. Criterios de entrada y de salida (sin contradicciones)'),
  p('Criterios de entrada: ambiente estable y configurado; code freeze de las ramas a evaluar; historias refinadas con criterios de aceptación; build verde (compila y pasa unitarias del equipo de desarrollo).'),
  p('Criterios de salida: (1) Smoke 100% de camino feliz aprobado; (2) suite de API en Newman 100% aprobada (0 fallos de contrato); (3) performance dentro de umbrales bajo carga normal; (4) NO existen defectos abiertos de severidad CRITICAL o HIGH atribuibles a la lógica de negocio del producto.'),
  p('Aclaración sobre el protocolo de excepciones (waiver): no contradice el criterio (4). El waiver NUNCA habilita liberar con un defecto CRITICAL o HIGH real de producto. Solo aplica a hallazgos tipificados y demostrados como falsos positivos del entorno externo (timeouts/latencia del demo público, strict mode de selectores), es decir defectos de la automatización y no del producto. Todo HIGH/CRITICAL de producto bloquea el paso a producción hasta su corrección.', { bold: false }),
  h2('5. Entregables por sprint'),
  bullet('Diseño de casos del incremento (secciones 7b y 7c).'),
  bullet('Suite E2E automatizada del sprint + suite de regresión acumulada.'),
  bullet('Informe de ejecución (Allure / reporte HTML) con detalle por caso (pasados, fallidos, saltados, con capturas/video/traza).'),
  bullet('Reporte de bugs en el Bug Tracker con pasos de reproducción, esperado vs. obtenido, severidad y responsable.'),
  bullet('En N+3: colección Postman/Newman de la Weather API y su reporte de ejecución.'),
  h2('6. Gestión de defectos'),
  p('Severidades: CRITICAL (bloquea el flujo principal), HIGH (afecta una funcionalidad clave sin bloquear), MEDIUM (funcionalidad secundaria o validación), LOW (cosmético/UX menor). Ciclo de vida: Abierto, En progreso, Resuelto, Cerrado (Reabierto si la corrección no es válida). Cada bug registra título, descripción, módulo, sprint, pasos, esperado vs. obtenido, severidad, prioridad, responsable y estado.'),
  pageBreak(),
);

// ── 7b) CASOS FRONTEND DETALLADOS ─────────────────────────────────────────────
body.push(
  h1('Pregunta 7 b) — Casos de prueba Frontend (Sprint N, N+1, N+2), ejecución y bugs'),
  p('Se presentan los 25 casos núcleo (CP-001 a CP-025) en formato detallado: tipo, precondiciones, datos, pasos, resultado esperado y resultado obtenido (estado de la última ejecución automatizada con Playwright). Las evidencias por caso (captura, video y traza) están en Allure (http://localhost:5050) y en el reporte HTML de Playwright; la planilla Casos_de_Prueba_OrangeHRM.xlsx exporta el detalle caso por caso.'),
);
for (const sp of D.FRONTEND_SPRINTS) {
  body.push(h2(sp.sprint), p(sp.desc, { italics: true, color: GREY }));
  for (const mod of sp.modules) {
    body.push(h3(`Módulo: ${mod.name}  ·  ${mod.range}`));
    for (const c of mod.cases) { body.push(feCard(c), spacer()); }
  }
  const e = sp.execution; const pct = ((e.passed / e.total) * 100).toFixed(0);
  body.push(
    h3(`Resultado de ejecución — ${sp.sprint}`),
    table(['Total', 'Pasaron', 'Fallaron', 'Saltados', '% éxito'],
      [[String(e.total), { text: String(e.passed), fill: GREEN_BG, color: GREEN }, { text: String(e.failed), fill: e.failed ? RED_BG : GREEN_BG, color: e.failed ? RED : GREEN }, String(e.skipped), `${pct}%`]],
      [1900, 1900, 1900, 1900, 1900]),
    spacer(),
  );
}
body.push(
  h3('Resumen de ejecución Frontend (casos núcleo)'),
  table(['Sprint', 'Total', 'Pasaron', 'Fallaron', 'Saltados', '% éxito'],
    [
      ['Sprint N (CP-001 a CP-015)', '15', '11', '3', '1', '73%'],
      ['Sprint N+1 (CP-016 a CP-020)', '5', '4', '1', '0', '80%'],
      ['Sprint N+2 (CP-021 a CP-025)', '5', '5', '0', '0', '100%'],
      [{ text: 'Total núcleo (CP-001 a CP-025)', bold: true }, { text: '25', bold: true }, { text: '20', bold: true, color: GREEN }, { text: '4', bold: true, color: RED }, { text: '1', bold: true }, { text: '80%', bold: true }],
    ],
    [3900, 1180, 1180, 1180, 1180, 1180]),
  p('Los 4 fallos y el caso saltado se explican por inestabilidad de la automatización contra el demo público (timeouts y strict mode) y dos assertions a revisar; ninguno compromete la lógica de negocio. Quedan como deuda de mantenimiento de la suite.', { italics: true, size: 19, color: GREY }),
  pageBreak(),
);

// ── 7c) CASOS API DETALLADOS ──────────────────────────────────────────────────
body.push(
  h1('Pregunta 7 c) — Casos de prueba de la API del Clima (Actividad 3)'),
  p('Se diseñaron 20 casos (CP-API-001 a CP-API-020) sobre los 4 endpoints de WeatherAPI.com que consume el widget del Dashboard, combinando camino feliz y no feliz. Cada caso indica endpoint, request, precondición, pasos, resultado esperado (status + aserciones) y resultado obtenido. La colección ejecutable está en api-tests/collections/WeatherAPI.postman_collection.json y su entorno en WeatherAPI.postman_environment.json.'),
);
for (const g of D.API_GROUPS) {
  body.push(h3(`${g.group}  ·  ${g.range}`));
  for (const c of g.cases) { body.push(apiCard(c), spacer()); }
}
body.push(
  h2('Resumen de ejecución API y colección Postman'),
  p('Última corrida (Newman dentro de Docker): 20/20 requests OK y 54/54 aserciones aprobadas, 0 fallos. Comando: newman run collections/WeatherAPI.postman_collection.json --environment collections/WeatherAPI.postman_environment.json --env-var "api_key=$WEATHER_API_KEY" --insecure --reporters cli,htmlextra. El flag --env-var inyecta la key real desde .env; --insecure evita el corte por inspección HTTPS de la red. La colección y el entorno se entregan en api-tests/collections/.'),
  pageBreak(),
);

// ── 7d) REPORTE Y BUGS ────────────────────────────────────────────────────────
body.push(
  h1('Pregunta 7 d) — Reporte de pruebas ejecutadas y reporte de bugs'),
  h2('1. Resumen consolidado de ejecución (Sprint N a N+3)'),
  table(['Suite', 'Casos', 'Pasaron', 'Fallaron', 'Saltados', '% éxito'],
    D.EXEC_SUMMARY.map((r, i) => i === D.EXEC_SUMMARY.length - 1
      ? r.map(v => ({ text: v, fill: ZEBRA, bold: true }))
      : r),
    [4000, 1160, 1160, 1160, 1160, 1160]),
  p('La suite de regresión adicional (otros módulos: Leave, Buzz, Recruitment, Directory, Dashboard, Time & Attendance) rinde 55% por inestabilidad del demo público (timeouts por latencia variable y strict mode de selectores), no por defectos de producto. Es deuda de mantenimiento de la automatización y queda como acción de seguimiento. Las evidencias por caso (captura, video, traza) están en Allure (http://localhost:5050) y en el reporte HTML de Playwright; el detalle por caso también se exporta a Casos_de_Prueba_OrangeHRM.xlsx.', { italics: true, size: 19, color: GREY }),
  h2('2. Reporte de bugs (detallado y reproducible)'),
  p('Los 6 bugs están cargados en el Bug Tracker (http://localhost:3000) y, para la entrega accesible al docente, en el tablero de Trello con enlace público y sin vencimiento. Cada bug incluye pasos de reproducción, resultado esperado y resultado obtenido para que el defecto pueda reproducirse.'),
);
for (const b of D.BUGS) { body.push(bugCard(b), spacer()); }
body.push(
  h2('3. Conclusiones'),
  bullet('Los 25 casos núcleo (Actividad 2) alcanzaron 80% de éxito (20/25). Los 4 fallos y el saltado son inestabilidad de la automatización contra el demo público, no defectos de lógica de negocio.'),
  bullet('Se detectaron 6 bugs de producto; 3 de severidad HIGH (BUG-02 integridad de datos, BUG-04 performance, BUG-06 manejo de error del widget) deben corregirse antes del paso a producción según el criterio de salida.'),
  bullet('La API del Clima (Actividad 3) pasó el 100% (54/54 aserciones), validando caminos felices y manejo de errores (401, 400) de los 4 endpoints. Se ajustó CP-API-004 porque el proveedor cambió el código de 403 a 401, lo que muestra el valor de las pruebas de contrato.'),
  bullet('La regresión adicional (55%) es deuda de automatización (timeouts y selectores), no bugs nuevos; se planifica su estabilización en la próxima iteración.'),
  pageBreak(),
);

// ── 7e) MIND MAP FUNCIONAL ────────────────────────────────────────────────────
body.push(
  h1('Pregunta 7 e) — Mind Map funcional de OrangeHRM (Actividad 1)'),
  p('Mapa mental del sitio construido a partir del testing exploratorio (Actividad 1). Identifica las funcionalidades principales y secundarias que delimitan el alcance de la casuística y orientan la priorización de las suites. Las etiquetas indican el carácter de cada rama:'),
  bulletLabel('Principal: ', 'módulo central del alcance de pruebas (PIM, My Info, Admin).'),
  bulletLabel('Secundaria: ', 'funcionalidad de soporte o parametrización, con menor prioridad de casos.'),
  bulletLabel('Crítica: ', 'foco de riesgo operativo/performance (Time – Attendance).'),
  bulletLabel('Nuevo: ', 'incremento del Sprint N+3 (Widget de Clima).'),
  bulletLabel('Futuro: ', 'módulo planificado (Recruitment, preguntas 8).'),
  spacer(),
);
body.push(...D.MINDMAP.map(mindNode));
body.push(
  p('Este mapa es el insumo de la organización de la casuística (Pregunta 1): cada rama principal se traduce en una suite funcional y su correspondiente suite de look&feel, y las ramas Crítica/Nuevo concentran además las pruebas no funcionales (performance del Punch In/Out, manejo de error del widget).', { italics: true, size: 19, color: GREY }),
  pageBreak(),
);

// ── Anexo: devolución del docente ─────────────────────────────────────────────
body.push(
  h1('Anexo — Cómo esta versión atiende la devolución del docente'),
  table(['Observación del docente', 'Corrección aplicada en esta versión'], D.DEVOLUCION, [4400, 5400]),
);

// ── Documento ───────────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'Grupo 9 — Taller de Control de Calidad de Software',
  title: 'Trabajo Final Integrador — Sistema de Gestión de Personas',
  description: 'Respuestas teóricas (1 a 8) + entrega práctica (pregunta 7: a, b, c, d)',
  styles: { default: { document: { run: { font: 'Calibri', size: 21 } } } },
  sections: [{
    properties: {
      titlePage: true,
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1700, right: 1440, bottom: 1440, left: 1440, header: 720, footer: 480 } },
    },
    headers: { default: pageHeader(), first: emptyHeader },
    footers: { default: pageFooter(), first: emptyFooter },
    children: body,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  const kb = (fs.statSync(OUTPUT).size / 1024).toFixed(0);
  console.log(`OK  Documento generado: ${OUTPUT}  (${kb} KB)`);
}).catch(err => {
  console.error('ERROR al generar el documento:', err.message);
  process.exit(1);
});
