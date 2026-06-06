'use strict';

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app    = express();
const PORT   = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, 'data');
const DB     = path.join(DB_DIR, 'bugs.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── DB helpers ──────────────────────────────────────────────────────────────

function readDB() {
  if (!fs.existsSync(DB)) return { nextId: 1, bugs: [] };
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return { nextId: 1, bugs: [] }; }
}

function writeDB(data) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// ── Seed inicial ─────────────────────────────────────────────────────────────

const SEED = [
  {
    title: 'Employee List: botón Reset no limpia todos los filtros',
    description: 'Al hacer clic en Reset sólo se limpia el campo "Employee Name". Los demás filtros (Employment Status, Job Title) conservan el valor seleccionado.',
    severity: 'LOW',
    priority: 'MEDIUM',
    status: 'OPEN',
    sprint: 'Sprint N',
    module: 'PIM - Employee List',
    steps: '1. Ir a PIM > Employee List.\n2. Seleccionar un Employment Status del dropdown.\n3. Ingresar texto en Employee Name.\n4. Hacer clic en "Reset".',
    expected: 'Todos los campos del formulario de búsqueda quedan en su estado inicial.',
    actual: 'Solo el campo Employee Name se limpia; los demás retienen el valor.',
    reported_by: 'Tester 1',
    assigned_to: 'Dev Team'
  },
  {
    title: 'Add Employee: se permite crear empleados con Employee ID duplicado',
    description: 'El sistema acepta guardar un nuevo empleado con un Employee ID que ya existe en la base de datos, lo que genera registros duplicados.',
    severity: 'HIGH',
    priority: 'HIGH',
    status: 'OPEN',
    sprint: 'Sprint N',
    module: 'PIM - Add Employee',
    steps: '1. Ir a PIM > Add Employee.\n2. Ingresar un Employee ID ya existente (ej. 0001).\n3. Completar First Name y Last Name.\n4. Hacer clic en "Save".',
    expected: 'El sistema debe rechazar el ID duplicado y mostrar un mensaje de error de validación.',
    actual: 'El empleado se crea exitosamente con el mismo ID, generando duplicidad.',
    reported_by: 'Tester 1',
    assigned_to: 'Dev Team'
  },
  {
    title: 'My Info - Qualifications: acepta fecha de fin anterior a fecha de inicio en Work Experience',
    description: 'El formulario de Work Experience no valida que la fecha de finalización sea posterior a la fecha de inicio. Permite guardar rangos de fechas lógicamente inválidos.',
    severity: 'MEDIUM',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    sprint: 'Sprint N',
    module: 'PIM - My Info - Qualifications',
    steps: '1. Navegar a My Info > Qualifications o PIM > Employee > Qualifications.\n2. Hacer clic en "Add" en la sección Work Experience.\n3. Completar "From" con 2023-06-01 y "To" con 2022-01-01 (fecha anterior).\n4. Hacer clic en "Save".',
    expected: 'El sistema rechaza la entrada y muestra "To date must be after From date" o similar.',
    actual: 'El registro se guarda sin validación de rango de fechas.',
    reported_by: 'Tester 2',
    assigned_to: 'Dev Team'
  },
  {
    title: 'Edit Employee - Report to: autocomplete de supervisor tarda más de 10s con base grande',
    description: 'Al agregar un supervisor en la pestaña Report-to de un empleado, el campo de búsqueda de supervisor demora más de 10 segundos en mostrar sugerencias cuando hay más de 200 empleados en el sistema.',
    severity: 'HIGH',
    priority: 'HIGH',
    status: 'OPEN',
    sprint: 'Sprint N+1',
    module: 'PIM - Edit Employee - Report to',
    steps: '1. Asegurarse de tener más de 200 empleados cargados.\n2. Ir a PIM > Employee List > [cualquier empleado] > Report-to.\n3. Hacer clic en "Add" en la sección Supervisors.\n4. Comenzar a escribir un nombre en el campo de búsqueda.',
    expected: 'Las sugerencias aparecen en menos de 2 segundos.',
    actual: 'Las sugerencias tardan entre 10 y 15 segundos en aparecer, bloqueando la UI.',
    reported_by: 'Tester 3 (Performance)',
    assigned_to: 'Dev Team'
  },
  {
    title: 'Admin - Add User: contraseña sin caracteres especiales es aceptada',
    description: 'La política de contraseñas del sistema acepta contraseñas de 8 caracteres sin caracteres especiales (ej. "Password1"), lo que no cumple con los criterios de seguridad definidos.',
    severity: 'MEDIUM',
    priority: 'HIGH',
    status: 'OPEN',
    sprint: 'Sprint N+2',
    module: 'Admin - User Management',
    steps: '1. Ir a Admin > User Management > Users.\n2. Hacer clic en "Add".\n3. Completar todos los campos.\n4. Ingresar "Password1" como contraseña y confirmarla.\n5. Hacer clic en "Save".',
    expected: 'El sistema rechaza la contraseña y exige al menos 1 carácter especial.',
    actual: 'El usuario se crea con esa contraseña sin error de validación.',
    reported_by: 'Tester 1',
    assigned_to: 'Dev Team'
  },
  {
    title: 'Widget Clima: no muestra mensaje de error cuando la API del clima no responde',
    description: 'Cuando la API de WeatherAPI.com está caída o la key es inválida, el widget del dashboard queda en estado de carga infinita sin nunca mostrar un mensaje de error al usuario.',
    severity: 'HIGH',
    priority: 'HIGH',
    status: 'OPEN',
    sprint: 'Sprint N+3',
    module: 'Dashboard - Widget Clima',
    steps: '1. Configurar una API key inválida en el backend del widget.\n2. Cargar el dashboard principal.\n3. Observar el comportamiento del widget de clima.',
    expected: 'Luego de un timeout configurable (ej. 5s), el widget muestra "No se pudo cargar el clima. Intente más tarde." con un ícono de error.',
    actual: 'El widget muestra un spinner de carga indefinidamente sin dar feedback al usuario.',
    reported_by: 'Tester 2',
    assigned_to: 'Dev Team'
  }
];

