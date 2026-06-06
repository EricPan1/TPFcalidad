# Sistema de Pruebas – TP Final Taller Calidad de Software

Consigna 7: pruebas automatizadas para OrangeHRM (Sprints N, N+1, N+2) y la API del Clima (Sprint N+3).
Todo corre con Docker Compose. No se instala nada local salvo Docker Desktop.

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Una API key gratuita de [WeatherAPI.com](https://www.weatherapi.com/signup.aspx)
- Bash (Git Bash, WSL o cualquier terminal con bash en Windows)

---

## Configuración inicial (una sola vez)

```bash
cp .env.example .env
# Editar .env y reemplazar WEATHER_API_KEY con la key real de WeatherAPI.com
```

---

## Uso con el script `start.sh`

```bash
bash start.sh up      # Construye imágenes y levanta servicios
bash start.sh test    # Ejecuta todas las pruebas
bash start.sh all     # up + test en un solo paso
bash start.sh down    # Detiene y elimina contenedores y volúmenes
bash start.sh logs    # Muestra logs en tiempo real
```

---

## Uso con docker compose directamente

### Levantar los servicios

```bash
docker compose build
docker compose up -d allure bug-tracker report-server
```

### Ejecutar las pruebas E2E (Playwright)

```bash
docker compose run --rm e2e-tests
```

### Ejecutar las pruebas de API (Newman / Weather API)

```bash
docker compose run --rm api-tests
```

### Ver logs de un servicio

```bash
docker compose logs -f allure
docker compose logs -f bug-tracker
```

### Detener todo

```bash
docker compose down -v
```

---

## Servicios disponibles luego de `up`

| URL                                      | Servicio                        |
|------------------------------------------|---------------------------------|
| http://localhost:8080                    | Dashboard QA + reportes HTML    |
| http://localhost:5050                    | Allure Reports (resultados E2E) |
| http://localhost:3000                    | Bug Tracker                     |
| http://localhost:8080/playwright-report/ | Reporte HTML Playwright         |
| http://localhost:8080/api-report/        | Reporte HTML Newman             |

---

## Estructura del proyecto

```
tp-calidad-sistema/
├── docker-compose.yml
├── .env.example
├── start.sh                            ← script bash principal
│
├── playwright-tests/                   ← Pruebas E2E (Playwright + TypeScript)
│   ├── Dockerfile
│   ├── playwright.config.ts
│   └── tests/
│       ├── helpers/auth.ts
│       ├── sprint-n/
│       │   ├── employee-list.spec.ts           (CP-001 a CP-005)
│       │   ├── add-employee.spec.ts            (CP-006 a CP-010)
│       │   └── my-info-qualifications.spec.ts  (CP-011 a CP-015)
│       ├── sprint-n1/
│       │   └── edit-employee-report-to.spec.ts (CP-016 a CP-020)
│       └── sprint-n2/
│           └── admin-add-user.spec.ts          (CP-021 a CP-025)
│
├── api-tests/                          ← Pruebas de API (Newman + Postman Collection)
│   ├── Dockerfile
│   └── collections/
│       ├── WeatherAPI.postman_collection.json  (20 casos: CP-API-001..020)
│       └── WeatherAPI.postman_environment.json
│
├── bug-tracker/                        ← Bug tracker (Node.js + Express + JSON)
│   ├── Dockerfile
│   ├── server.js
│   └── public/index.html
│
├── dashboard/                          ← Dashboard HTML estático
│   └── index.html
│
└── nginx/
    └── nginx.conf                      ← Sirve dashboard + reportes en puerto 8080
```

---

## Casos de prueba incluidos

### Sprint N – OrangeHRM (Admin)

| ID      | Funcionalidad              | Tags              |
|---------|----------------------------|-------------------|
| CP-001  | Employee List carga        | SMOKE, REGRESSION |
| CP-002  | Búsqueda por nombre        | REGRESSION        |
| CP-003  | Búsqueda por Employee ID   | REGRESSION        |
| CP-004  | Reset limpia filtros       | –                 |
| CP-005  | Columnas correctas         | SMOKE             |
| CP-006  | Formulario Add carga       | SMOKE             |
| CP-007  | Crear empleado (mínimo)    | REGRESSION        |
| CP-008  | Validación form vacío      | REGRESSION        |
| CP-009  | Employee ID auto-poblado   | –                 |
| CP-010  | Cancel regresa al listado  | –                 |
| CP-011  | Qualifications carga       | SMOKE             |
| CP-012  | Agregar Work Experience    | REGRESSION        |
| CP-013  | Agregar Education          | REGRESSION        |
| CP-014  | Validación Work Exp vacía  | –                 |
| CP-015  | Skills y Languages visibles| –                 |

### Sprint N+1 – Edit Employee Report-to

| ID      | Funcionalidad                  | Tags       |
|---------|--------------------------------|------------|
| CP-016  | Pestaña Report-to carga        | SMOKE      |
| CP-017  | Sección Supervisors con Add    | REGRESSION |
| CP-018  | Formulario agregar supervisor  | REGRESSION |
| CP-019  | Cancel no guarda               | –          |
| CP-020  | Sección Subordinates visible   | SMOKE      |

### Sprint N+2 – Admin Add User

| ID      | Funcionalidad                  | Tags       |
|---------|--------------------------------|------------|
| CP-021  | Users list carga               | SMOKE      |
| CP-022  | Formulario Add User completo   | REGRESSION |
| CP-023  | Validación form vacío          | REGRESSION |
| CP-024  | Contraseñas no coinciden       | –          |
| CP-025  | Filtro por User Role           | SMOKE      |

### Sprint N+3 – Weather API (4 endpoints × 5 casos)

| ID          | Endpoint       | Escenario              |
|-------------|----------------|------------------------|
| CP-API-001  | /current.json  | Ciudad válida (HAPPY)  |
| CP-API-002  | /current.json  | Coordenadas GPS        |
| CP-API-003  | /current.json  | Sin API key            |
| CP-API-004  | /current.json  | API key inválida       |
| CP-API-005  | /current.json  | Ciudad inexistente     |
| CP-API-006  | /forecast.json | 3 días (HAPPY)         |
| CP-API-007  | /forecast.json | 1 día                  |
| CP-API-008  | /forecast.json | Sin parámetro days     |
| CP-API-009  | /forecast.json | Ciudad inválida        |
| CP-API-010  | /forecast.json | Sin API key            |
| CP-API-011  | /history.json  | Fecha histórica válida |
| CP-API-012  | /history.json  | Rango de fechas        |
| CP-API-013  | /history.json  | Fecha futura           |
| CP-API-014  | /history.json  | Sin parámetro dt       |
| CP-API-015  | /history.json  | Sin API key            |
| CP-API-016  | /alerts.json   | Solicitud válida       |
| CP-API-017  | /alerts.json   | Ciudad EE.UU.          |
| CP-API-018  | /alerts.json   | Ciudad inválida        |
| CP-API-019  | /alerts.json   | Sin API key            |
| CP-API-020  | /alerts.json   | Sin parámetro q        |

---

## Bugs pre-cargados en el Bug Tracker

| ID | Módulo                    | Severidad | Estado      |
|----|---------------------------|-----------|-------------|
| 1  | Employee List             | LOW       | OPEN        |
| 2  | Add Employee              | HIGH      | OPEN        |
| 3  | My Info – Qualifications  | MEDIUM    | IN_PROGRESS |
| 4  | Edit Employee – Report to | HIGH      | OPEN        |
| 5  | Admin – Add User          | MEDIUM    | OPEN        |
| 6  | Widget Clima              | HIGH      | OPEN        |
