'use strict';

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  BorderStyle, WidthType, AlignmentType, ShadingType, VerticalAlign, PageBreak,
  Header, Footer, PageNumber, TabStopType,
} = require('docx');
const fs = require('fs');

const OUTPUT = '/work/Informe_Final_Consigna7.docx';
const D = require('/work/shared/qa-data.js');

// ── Paleta (alineada al documento entregado) ──────────────────────────────────
const BAND='5B5BA6', BAND_DK='3F3D74', HEADING='4C3A8C', HEADING2='5B5BA6', ORANGE='E8852B';
const TBL_HEAD='FCE5CD', TBL_HEADTX='7A3E00', TBL_BORDER='E69138', ZEBRA='F6F4FB', LABEL_FILL='EFEDF7';
const GREEN='166534', GREEN_BG='DCFCE7', RED='991B1B', RED_BG='FEE2E2', AMBER='92400E', GREY='6B7280';

// ── Helpers ───────────────────────────────────────────────────────────────────
function h1(t){return new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:340,after:150},border:{bottom:{color:ORANGE,space:4,style:BorderStyle.SINGLE,size:14}},children:[new TextRun({text:t,bold:true,color:HEADING,size:30})]});}
function h2(t){return new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:260,after:110},children:[new TextRun({text:t,bold:true,color:HEADING2,size:24})]});}
function h3(t){return new Paragraph({heading:HeadingLevel.HEADING_3,spacing:{before:190,after:90},children:[new TextRun({text:t,bold:true,underline:{},color:'374151',size:21})]});}
function p(t,o={}){return new Paragraph({spacing:{after:110},alignment:AlignmentType.JUSTIFIED,children:[new TextRun({text:t,size:21,...o})]});}
function bullet(t,o={}){return new Paragraph({bullet:{level:0},spacing:{after:50},alignment:AlignmentType.JUSTIFIED,children:[new TextRun({text:t,size:21,...o})]});}
function bulletLabel(l,r){return new Paragraph({bullet:{level:0},spacing:{after:50},alignment:AlignmentType.JUSTIFIED,children:[new TextRun({text:l,bold:true,size:21}),new TextRun({text:r,size:21})]});}
function pageBreak(){return new Paragraph({children:[new PageBreak()]});}
function spacer(){return new Paragraph({spacing:{after:140},children:[]});}
const TAG_COLOR={'Principal':HEADING2,'Crítica':RED,'Nuevo':ORANGE,'Futuro':GREY,'Secundaria':GREY};
function mindNode(n){const runs=[new TextRun({text:n.t,size:n.lvl===0?23:20,bold:n.lvl<=1,color:n.lvl===0?HEADING:undefined})];if(n.tag)runs.push(new TextRun({text:`   [${n.tag}]`,size:16,italics:true,bold:true,color:TAG_COLOR[n.tag]||GREY}));return new Paragraph({bullet:{level:n.lvl},spacing:{after:30},children:runs});}

