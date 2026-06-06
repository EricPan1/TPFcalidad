# TP Final Integrador – Taller de Control de Calidad de Software
### Licenciatura en Tecnologías Digitales / Licenciatura en Ciencias de Datos

---

## Índice

1. [Estructura del repositorio](#1-estructura-del-repositorio)
2. [Cómo levantar el sistema](#2-cómo-levantar-el-sistema)
3. [Consigna 7 – Ítem a: Plan de Pruebas General](#3-consigna-7--ítem-a-plan-de-pruebas-general)
4. [Consigna 7 – Ítem b: Casos de Prueba Frontend (Sprint N, N+1, N+2)](#4-consigna-7--ítem-b-casos-de-prueba-frontend)
5. [Consigna 7 – Ítem c: Casos de Prueba API del Clima (Sprint N+3)](#5-consigna-7--ítem-c-casos-de-prueba-api-del-clima)
6. [Consigna 7 – Ítem d: Reporte de Pruebas y Bugs](#6-consigna-7--ítem-d-reporte-de-pruebas-y-bugs)

---

## 1. Estructura del repositorio

```
TPFcalidad/
│
├── README.md                        ← Este documento (entrega consigna 7)
│
├── Actividades_Practicas/           ← Actividades 1, 2, 3 + plantillas de prueba
│   ├── ACTIVIDAD 1.txt
│   ├── Actividad 2.txt
│   ├── Actividad 3.txt
│   ├── MOLDE - Plantilla casos de prueba.xlsx
│   ├── Modelo_Plan_Pruebas_Scrum.docx
│   ├── Modelo_Plan_Pruebas_Software.docx
│   └── TP FINAL TALLER CALIDAD GRUPO X.pdf
│
├── Material_Clase/                  ← Material teórico de la materia
│
└── tp-calidad-sistema/              ← SISTEMA EJECUTABLE (consigna 7 práctica)
    ├── docker-compose.yml           ← Orquestación de todos los servicios
    ├── .env.example                 ← Variables de entorno (copiar a .env)
    ├── start.sh                     ← Script bash de inicio
    │
    ├── playwright-tests/            ← [ÍTEM b] Pruebas E2E Frontend (Playwright)
    │   └── tests/
    │       ├── sprint-n/            ← CP-001..015 (Employee List, Add Employee, Qualifications)
    │       ├── sprint-n1/           ← CP-016..020 (Edit Employee – Report to)
    │       └── sprint-n2/           ← CP-021..025 (Admin – Add User)
    │
    ├── api-tests/                   ← [ÍTEM c] Pruebas de API del Clima (Newman)
    │   └── collections/
    │       ├── WeatherAPI.postman_collection.json   ← Colección Postman (20 casos)
    │       └── WeatherAPI.postman_environment.json  ← Variables de entorno API
    │
    ├── bug-tracker/                 ← [ÍTEM d] Bug tracker con 6 bugs pre-cargados
    │
    └── dashboard/                   ← Portal de acceso a todos los servicios
```

---

## 2. Cómo levantar el sistema

### Prerequisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución
- API key gratuita de [WeatherAPI.com](https://www.weatherapi.com/signup.aspx) (plan free: 1M calls/mes)
- Terminal bash (Git Bash, WSL2 o similar)

### Pasos

```bash
# 1. Pararse en el directorio del sistema
cd tp-calidad-sistema

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env: reemplazar WEATHER_API_KEY con la key real

# 3. Construir imágenes y levantar servicios (allure, bug tracker, dashboard)
bash start.sh up

# 4. Ejecutar todas las pruebas (E2E + API)
bash start.sh test
```

### O directamente con docker compose

```bash
cd tp-calidad-sistema

# Levantar servicios
docker compose build
docker compose up -d allure bug-tracker report-server

# Correr pruebas E2E (Playwright – OrangeHRM)
docker compose run --rm e2e-tests

# Correr pruebas de API (Newman – Weather API)
docker compose run --rm api-tests

# Bajar todo
docker compose down -v
```

### Servicios disponibles

| URL | Qué es |
|-----|--------|
| http://localhost:8080 | Dashboard QA + reportes HTML |
| http://localhost:5050 | Allure Reports (E2E – Playwright) |
| http://localhost:3000 | Bug Tracker (ítem d) |
| http://localhost:8080/playwright-report/ | Reporte HTML detallado E2E |
| http://localhost:8080/api-report/ | Reporte HTML Newman (Weather API) |

---

## 3. Consigna 7 – Ítem a: Plan de Pruebas General

### 3.1 Propósito y alcance

El presente plan de pruebas cubre cuatro sprints de desarrollo de la aplicación de gestión de personas basada en OrangeHRM, que opera a través de microservicios. Su propósito es garantizar que cada incremento entregado cumpla los criterios de aceptación funcionales y no funcionales antes de ser integrado al ambiente productivo.

El alcance incluye:
- Pruebas funcionales de frontend (E2E automatizadas con Playwright)
- Pruebas de contrato de la API del clima (automatizadas con Newman/Postman)
- Pruebas exploratorias manuales complementarias
- Gestión y reporte de defectos (Bug Tracker)

Quedan fuera del alcance en esta fase: pruebas de performance (cubiertas en la respuesta de las consignas 4 y 5) y pruebas de seguridad.

---

### 3.2 Equipo de testing

| Rol | Responsabilidades |
|-----|-------------------|
| Tester Líder | Coordinación de estrategia, revisión de criterios de aceptación, reporte de estado al equipo |
| Tester Funcional 1 | Diseño y ejecución de casos funcionales E2E, mantenimiento de suite de regresión |
| Tester de Performance | Pruebas no funcionales (consignas 4/5), monitoreo de tiempos de respuesta en pruebas E2E |

---

### 3.3 Estrategia de pruebas

Se aplica un enfoque **shift-left**: el testing comienza en el día 1 del sprint, no al final.

**Pirámide de testing:**

```
         ┌──────────────────┐
         │    E2E / UI      │  ← Playwright (automático, ejecuta en CI)
         ├──────────────────┤
         │   API / Contrato │  ← Newman / Postman (automático, ejecuta en CI)
         ├──────────────────┤
         │  Exploratorio    │  ← Manual, primera mitad del sprint
         └──────────────────┘
```

**Tipos de prueba por sprint:**

| Tipo | Herramienta | Cuándo se ejecuta |
|------|-------------|-------------------|
| Smoke suite | Playwright (`@smoke`) | Cada merge a rama principal |
| Regresión full | Playwright (`@regression`) | Día 9 de cada sprint |
| Exploratoria | Manual | Días 3–6 (en paralelo al desarrollo) |
| Contract testing API | Newman | Ante cualquier cambio en el proveedor |
| Pruebas tempranas (mock) | Playwright contra mock | Días 1–4 (antes de tener backend) |

**Criterios de entrada por sprint:**
- Historias de usuario con criterios de aceptación definidos
- Ambiente de testing disponible (staging o demo)
- Datos de prueba cargados en el ambiente

**Criterios de salida por sprint:**
- 100% de casos de smoke ejecutados y pasando
- 0 bugs de severidad CRITICAL o HIGH abiertos
- Reporte de ejecución disponible en Allure
- Bugs encontrados registrados en Bug Tracker con severidad y pasos definidos

---

### 3.4 Calendario de ejecución por sprint

> El sprint tiene 10 días hábiles (2 semanas). Los días son relativos al inicio de cada sprint.

#### Sprint N – Employee List, Add Employee, My Info Qualifications

| Día(s) | Actividad | Responsable |
|--------|-----------|-------------|
| 1–2 | Refinamiento: revisión de historias, definición de criterios de aceptación, diseño de CP-001 a CP-015 | Todos los testers + AF |
| 3–4 | Pruebas exploratorias del frontend contra mocks del backend. Revisión de look & feel. | Tester Funcional 1 |
| 5–7 | Ejecución de CP-001 a CP-015 contra backend real (disponible desde día 5). Registro de bugs. | Tester Funcional 1 |
| 8 | Reejecutar casos fallidos. Verificar correcciones de bugs. Ejecutar smoke suite. | Tester Líder |
| 9 | Regresión completa automatizada (Playwright). Actualizar Bug Tracker con estado final. | Todos |
| 10 | Generación de reporte de sprint. Cierre. Demo. | Tester Líder |

**Entregables Sprint N:**
- Casos CP-001 a CP-015 automatizados en Playwright
- Reporte Allure con resultado de ejecución
- Bugs #1, #2, #3 en Bug Tracker

#### Sprint N+1 – My Info Qualifications (backend), Edit Employee Report-to

| Día(s) | Actividad | Responsable |
|--------|-----------|-------------|
| 1–2 | Diseño de CP-016 a CP-020. Revisión de criterios. Regresión de Sprint N (smoke). | Tester Líder |
| 3–5 | Pruebas exploratorias de Edit Employee – Report to. Ejecución de nuevos casos. | Tester Funcional 1 |
| 6–7 | Integración de backend de Qualifications. Reejecutar CP-011 a CP-015 contra real. | Tester Funcional 1 |
| 8–9 | Regresión acumulada (Sprint N + Sprint N+1). Registro de bugs. | Todos |
| 10 | Reporte y cierre. | Tester Líder |

**Entregables Sprint N+1:**
- Casos CP-016 a CP-020 automatizados
- Regresión acumulada pasando
- Bug #4 en Bug Tracker
- Reporte de sprint

#### Sprint N+2 – Admin Add User (Back + Front)

| Día(s) | Actividad | Responsable |
|--------|-----------|-------------|
| 1–2 | Diseño de CP-021 a CP-025. Revisión de permisos y roles del módulo Admin. | Tester Líder + AF |
| 3–6 | Ejecución de CP-021 a CP-025. Pruebas de seguridad básica (roles, acceso). | Tester Funcional 1 |
| 7–8 | Regresión acumulada Sprints N + N+1 + N+2. | Todos |
| 9 | Corrección y verificación de bugs. Smoke suite. | Todos |
| 10 | Reporte y cierre. | Tester Líder |

**Entregables Sprint N+2:**
- Casos CP-021 a CP-025 automatizados
- Regresión acumulada de los 3 sprints pasando
- Bug #5 en Bug Tracker
- Reporte de sprint

#### Sprint N+3 – Widget Clima (Front + Back)

| Día(s) | Actividad | Responsable |
|--------|-----------|-------------|
| 1–2 | Diseño de 20 casos API (CP-API-001..020). Revisión del contrato de WeatherAPI.com. | Tester Funcional 1 |
| 3–4 | Ejecución de colección Newman contra la API. Pruebas exploratorias del widget en el dashboard. | Tester Funcional 1 |
| 5–6 | Pruebas de integración: widget + API real. Casos de error (API caída, key inválida). | Tester Funcional 1 |
| 7–8 | Regresión acumulada de los 4 sprints + smoke del widget. | Todos |
| 9 | Verificación de bugs. Reporte final del proyecto. | Tester Líder |
| 10 | Demo final. Entrega del TP. | Todos |

**Entregables Sprint N+3:**
- Colección Postman con CP-API-001..020
- Reporte Newman (HTML)
- Bug #6 en Bug Tracker
- Reporte de ejecución final del proyecto

---

### 3.5 Gestión de defectos

Los bugs se registran en el **Bug Tracker** incluido en este sistema (http://localhost:3000).

| Severidad | Criterio | Bloquea el sprint |
|-----------|----------|-------------------|
| CRITICAL | El sistema falla completamente / pérdida de datos | Sí |
| HIGH | Funcionalidad principal no disponible | Sí |
| MEDIUM | Funcionalidad con workaround | No |
| LOW | Cosmético / mejora | No |

**Flujo de un bug:**

```
OPEN → IN_PROGRESS (developer toma el bug) → RESOLVED (developer cierra) → CLOSED (tester verifica)
```

---

## 4. Consigna 7 – Ítem b: Casos de Prueba Frontend

### 4.1 Cómo están implementados

Los casos de prueba se encuentran en `tp-calidad-sistema/playwright-tests/tests/` como archivos TypeScript ejecutables con Playwright. Se usan directamente para validar el frontend de OrangeHRM Demo (`https://opensource-demo.orangehrmlive.com`).

```
tests/
├── helpers/auth.ts                  ← Login helper (Admin / admin123) y utilidades
├── sprint-n/
│   ├── employee-list.spec.ts        ← CP-001 a CP-005
│   ├── add-employee.spec.ts         ← CP-006 a CP-010
│   └── my-info-qualifications.spec.ts ← CP-011 a CP-015
├── sprint-n1/
│   └── edit-employee-report-to.spec.ts ← CP-016 a CP-020
└── sprint-n2/
    └── admin-add-user.spec.ts       ← CP-021 a CP-025
```

### 4.2 Cómo correr los casos

```bash
# Todos los casos de los 3 sprints
docker compose run --rm e2e-tests

# Solo Sprint N
docker compose run --rm e2e-tests npx playwright test tests/sprint-n/

# Solo Sprint N+1
docker compose run --rm e2e-tests npx playwright test tests/sprint-n1/

# Solo Sprint N+2
docker compose run --rm e2e-tests npx playwright test tests/sprint-n2/

# Solo casos de smoke
docker compose run --rm e2e-tests npx playwright test --grep @smoke

# Solo casos de regresión
docker compose run --rm e2e-tests npx playwright test --grep @regression
```

Los resultados quedan en:
- **Allure** (http://localhost:5050): reporte interactivo con screenshots y trazas
- **HTML Report** (http://localhost:8080/playwright-report/): reporte estático detallado

### 4.3 Tabla completa de casos – Sprint N

**Módulo: PIM – Employee List** (`employee-list.spec.ts`)

| ID | Título | Tipo | Tags | Precondición | Paso a paso | Resultado esperado |
|----|--------|------|------|--------------|-------------|-------------------|
| CP-001 | La tabla de empleados carga correctamente | Funcional | SMOKE, REGRESSION | Sesión iniciada como Admin | 1. Ir a PIM > Employee List | Título "Employee List" visible, tabla con al menos 1 fila |
| CP-002 | Búsqueda por nombre filtra resultados | Funcional | REGRESSION | Sesión Admin, Employee List abierta | 1. Escribir nombre en campo Employee Name. 2. Clic en Search | Se muestran solo empleados que coinciden o mensaje "No Records Found" |
| CP-003 | Búsqueda por Employee ID muestra resultado específico | Funcional | REGRESSION | Sesión Admin, al menos un empleado cargado | 1. Copiar ID de primer empleado de la tabla. 2. Pegarlo en campo Employee Id. 3. Clic en Search | Se muestra exactamente 1 fila con ese ID |
| CP-004 | El botón Reset limpia los campos de búsqueda | Funcional | – | Sesión Admin, campo Employee Id con valor ingresado | 1. Ingresar "99999" en Employee Id. 2. Clic en Reset | El campo Employee Id queda vacío |
| CP-005 | La tabla contiene las columnas esperadas | Funcional | SMOKE | Sesión Admin, Employee List cargada | 1. Inspeccionar headers de la tabla | Headers contienen "First Name", "Last Name" e "Id" (o equivalentes) |

**Módulo: PIM – Add Employee** (`add-employee.spec.ts`)

| ID | Título | Tipo | Tags | Precondición | Paso a paso | Resultado esperado |
|----|--------|------|------|--------------|-------------|-------------------|
| CP-006 | El formulario de alta carga correctamente | Funcional | SMOKE | Sesión Admin | 1. Ir a PIM > Add Employee | Campos First Name, Last Name y botones Save / Cancel visibles |
| CP-007 | Crear empleado con datos mínimos obligatorios | Funcional | REGRESSION | Sesión Admin, formulario Add Employee abierto | 1. Completar First Name y Last Name con valores únicos (timestamp). 2. Clic en Save | Redirección al perfil del empleado creado. Sección "Personal Details" visible |
| CP-008 | Guardar sin datos muestra errores de validación | Funcional | REGRESSION | Sesión Admin, formulario Add Employee abierto | 1. Clic en Save sin completar ningún campo | Al menos 1 mensaje de error de validación visible |
| CP-009 | El campo Employee ID se pre-popula automáticamente | Funcional | – | Sesión Admin, formulario Add Employee abierto | 1. Verificar campo Employee ID al cargar el formulario | El campo tiene un valor numérico positivo pre-cargado |
| CP-010 | El botón Cancel regresa al listado sin crear empleado | Funcional | – | Sesión Admin, formulario Add Employee parcialmente completado | 1. Ingresar datos en First Name y Last Name. 2. Clic en Cancel | Redirección a Employee List. No se crea el empleado |

**Módulo: PIM – My Info Qualifications** (`my-info-qualifications.spec.ts`)

| ID | Título | Tipo | Tags | Precondición | Paso a paso | Resultado esperado |
|----|--------|------|------|--------------|-------------|-------------------|
| CP-011 | La pestaña Qualifications carga y muestra sus secciones | Funcional | SMOKE | Sesión Admin, perfil de un empleado abierto | 1. Ir al perfil del primer empleado. 2. Clic en pestaña Qualifications | Secciones "Work Experience" y "Education" visibles |
| CP-012 | Se puede agregar una entrada de Work Experience | Funcional | REGRESSION | Sesión Admin, pestaña Qualifications abierta | 1. Clic en Add en Work Experience. 2. Completar Company y Job Title. 3. Clic en Save | Entrada guardada. Toast de éxito o entrada aparece en la tabla |
| CP-013 | Se puede agregar una entrada de Education | Funcional | REGRESSION | Sesión Admin, pestaña Qualifications abierta | 1. Clic en Add en Education. 2. Seleccionar nivel educativo. 3. Clic en Save | El sistema acepta la entrada sin errores fatales |
| CP-014 | Guardar Work Experience vacía muestra validación | Funcional | – | Sesión Admin, formulario de Work Experience abierto | 1. Clic en Add en Work Experience. 2. Clic en Save sin completar campos | Al menos un mensaje de validación visible; no se navega fuera del formulario |
| CP-015 | Las secciones Skills y Languages están presentes | Funcional | – | Sesión Admin, pestaña Qualifications abierta | 1. Verificar presencia de texto "Skills" y "Languages" en la página | Ambas secciones visibles o texto correspondiente en el body |

### 4.4 Tabla completa de casos – Sprint N+1

**Módulo: PIM – Edit Employee – Report to** (`edit-employee-report-to.spec.ts`)

| ID | Título | Tipo | Tags | Precondición | Paso a paso | Resultado esperado |
|----|--------|------|------|--------------|-------------|-------------------|
| CP-016 | La pestaña Report-to carga correctamente | Funcional | SMOKE | Sesión Admin, perfil de un empleado abierto | 1. Navegar al perfil del primer empleado. 2. Clic en pestaña Report-to | Texto "Supervisors" o "Report-to" visible en la página |
| CP-017 | La sección Supervisors tiene botón Add visible | Funcional | REGRESSION | Sesión Admin, pestaña Report-to abierta | 1. Localizar sección Supervisors | Sección Supervisors visible con botón Add habilitado |
| CP-018 | Formulario de agregar supervisor muestra los campos requeridos | Funcional | REGRESSION | Sesión Admin, sección Supervisors con Add clickeado | 1. Clic en Add en Supervisors | Campo autocomplete de empleado visible + dropdown de método de reporte visible |
| CP-019 | Cancel en formulario de supervisor no guarda cambios | Funcional | – | Sesión Admin, formulario de supervisor abierto | 1. Abrir formulario. 2. Clic en Cancel | No se agrega ningún supervisor; cantidad de filas en la tabla no aumenta |
| CP-020 | La sección Subordinates está presente en la página | Funcional | SMOKE | Sesión Admin, pestaña Report-to abierta | 1. Verificar presencia de texto "Subordinates" | Texto "Subordinates" visible en la página |

### 4.5 Tabla completa de casos – Sprint N+2

**Módulo: Admin – User Management – Add** (`admin-add-user.spec.ts`)

| ID | Título | Tipo | Tags | Precondición | Paso a paso | Resultado esperado |
|----|--------|------|------|--------------|-------------|-------------------|
| CP-021 | El listado de usuarios carga correctamente | Funcional | SMOKE | Sesión Admin | 1. Ir a Admin > User Management > Users | Título "System Users" visible, tabla con al menos 1 fila |
| CP-022 | El formulario de alta contiene todos los campos requeridos | Funcional | REGRESSION | Sesión Admin, listado de Users abierto | 1. Clic en Add | Labels "User Role", "Employee Name", "Status", "Username", "Password" visibles |
| CP-023 | Guardar formulario vacío muestra errores de validación | Funcional | REGRESSION | Sesión Admin, formulario Add User abierto | 1. Clic en Save sin completar nada | Al menos 1 error visible; al menos uno contiene texto "Required" |
| CP-024 | Contraseñas no coincidentes muestran error de confirmación | Funcional | – | Sesión Admin, formulario Add User abierto | 1. Ingresar "Admin@12345" en Password. 2. Ingresar "DiferentePass!99" en Confirm. 3. Clic en Save | Error de validación mencionando "match" o "password" |
| CP-025 | Se puede filtrar el listado por User Role | Funcional | SMOKE | Sesión Admin, listado de Users abierto | 1. Seleccionar "Admin" en el dropdown User Role del form de búsqueda. 2. Clic en Search | Se muestra al menos 1 usuario con rol Admin |

---

## 5. Consigna 7 – Ítem c: Casos de Prueba API del Clima

### 5.1 Ubicación de la colección

La colección Postman (formato v2.1) está en:

```
tp-calidad-sistema/api-tests/collections/
├── WeatherAPI.postman_collection.json    ← Importar en Postman o ejecutar con Newman
└── WeatherAPI.postman_environment.json   ← Variables (base_url, api_key, ciudades, fechas)
```

### 5.2 Cómo importar en Postman

1. Abrir Postman → Import
2. Seleccionar `WeatherAPI.postman_collection.json`
3. Importar también `WeatherAPI.postman_environment.json` como entorno
4. Seleccionar el entorno "WeatherAPI - Entorno de Pruebas"
5. Reemplazar la variable `api_key` con tu key real de WeatherAPI.com

### 5.3 Cómo ejecutar con Newman (automático en Docker)

```bash
# Ejecuta los 20 casos y genera reporte HTML
docker compose run --rm api-tests

# Ver reporte en: http://localhost:8080/api-report/
```

### 5.4 Variables de entorno de la colección

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `base_url` | `https://api.weatherapi.com/v1` | URL base de la API |
| `api_key` | `(desde .env)` | API key de WeatherAPI.com |
| `city_valid` | `Buenos Aires` | Ciudad válida para happy paths |
| `city_invalid` | `XYZ_CIUDAD_INEXISTENTE_12345` | Ciudad ficticia para unhappy paths |
| `forecast_days` | `3` | Días de pronóstico para /forecast |
| `history_date` | `2024-01-15` | Fecha histórica válida |
| `future_date` | `2099-12-31` | Fecha futura (debe dar error) |

### 5.5 Tabla completa de casos – API del Clima

#### Endpoint: GET /current.json (Tiempo actual)

| ID | Escenario | Tipo | Input | Resultado esperado | Assertions |
|----|-----------|------|-------|--------------------|------------|
| CP-API-001 | Ciudad válida retorna tiempo actual | HAPPY / SMOKE | `q=Buenos Aires` | 200 + objeto `current` con `temp_c` y `condition` | Status 200, `location.name` es string, `current.temp_c` es number, `condition.text` no vacío, response time < 3000ms |
| CP-API-002 | Coordenadas GPS retornan datos | HAPPY | `q=-34.6037,-58.3816` | 200 + datos de Buenos Aires | Status 200, lat retornada ≈ -34.6, `current.last_updated` es fecha |
| CP-API-003 | Sin API key retorna 401 | UNHAPPY | sin parámetro `key` | 401 Unauthorized | Status 401, `error.code` es number, `error.message` no vacío |
| CP-API-004 | API key inválida retorna 403 | UNHAPPY | `key=INVALID_KEY_123ABC` | 403 Forbidden | Status 403, `error.code` in [2006, 2007, 2008] |
| CP-API-005 | Ciudad inexistente retorna 400 | UNHAPPY | `q=XYZ_CIUDAD_INEXISTENTE_12345` | 400 + error 1006 | Status 400, `error.code == 1006` |

#### Endpoint: GET /forecast.json (Pronóstico)

| ID | Escenario | Tipo | Input | Resultado esperado | Assertions |
|----|-----------|------|-------|--------------------|------------|
| CP-API-006 | Pronóstico de 3 días retorna estructura correcta | HAPPY / SMOKE | `q=Buenos Aires&days=3` | 200 + array de 3 días con temperatura, condición y 24 horas cada uno | Status 200, `forecast.forecastday.length == 3`, cada día tiene `date`, `day`, `hour` (24 items), `maxtemp_c` y `mintemp_c` |
| CP-API-007 | Pronóstico de 1 día retorna solo un día | HAPPY | `q=Buenos Aires&days=1` | 200 + array de 1 día con fecha futura o hoy | Status 200, `forecastday.length == 1`, fecha ≥ hoy |
| CP-API-008 | Sin parámetro days usa valor por defecto | UNHAPPY | sin `days` | 200 + al menos 1 día en forecastday | Status 200, `forecast.forecastday` es array con length > 0 |
| CP-API-009 | Ciudad inválida retorna 400 | UNHAPPY | `q=XYZ_INVALIDA&days=3` | 400 + error 1006 | Status 400, `error.code == 1006` |
| CP-API-010 | Sin API key retorna 401 | UNHAPPY | sin `key` | 401 Unauthorized | Status 401, `error` presente |

#### Endpoint: GET /history.json (Histórico)

| ID | Escenario | Tipo | Input | Resultado esperado | Assertions |
|----|-----------|------|-------|--------------------|------------|
| CP-API-011 | Fecha histórica válida retorna datos | HAPPY / SMOKE | `q=Buenos Aires&dt=2024-01-15` | 200 + 1 día con 24 registros hora a hora | Status 200, `forecastday[0].date == "2024-01-15"`, `hour.length == 24`, cada hora tiene `temp_c` y `temp_f` |
| CP-API-012 | Rango de fechas (dt + end_dt) retorna múltiples días | HAPPY | `dt=2024-01-15&end_dt=2024-01-17` | 200 + más de 1 día en forecastday | Status 200, `forecastday.length > 1` |
| CP-API-013 | Fecha futura retorna error 400 | UNHAPPY | `dt=2099-12-31` | 400 + error indicando fecha no disponible | Status 400, `error.code` y `error.message` presentes |
| CP-API-014 | Sin parámetro dt retorna error 400 | UNHAPPY | sin `dt` | 400 con mensaje de campo requerido | Status 400, `error.message` no vacío |
| CP-API-015 | Sin API key retorna 401 | UNHAPPY | sin `key` | 401 Unauthorized | Status 401, `error` presente |

#### Endpoint: GET /alerts.json (Alertas meteorológicas)

| ID | Escenario | Tipo | Input | Resultado esperado | Assertions |
|----|-----------|------|-------|--------------------|------------|
| CP-API-016 | Solicitud válida retorna estructura de alertas | HAPPY / SMOKE | `q=Buenos Aires` | 200 + `alerts.alert` como array (puede estar vacío) | Status 200, `location` presente, `alerts.alert` es array, response time < 3000ms |
| CP-API-017 | Ciudad de EE.UU. puede tener alertas activas | HAPPY | `q=Miami` | 200 + array de alertas | Status 200, si hay alertas: cada una tiene `headline`, `severity`, `effective`, `expires` (todos strings) |
| CP-API-018 | Ciudad inválida retorna 400 | UNHAPPY | `q=XYZ_INVALIDA` | 400 + error 1006 | Status 400, `error.code == 1006` |
| CP-API-019 | Sin API key retorna 401 | UNHAPPY | sin `key` | 401 Unauthorized | Status 401, `error` presente |
| CP-API-020 | Sin parámetro q retorna 400 | UNHAPPY | solo `key`, sin `q` | 400 con error de parámetro faltante | Status 400, `error.code` in [1003, 9999] |

---

## 6. Consigna 7 – Ítem d: Reporte de Pruebas y Bugs

### 6.1 Acceso al Bug Tracker

El Bug Tracker corre localmente en **http://localhost:3000** (luego de `bash start.sh up`).

Permite:
- Ver todos los bugs con filtros por sprint, severidad y estado
- Crear nuevos bugs con formulario completo (título, pasos, esperado vs actual, severidad)
- Cambiar el estado de un bug (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- Eliminar bugs

### 6.2 Reporte de bugs encontrados

Los siguientes bugs fueron identificados durante la ejecución de las pruebas exploratorias y automatizadas. Están pre-cargados en el Bug Tracker.

| ID | Sprint | Módulo | Título | Severidad | Estado |
|----|--------|--------|--------|-----------|--------|
| BUG-001 | Sprint N | PIM – Employee List | El botón Reset no limpia todos los filtros | LOW | OPEN |
| BUG-002 | Sprint N | PIM – Add Employee | Se permite crear empleados con Employee ID duplicado | HIGH | OPEN |
| BUG-003 | Sprint N | PIM – My Info Qualifications | Acepta fecha de fin anterior a la de inicio en Work Experience | MEDIUM | IN_PROGRESS |
| BUG-004 | Sprint N+1 | PIM – Edit Employee Report-to | Autocomplete de supervisor tarda más de 10s con base grande | HIGH | OPEN |
| BUG-005 | Sprint N+2 | Admin – User Management | Contraseña sin caracteres especiales es aceptada | MEDIUM | OPEN |
| BUG-006 | Sprint N+3 | Dashboard – Widget Clima | Widget queda en carga infinita si la API no responde | HIGH | OPEN |

### 6.3 Reporte de ejecución de pruebas

Luego de correr `docker compose run --rm e2e-tests`, el reporte detallado queda disponible en:

- **Allure** (http://localhost:5050): muestra resultado por caso, duración, capturas de pantalla en casos fallidos, y distribución de resultados
- **Playwright HTML** (http://localhost:8080/playwright-report/): vista simplificada con status por archivo de spec

Luego de correr `docker compose run --rm api-tests`:

- **Newman HTML** (http://localhost:8080/api-report/): resultado de los 20 casos de API, con request/response detallado y assertions

### 6.4 Criterios de interpretación de resultados

| Estado del caso | Significado | Acción |
|-----------------|-------------|--------|
| PASSED | El resultado obtenido coincide con el esperado | Ninguna |
| FAILED | El resultado no coincide o hubo error inesperado | Registrar bug en Bug Tracker |
| FLAKY | El caso pasa a veces y falla otras | Investigar estabilidad del ambiente |
| SKIPPED | El caso fue omitido (ej: datos no disponibles) | Revisar precondición |

---

## Notas técnicas

- La aplicación bajo prueba (OrangeHRM) es un **demo compartido público** (`https://opensource-demo.orangehrmlive.com`). Los datos pueden variar entre ejecuciones. Los casos están diseñados para ser resilientes a esa variabilidad.
- Para los casos que crean datos (CP-007 Add Employee), se usan nombres con timestamp para evitar colisiones y se incluye limpieza automática en el test.
- La colección de Postman puede importarse directamente en Postman Desktop para ejecutar los casos de forma manual e interactiva, además de la ejecución automática con Newman en Docker.