function seedIfEmpty() {
  const db = readDB();
  if (db.bugs.length > 0) return;
  const now = new Date().toISOString();
  SEED.forEach((b, i) => {
    db.bugs.push({ id: i + 1, ...b, created_at: now, updated_at: now });
  });
  db.nextId = SEED.length + 1;
  writeDB(db);
}

seedIfEmpty();

// ── API REST ──────────────────────────────────────────────────────────────────

app.get('/api/bugs', (req, res) => {
  const db = readDB();
  let bugs = db.bugs;

  if (req.query.status)   bugs = bugs.filter(b => b.status   === req.query.status);
  if (req.query.severity) bugs = bugs.filter(b => b.severity === req.query.severity);
  if (req.query.sprint)   bugs = bugs.filter(b => b.sprint   === req.query.sprint);

  res.json(bugs.sort((a, b) => b.id - a.id));
});

app.get('/api/bugs/:id', (req, res) => {
  const bug = readDB().bugs.find(b => b.id === +req.params.id);
  if (!bug) return res.status(404).json({ error: 'Bug no encontrado' });
  res.json(bug);
});

app.post('/api/bugs', (req, res) => {
  const { title, description, severity = 'MEDIUM', priority = 'MEDIUM',
          status = 'OPEN', sprint, module: mod, steps, expected, actual,
          reported_by = 'Tester', assigned_to = 'Dev Team' } = req.body;

  if (!title) return res.status(400).json({ error: 'El campo "title" es obligatorio' });

  const db  = readDB();
  const now = new Date().toISOString();
  const bug = { id: db.nextId++, title, description, severity, priority, status,
                sprint, module: mod, steps, expected, actual,
                reported_by, assigned_to, created_at: now, updated_at: now };
  db.bugs.push(bug);
  writeDB(db);
  res.status(201).json(bug);
});

app.patch('/api/bugs/:id', (req, res) => {
  const db  = readDB();
  const idx = db.bugs.findIndex(b => b.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Bug no encontrado' });

  db.bugs[idx] = { ...db.bugs[idx], ...req.body, id: db.bugs[idx].id,
                   updated_at: new Date().toISOString() };
  writeDB(db);
  res.json(db.bugs[idx]);
});

app.delete('/api/bugs/:id', (req, res) => {
  const db  = readDB();
  const idx = db.bugs.findIndex(b => b.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Bug no encontrado' });
  db.bugs.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'Bug eliminado' });
});

app.get('/api/stats', (req, res) => {
  const bugs = readDB().bugs;
  res.json({
    total:       bugs.length,
    open:        bugs.filter(b => b.status === 'OPEN').length,
    in_progress: bugs.filter(b => b.status === 'IN_PROGRESS').length,
    resolved:    bugs.filter(b => b.status === 'RESOLVED').length,
    closed:      bugs.filter(b => b.status === 'CLOSED').length,
    by_severity: {
      CRITICAL: bugs.filter(b => b.severity === 'CRITICAL').length,
      HIGH:     bugs.filter(b => b.severity === 'HIGH').length,
      MEDIUM:   bugs.filter(b => b.severity === 'MEDIUM').length,
      LOW:      bugs.filter(b => b.severity === 'LOW').length,
    }
  });
});

app.listen(PORT, () =>
  console.log(`Bug Tracker corriendo en http://localhost:${PORT}`)
);