function multiPara(value,{size=18,color=null,bold=false}={}){
  let text=value,c=color;
  if(value&&typeof value==='object'){text=value.text;c=value.color||color;}
  const lines=String(text).split('\n'),children=[];
  lines.forEach((ln,i)=>{if(i>0)children.push(new TextRun({break:1}));children.push(new TextRun({text:ln,size,bold,color:c||undefined}));});
  return new Paragraph({children});
}
function tblBorders(){return{top:{style:BorderStyle.SINGLE,size:4,color:TBL_BORDER},bottom:{style:BorderStyle.SINGLE,size:4,color:TBL_BORDER},left:{style:BorderStyle.SINGLE,size:4,color:TBL_BORDER},right:{style:BorderStyle.SINGLE,size:4,color:TBL_BORDER},insideHorizontal:{style:BorderStyle.SINGLE,size:4,color:'EBC9A6'},insideVertical:{style:BorderStyle.SINGLE,size:4,color:'EBC9A6'}};}
function cellText(text,{bold=false,color=null,fill=null,header=false,width=null}={}){
  return new TableCell({width:width?{size:width,type:WidthType.DXA}:undefined,verticalAlign:VerticalAlign.CENTER,shading:fill?{type:ShadingType.CLEAR,color:'auto',fill}:undefined,margins:{top:50,bottom:50,left:90,right:90},children:[multiPara({text,color:header?TBL_HEADTX:color},{size:18,bold:header||bold})]});
}
function table(headers,rows,widths){
  const headerRow=new TableRow({tableHeader:true,children:headers.map((t,i)=>cellText(t,{header:true,fill:TBL_HEAD,width:widths?.[i]}))});
  const bodyRows=rows.map((r,ri)=>new TableRow({children:r.map((val,ci)=>{let fill=ri%2===1?ZEBRA:'FFFFFF',color=null,bold=false;if(val&&typeof val==='object'){fill=val.fill||fill;color=val.color||null;bold=val.bold||false;val=val.text;}return cellText(String(val),{fill,color,bold,width:widths?.[ci]});})}));
  return new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[headerRow,...bodyRows],borders:tblBorders()});
}
function caseCard(title,pairs){
  const headerRow=new TableRow({children:[new TableCell({columnSpan:2,shading:{type:ShadingType.CLEAR,color:'auto',fill:BAND},margins:{top:50,bottom:50,left:100,right:100},children:[new Paragraph({children:[new TextRun({text:title,bold:true,color:'FFFFFF',size:19})]})]})]});
  const rows=pairs.map(([label,val])=>new TableRow({children:[
    new TableCell({width:{size:23,type:WidthType.PERCENTAGE},shading:{type:ShadingType.CLEAR,color:'auto',fill:LABEL_FILL},margins:{top:50,bottom:50,left:90,right:90},children:[new Paragraph({children:[new TextRun({text:label,bold:true,size:18})]})]}),
    new TableCell({width:{size:77,type:WidthType.PERCENTAGE},margins:{top:50,bottom:50,left:90,right:90},children:[multiPara(val,{size:18})]}),
  ]}));
  return new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[headerRow,...rows],borders:{top:{style:BorderStyle.SINGLE,size:4,color:BAND},bottom:{style:BorderStyle.SINGLE,size:4,color:BAND},left:{style:BorderStyle.SINGLE,size:4,color:BAND},right:{style:BorderStyle.SINGLE,size:4,color:BAND},insideHorizontal:{style:BorderStyle.SINGLE,size:4,color:'D6D3E8'},insideVertical:{style:BorderStyle.SINGLE,size:4,color:'D6D3E8'}}});
}
const ESTADO_COLOR={'PASÓ':GREEN,'FALLÓ':RED,'SALTADO':AMBER};
function feCard(c){return caseCard(`${c.id}  ·  ${c.tipo}  ·  Estado: ${c.estado}`,[['Título / objetivo',c.titulo],['Precondiciones',c.pre],['Datos de entrada',c.datos],['Pasos',c.pasos.map((s,i)=>`${i+1}. ${s}`).join('\n')],['Resultado esperado',c.esperado],['Resultado obtenido',{text:c.obtenido,color:ESTADO_COLOR[c.estado]||null}]]);}
function apiCard(c){return caseCard(c.id,[['Request',c.request],['Precondición',c.pre],['Pasos',c.pasos.map((s,i)=>`${i+1}. ${s}`).join('\n')],['Resultado esperado',c.esperado],['Resultado obtenido',{text:c.obtenido,color:/FALL/i.test(c.obtenido)?RED:GREEN}]]);}
function bugCard(b){const sc=b.severity==='HIGH'||b.severity==='CRITICAL'?RED:(b.severity==='MEDIUM'?AMBER:GREEN);return caseCard(`${b.id}  ·  ${b.module}  (${b.sprint})  ·  Severidad: ${b.severity}  ·  ${D.STATUS_LABEL[b.status]}`,[['Título',{text:b.title,color:sc}],['Prioridad',b.priority],['Pasos de reproducción',b.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')],['Resultado esperado',b.expected],['Resultado obtenido',b.actual],['Reportado por',b.reportedBy]]);}

function pageHeader(){return new Header({children:[
  new Paragraph({alignment:AlignmentType.RIGHT,spacing:{after:0},children:[new TextRun({text:'Taller: Control de Calidad de Software',bold:true,color:ORANGE,size:16})]}),
  new Paragraph({spacing:{after:60},border:{bottom:{color:BAND,space:2,style:BorderStyle.SINGLE,size:18}},children:[new TextRun({text:'Sistema de Gestión de Personas',bold:true,color:BAND,size:22})]}),
]});}
function pageFooter(){return new Footer({children:[new Paragraph({border:{top:{color:'D6D3E8',space:2,style:BorderStyle.SINGLE,size:6}},tabStops:[{type:TabStopType.RIGHT,position:9026}],children:[new TextRun({text:'Universidad de la Ciudad de Buenos Aires · Grupo 9',color:GREY,size:14}),new TextRun({text:'\t',size:14}),new TextRun({text:'Página ',color:GREY,size:14}),new TextRun({children:[PageNumber.CURRENT],color:GREY,size:14})]})]});}
const emptyHeader=new Header({children:[new Paragraph({children:[]})]});
const emptyFooter=new Footer({children:[new Paragraph({children:[]})]});

// ═══════════════════════════════════════════════════════════════════════════════
const body=[];

// Portada
body.push(
  new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[new TableCell({shading:{type:ShadingType.CLEAR,color:'auto',fill:BAND},margins:{top:240,bottom:240,left:200,right:200},children:[
    new Paragraph({children:[new TextRun({text:'Taller: Control de Calidad de Software',bold:true,color:'FFFFFF',size:28})]}),
    new Paragraph({spacing:{before:40},children:[new TextRun({text:'Universidad de la Ciudad de Buenos Aires',color:'E6E4F4',size:18})]}),
  ]})]})],borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideHorizontal:{style:BorderStyle.NONE},insideVertical:{style:BorderStyle.NONE}}}),
  new Paragraph({spacing:{before:700},alignment:AlignmentType.RIGHT,children:[new TextRun({text:'Grupo 9',bold:true,color:BAND_DK,size:40})]}),
  new Paragraph({spacing:{before:500},children:[new TextRun({text:'Documentación de Procesos',bold:true,color:ORANGE,size:50})]}),
  new Paragraph({children:[new TextRun({text:'de Testing — Consigna 7',bold:true,color:ORANGE,size:50})]}),
  new Paragraph({spacing:{before:200},children:[new TextRun({text:'Sistema de Gestión de Personas (OrangeHRM) + Weather API',color:'374151',size:24,italics:true})]}),
  new Paragraph({spacing:{before:40},children:[new TextRun({text:'Incluye: a) Plan de pruebas · b) Casos Frontend y resultados · c) Casos de API y colección Postman · d) Reporte y bugs',color:GREY,size:18})]}),
  new Paragraph({spacing:{before:600},alignment:AlignmentType.RIGHT,children:[new TextRun({text:'Integrantes',bold:true,color:BAND,size:20})]}),
);
D.AUTHORS.forEach(a=>body.push(new Paragraph({alignment:AlignmentType.RIGHT,spacing:{after:20},children:[new TextRun({text:a,color:'374151',size:20})]})));
body.push(pageBreak());

