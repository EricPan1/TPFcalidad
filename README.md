# TP Final Integrador – Taller de Control de Calidad de Software
### Licenciatura en Tecnologías Digitales / Licenciatura en Ciencias de Datos

---

## Estructura del repositorio

```
TPFcalidad/
├── README.md                         ← Este archivo
├── Actividades_Practicas/            ← Enunciados, plantillas y PDF del grupo
├── Material_Clase/                   ← Material teórico de la materia
└── tp-calidad-sistema/               ← Sistema ejecutable (consigna 7)
    ├── docker-compose.yml
    ├── .env.example
    ├── start.sh
    ├── plan-pruebas.html             ← Fuente del Plan de Pruebas
    ├── playwright-tests/             ← Pruebas E2E frontend (Sprint N, N+1, N+2)
    ├── api-tests/                    ← Pruebas API del Clima (Sprint N+3)
    ├── bug-tracker/                  ← Bug tracker con bugs pre-cargados
    ├── dashboard/                    ← Portal de acceso a todos los servicios
    └── nginx/                        ← Configuración del servidor de reportes
```

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- API key gratuita de [WeatherAPI.com](https://www.weatherapi.com/signup.aspx)
- Terminal bash (Git Bash o WSL en Windows)

---

## Levantar todo con Docker

```bash
cd tp-calidad-sistema

# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env y reemplazar WEATHER_API_KEY con la key real

# 2. Construir imágenes y levantar servicios
bash start.sh up

# 3. Ejecutar las pruebas (E2E + API)
bash start.sh test

# 4. Generar el Plan de Pruebas en PDF
bash start.sh pdf

# Bajar todo
bash start.sh down
```

### O con docker compose directamente

```bash
# Levantar servicios
docker compose build
docker compose up -d allure bug-tracker report-server

# Correr pruebas E2E (Playwright – OrangeHRM)
docker compose run --rm e2e-tests

# Correr pruebas de API (Newman – WeatherAPI.com)
docker compose run --rm api-tests

# Generar PDF del Plan de Pruebas
docker compose run --rm pdf-generator

# Bajar todo
docker compose down -v
```

---

## Servicios disponibles

| URL | Qué es |
|-----|--------|
| http://localhost:8080 | Dashboard QA + reportes HTML |
| http://localhost:5050 | Allure Reports (resultados E2E) |
| http://localhost:3000 | Bug Tracker |
| http://localhost:8080/playwright-report/ | Reporte HTML Playwright |
| http://localhost:8080/api-report/ | Reporte HTML Newman |

---

## Entregables de la consigna 7

| Ítem | Qué es | Dónde está |
|------|--------|------------|
| a) Plan de pruebas | Documento completo (12 secciones, calendario día a día) | `plan-pruebas.html` → `Plan_de_Pruebas_General.pdf` |
| b) Casos de prueba frontend | 25 casos E2E automatizados (Sprint N, N+1, N+2) | `playwright-tests/tests/` |
| c) Casos de prueba API | 20 casos Newman (4 endpoints × 5 escenarios) | `api-tests/collections/WeatherAPI.postman_collection.json` |
| d) Reporte de bugs | 6 bugs pre-cargados con pasos y severidad | http://localhost:3000 |
