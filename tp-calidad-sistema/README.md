# Sistema de Pruebas – TP Final Taller Calidad de Software

Consigna 7: pruebas automatizadas para OrangeHRM (Sprints N, N+1, N+2) y la API del Clima (Sprint N+3).
Todo corre con Docker Compose, sin instalar nada local salvo Docker Desktop.

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Una API key gratuita de [WeatherAPI.com](https://www.weatherapi.com/signup.aspx)

---

## Configuración inicial (una sola vez)

1. Copiar el archivo de entorno y completar tu API key:

   ```
   copy .env.example .env
   ```

2. Editar `.env` y reemplazar `tu_api_key_aqui` con la key real de WeatherAPI.com.

---

## Levantar los servicios

```bat
start.bat up
```

Esto construye las imágenes y levanta:

| Servicio        | URL                         |
|-----------------|-----------------------------|
| Dashboard QA    | http://localhost:8080        |
| Allure Reports  | http://localhost:5050        |
| Bug Tracker     | http://localhost:3000        |

---

## Ejecutar las pruebas

```bat
start.bat test
```

Esto corre en orden:
1. **Playwright** – 25 casos E2E contra https://opensource-demo.orangehrmlive.com
2. **Newman** – 20 casos de API contra https://api.weatherapi.com/v1

Los resultados quedan disponibles en:
- Allure (E2E): http://localhost:5050
- Playwright HTML: http://localhost:8080/playwright-report/
- Newman HTML: http://localhost:8080/api-report/

---

## Todo de una vez

```bat
start.bat all
```

Equivale a `up` + `test`.

---

## Estructura del proyecto

```
tp-calidad-sistema/
├── docker-compose.yml
├── .env.example
├── start.bat
│
├── playwright-tests/           # Pruebas E2E con Playwright + TypeScript
│   ├── Dockerfile
│   ├── playwright.config.ts
│   └── tests/
│       ├── helpers/auth.ts
│       ├── sprint-n/
│       │   ├── employee-list.spec.ts          (CP-001 a CP-005)
│       │   ├── add-employee.spec.ts           (CP-006 a CP-010)
│       │   └── my-info-qualifications.spec.ts (CP-011 a CP-015)
│       ├── sprint-n1/
│       │   └── edit-employee-report-to.spec.ts (CP-016 a CP-020)
│       └── sprint-n2/
│           └── admin-add-user.spec.ts          (CP-021 a CP-025)
│
├── api-tests/                  # Pruebas de API con Newman + colección Postman
│   ├── Dockerfile
│   └── collections/
│       ├── WeatherAPI.postman_collection.json  (20 casos: CP-API-001..020)
│       └── WeatherAPI.postman_environment.json
│
├── bug-tracker/                # Bug tracker liviano (Node.js + Express + JSON)
│   ├── Dockerfile
│   ├── server.js
│   └── public/index.html
│
├── dashboard/                  # Dashboard HTML estático
│   └── index.html
│
└── nginx/
    └── nginx.conf              # Sirve dashboard + reportes en puerto 8080
```

---

## Casos de prueba incluidos

### Sprint N – OrangeHRM (Admin)

| ID      | Funcionalidad          | Tipo          | Tags             |
|---------|------------------------|---------------|------------------|
| CP-001  | Employee List carga    | Funcional     | SMOKE, REGRESSION|
| CP-002  | Búsqueda por nombre    | Funcional     | REGRESSION       |
| CP-003  | Búsqueda por ID        | Funcional     | REGRESSION       |
| CP-004  | Reset limpia filtros   | Funcional     | –                |
| CP-005  | Columnas correctas     | Funcional     | SMOKE            |
| CP-006  | Form Add Employee carga| Funcional     | SMOKE            |
| CP-007  | Crear empleado mínimo  | Funcional     | REGRESSION       |
| CP-008  | Validación form vacío  | Funcional     | REGRESSION       |
| CP-009  | Employee ID auto       | Funcional     | –                |
| CP-010  | Cancel regresa al list | Funcional     | –                |
| CP-011  | Qualifications carga   | Funcional     | SMOKE            |
| CP-012  | Agregar Work Experience| Funcional     | REGRESSION       |
| CP-013  | Agregar Education      | Funcional     | REGRESSION       |
| CP-014  | Validación form vacío  | Funcional     | –                |
| CP-015  | Skills y Languages     | Funcional     | –                |

### Sprint N+1 – Edit Employee Report-to

| ID      | Funcionalidad          | Tipo      | Tags             |
|---------|------------------------|-----------|------------------|
| CP-016  | Report-to carga        | Funcional | SMOKE            |
| CP-017  | Sección Supervisors    | Funcional | REGRESSION       |
| CP-018  | Form agregar supervisor| Funcional | REGRESSION       |
| CP-019  | Cancel sin guardar     | Funcional | –                |
| CP-020  | Sección Subordinates   | Funcional | SMOKE            |

### Sprint N+2 – Admin Add User

| ID      | Funcionalidad          | Tipo      | Tags             |
|---------|------------------------|-----------|------------------|
| CP-021  | Users list carga       | Funcional | SMOKE            |
| CP-022  | Form alta usuario      | Funcional | REGRESSION       |
| CP-023  | Validación form vacío  | Funcional | REGRESSION       |
| CP-024  | Contraseñas distintas  | Funcional | –                |
| CP-025  | Filtro por User Role   | Funcional | SMOKE            |

### Sprint N+3 – Weather API

| ID          | Endpoint         | Escenario            | Tipo      |
|-------------|------------------|----------------------|-----------|
| CP-API-001  | /current.json    | Ciudad válida        | HAPPY     |
| CP-API-002  | /current.json    | Coordenadas GPS      | HAPPY     |
| CP-API-003  | /current.json    | Sin API key          | UNHAPPY   |
| CP-API-004  | /current.json    | API key inválida     | UNHAPPY   |
| CP-API-005  | /current.json    | Ciudad inexistente   | UNHAPPY   |
| CP-API-006  | /forecast.json   | 3 días pronóstico    | HAPPY     |
| CP-API-007  | /forecast.json   | 1 día                | HAPPY     |
| CP-API-008  | /forecast.json   | Sin parámetro days   | UNHAPPY   |
| CP-API-009  | /forecast.json   | Ciudad inválida      | UNHAPPY   |
| CP-API-010  | /forecast.json   | Sin API key          | UNHAPPY   |
| CP-API-011  | /history.json    | Fecha histórica      | HAPPY     |
| CP-API-012  | /history.json    | Rango de fechas      | HAPPY     |
| CP-API-013  | /history.json    | Fecha futura         | UNHAPPY   |
| CP-API-014  | /history.json    | Sin parámetro dt     | UNHAPPY   |
| CP-API-015  | /history.json    | Sin API key          | UNHAPPY   |
| CP-API-016  | /alerts.json     | Solicitud válida     | HAPPY     |
| CP-API-017  | /alerts.json     | Ciudad EE.UU.        | HAPPY     |
| CP-API-018  | /alerts.json     | Ciudad inválida      | UNHAPPY   |
| CP-API-019  | /alerts.json     | Sin API key          | UNHAPPY   |
| CP-API-020  | /alerts.json     | Sin parámetro q      | UNHAPPY   |

---

## Bugs pre-cargados en el Bug Tracker

El bug tracker arranca con 6 bugs reportados durante las pruebas exploratorias:

| ID | Módulo                   | Severidad | Estado      |
|----|--------------------------|-----------|-------------|
| 1  | Employee List            | LOW       | OPEN        |
| 2  | Add Employee             | HIGH      | OPEN        |
| 3  | My Info – Qualifications | MEDIUM    | IN_PROGRESS |
| 4  | Edit Employee – Report to| HIGH      | OPEN        |
| 5  | Admin – Add User         | MEDIUM    | OPEN        |
| 6  | Widget Clima             | HIGH      | OPEN        |

---

## Detener todos los servicios

```bat
start.bat down
```