// Índice
body.push(h1('Índice'),
  bullet('a) Plan de Pruebas General',{bold:true}),
  bullet('b) Casos de prueba Frontend (Sprint N, N+1, N+2), ejecución y bugs',{bold:true}),
  bullet('c) Casos de prueba de la API del Clima (Actividad 3) y colección Postman',{bold:true}),
  bullet('d) Reporte consolidado de pruebas ejecutadas y reporte de bugs',{bold:true}),
  bullet('e) Mind Map funcional de OrangeHRM (Actividad 1)',{bold:true}),
  spacer(),
  h2('Entregables y enlaces'),
  p('La entrega combina el detalle embebido en este documento con artefactos vivos del sistema (planilla, colección, tablero y reportes), para que cada punto sea fácil de revisar y reproducir:'),
  table(['Punto','Dónde está / artefacto'],D.ENTREGABLES,[3500,6300]),
  pageBreak());

// a) Plan
body.push(
  h1('a) Plan de Pruebas General'),
  h2('1. Propósito y contenido'),
  p('Define cómo el equipo de QA valida cada incremento de OrangeHRM y la integración con WeatherAPI.com que alimenta el widget de clima. Cubre alcance, estrategia, calendario por sprint (incluyendo hitos de performance), criterios de entrada y salida, gestión de defectos y entregables por sprint.'),
  h2('2. Estrategia de pruebas'),
  bulletLabel('Pirámide: ','base de API (Newman/Postman) y unitarias del equipo de desarrollo; capa intermedia E2E automatizada (Playwright); cúspide de exploratorio manual.'),
  bulletLabel('Tipos: ','Smoke (camino feliz de cada pantalla nueva), Regresión (funcionalidad previa afectada), Funcional (validaciones, mensajes de error) y API (contractual / negativa) sobre los 4 endpoints de la Weather API.'),
  bulletLabel('Herramientas: ','Playwright, Allure, Postman + Newman, Bug Tracker propio y Docker Compose. Ambiente: demo público opensource-demo.orangehrmlive.com (frontend) y WeatherAPI.com plan gratuito (integración).'),
  h2('3. Calendario de ejecución por sprint (incluye performance)'),
  p('Cada sprint se considera de 10 días hábiles. Los hitos se ubican en relación al inicio del sprint:'),
  table(['Sprint','Hitos de testing (funcional, automatización, regresión y PERFORMANCE)'],D.SPRINT_CALENDAR,[1700,8100]),
  p('Nota: el smoke de performance corre en cada despliegue a Staging y las pruebas de estrés antes de releases relevantes.',{italics:true,size:19,color:GREY}),
  h2('4. Criterios de entrada y de salida (sin contradicciones)'),
  p('Entrada: ambiente estable y configurado; code freeze de las ramas a evaluar; historias refinadas con criterios de aceptación; build verde (compila y pasa unitarias del equipo de desarrollo).'),
  p('Salida: (1) Smoke 100% de camino feliz aprobado; (2) suite de API en Newman 100% aprobada (0 fallos de contrato); (3) performance dentro de umbrales bajo carga normal; (4) NO existen defectos abiertos CRITICAL o HIGH atribuibles a la lógica de negocio del producto.'),
  p('Protocolo de excepciones (waiver): no contradice el criterio (4). El waiver NUNCA habilita liberar con un defecto CRITICAL o HIGH real de producto; solo aplica a falsos positivos del entorno externo (timeouts/latencia del demo público, strict mode de selectores). Todo HIGH/CRITICAL de producto bloquea el paso a producción hasta su corrección.'),
  h2('5. Entregables por sprint'),
  bullet('Diseño de casos del incremento (secciones b y c).'),
  bullet('Suite E2E automatizada del sprint + suite de regresión acumulada.'),
  bullet('Informe de ejecución (Allure / HTML) con detalle por caso (capturas/video/traza).'),
  bullet('Reporte de bugs en el Bug Tracker con pasos de reproducción, esperado vs. obtenido, severidad y responsable.'),
  bullet('En N+3: colección Postman/Newman de la Weather API y su reporte de ejecución.'),
  h2('6. Gestión de defectos'),
  p('Severidades: CRITICAL, HIGH, MEDIUM, LOW. Ciclo de vida: Abierto, En progreso, Resuelto, Cerrado (Reabierto si la corrección no es válida). Cada bug registra título, descripción, módulo, sprint, pasos, esperado vs. obtenido, severidad, prioridad, responsable y estado.'),
  pageBreak(),
);

// b) Frontend
body.push(
  h1('b) Casos de prueba Frontend — Sprint N, N+1 y N+2 (Actividad 2)'),
  p('25 casos núcleo (CP-001 a CP-025) en formato detallado: tipo, precondiciones, datos, pasos, resultado esperado y resultado obtenido (estado de la última ejecución con Playwright). Evidencias por caso en Allure (http://localhost:5050), reporte HTML de Playwright y planilla Casos_de_Prueba_OrangeHRM.xlsx.'),
);
for(const sp of D.FRONTEND_SPRINTS){
  body.push(h2(sp.sprint),p(sp.desc,{italics:true,color:GREY}));
  for(const mod of sp.modules){body.push(h3(`Módulo: ${mod.name}  ·  ${mod.range}`));for(const c of mod.cases){body.push(feCard(c),spacer());}}
  const e=sp.execution,pct=((e.passed/e.total)*100).toFixed(0);
  body.push(h3(`Resultado de ejecución — ${sp.sprint}`),table(['Total','Pasaron','Fallaron','Saltados','% éxito'],[[String(e.total),{text:String(e.passed),fill:GREEN_BG,color:GREEN},{text:String(e.failed),fill:e.failed?RED_BG:GREEN_BG,color:e.failed?RED:GREEN},String(e.skipped),`${pct}%`]],[1900,1900,1900,1900,1900]),spacer());
}
body.push(
  h3('Resumen de ejecución Frontend (casos núcleo)'),
  table(['Sprint','Total','Pasaron','Fallaron','Saltados','% éxito'],[
    ['Sprint N (CP-001 a CP-015)','15','11','3','1','73%'],
    ['Sprint N+1 (CP-016 a CP-020)','5','4','1','0','80%'],
    ['Sprint N+2 (CP-021 a CP-025)','5','5','0','0','100%'],
    [{text:'Total núcleo',bold:true},{text:'25',bold:true},{text:'20',bold:true,color:GREEN},{text:'4',bold:true,color:RED},{text:'1',bold:true},{text:'80%',bold:true}],
  ],[3900,1180,1180,1180,1180,1180]),
  pageBreak(),
);

// c) API
body.push(
  h1('c) Casos de prueba de la API del Clima (Actividad 3)'),
  p('20 casos (CP-API-001 a CP-API-020) sobre los 4 endpoints de WeatherAPI.com, con camino feliz y no feliz. Cada caso indica endpoint, request, precondición, pasos, esperado (status + aserciones) y obtenido. Colección en api-tests/collections/WeatherAPI.postman_collection.json y entorno en WeatherAPI.postman_environment.json.'),
);
for(const g of D.API_GROUPS){body.push(h3(`${g.group}  ·  ${g.range}`));for(const c of g.cases){body.push(apiCard(c),spacer());}}
body.push(
  h2('Resumen de ejecución API y colección Postman'),
  p('Última corrida (Newman en Docker): 20/20 requests OK y 54/54 aserciones aprobadas, 0 fallos. Comando: newman run collections/WeatherAPI.postman_collection.json --environment collections/WeatherAPI.postman_environment.json --env-var "api_key=$WEATHER_API_KEY" --insecure --reporters cli,htmlextra.'),
  pageBreak(),
);

// d) Reporte y bugs
body.push(
  h1('d) Reporte de pruebas ejecutadas y reporte de bugs'),
  h2('1. Resumen consolidado de ejecución (Sprint N a N+3)'),
  table(['Suite','Casos','Pasaron','Fallaron','Saltados','% éxito'],D.EXEC_SUMMARY.map((r,i)=>i===D.EXEC_SUMMARY.length-1?r.map(v=>({text:v,fill:ZEBRA,bold:true})):r),[4000,1160,1160,1160,1160,1160]),
  p('La regresión adicional (55%) responde a inestabilidad del demo público (timeouts y strict mode), no a defectos de producto; es deuda de mantenimiento de la automatización. Evidencias por caso en Allure y reporte HTML; detalle por caso en Casos_de_Prueba_OrangeHRM.xlsx.',{italics:true,size:19,color:GREY}),
  h2('2. Reporte de bugs (detallado y reproducible)'),
  p('Los 6 bugs están en el Bug Tracker (http://localhost:3000) y en el tablero de Trello con enlace público sin vencimiento. Cada bug incluye pasos de reproducción, esperado y obtenido.'),
);
for(const b of D.BUGS){body.push(bugCard(b),spacer());}
body.push(
  h2('3. Conclusiones'),
  bullet('Los 25 casos núcleo alcanzaron 80% de éxito (20/25); los fallos son inestabilidad de la automatización, no defectos de negocio.'),
  bullet('6 bugs de producto; 3 HIGH (BUG-02, BUG-04, BUG-06) deben corregirse antes del paso a producción.'),
  bullet('La API del Clima pasó el 100% (54/54 aserciones). Se ajustó CP-API-004 por el cambio 403→401 del proveedor.'),
  pageBreak(),
);

// e) Mind Map
body.push(
  h1('e) Mind Map funcional de OrangeHRM (Actividad 1)'),
  p('Mapa mental del sitio construido a partir del testing exploratorio (Actividad 1). Identifica las funcionalidades principales y secundarias que delimitan el alcance de la casuística. Etiquetas: Principal (módulo central), Secundaria (soporte/parametrización), Crítica (riesgo de performance), Nuevo (Sprint N+3) y Futuro (Recruitment).'),
  spacer(),
);
body.push(...D.MINDMAP.map(mindNode));
body.push(
  p('Cada rama principal se traduce en una suite funcional y su suite de look&feel; las ramas Crítica/Nuevo concentran además las pruebas no funcionales.',{italics:true,size:19,color:GREY}),
  pageBreak(),
);

// Anexo
body.push(h1('Anexo — Cómo esta versión atiende la devolución del docente'),table(['Observación del docente','Corrección aplicada'],D.DEVOLUCION,[4400,5400]));

const doc=new Document({
  creator:'Grupo 9 — Taller de Control de Calidad de Software',
  title:'Documentación de Procesos de Testing — Consigna 7',
  description:'Plan de pruebas, casos (Frontend y API), resultados y bugs',
  styles:{default:{document:{run:{font:'Calibri',size:21}}}},
  sections:[{
    properties:{titlePage:true,page:{size:{width:11906,height:16838},margin:{top:1700,right:1440,bottom:1440,left:1440,header:720,footer:480}}},
    headers:{default:pageHeader(),first:emptyHeader},
    footers:{default:pageFooter(),first:emptyFooter},
    children:body,
  }],
});
Packer.toBuffer(doc).then(buffer=>{fs.writeFileSync(OUTPUT,buffer);const kb=(fs.statSync(OUTPUT).size/1024).toFixed(0);console.log(`OK  Documento generado: ${OUTPUT}  (${kb} KB)`);}).catch(err=>{console.error('ERROR al generar el documento:',err.message);process.exit(1);});
