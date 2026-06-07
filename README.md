# TP Final – Taller de Calidad de Software

---

## Antes de empezar, instala esto (una sola vez)

**1. Docker Desktop**
Descargalo e instalalo desde: https://www.docker.com/products/docker-desktop/
Cuando termines de instalarlo, abri Docker Desktop y deja que cargue. Tiene que aparecer el ícono de la ballena en la barra de tareas.

**2. Una API key gratuita del clima**
Entra a https://www.weatherapi.com/signup.aspx, creá una cuenta gratis y copiá tu API key (es una cadena de letras y números que aparece en tu perfil).

**3. Git Bash** (si estás en Windows)
Descargalo desde: https://git-scm.com/downloads
Esto te da una terminal bash en Windows.

---

## Primer uso (hacer UNA sola vez)

Abri Git Bash, pegate estos comandos uno por uno y presioná Enter después de cada uno:

```bash
cd ~/OneDrive/Desktop/TP\ FINAL\ TALLER/TPFcalidad/tp-calidad-sistema
```

```bash
cp .env.example .env
```

Ahora abri el archivo `.env` que se creó (está en la carpeta `tp-calidad-sistema`) con el Bloc de Notas, buscá la línea que dice:

```
WEATHER_API_KEY=tu_api_key_aqui
```

Reemplazá `tu_api_key_aqui` por tu API key real y guardá el archivo.

---

## Configurar recursos según tu máquina (opcional, antes de hacer build)

Si tu computadora tiene más o menos de 4 núcleos y 8 GB de RAM, podés ajustar estas dos cosas:

### 1. Cambiar CPU y memoria del contenedor

Abrí el archivo `tp-calidad-sistema/docker-compose.yml` y buscá la sección `e2e-tests`:

```yaml
    deploy:
      resources:
        limits:
          cpus: '4'          # ← máximo de CPUs que puede usar
          memory: 8G         # ← máximo de RAM que puede usar
        reservations:
          cpus: '4'          # ← CPUs reservadas desde el inicio
          memory: 2G         # ← RAM reservada desde el inicio
    shm_size: '2gb'         # ← memoria compartida para Chromium
```

**Recomendaciones según tu hardware:**

| Tu máquina | cpus limit | memory limit | shm_size |
|-----------|-----------|-------------|----------|
| 2 núcleos, 4 GB RAM | 2 | 4G | 1gb |
| 4 núcleos, 8 GB RAM (default) | 4 | 8G | 2gb |
| 8 núcleos, 16 GB RAM | 8 | 16G | 4gb |

### 2. Cambiar número de workers (paralelismo)

Abrí `tp-calidad-sistema/playwright-tests/playwright.config.ts` y buscá esta línea:

```typescript
  workers: 4,  // ← número de tests que corren en paralelo
```

**Recomendaciones:**

| Tu máquina | workers | resultado |
|-----------|---------|-----------|
| 2 núcleos | 2 | ~2 tests simultáneos |
| 4 núcleos (default) | 4 | ~4 tests simultáneos |
| 8 núcleos | 6-8 | ~6-8 tests simultáneos |

**Nota:** Más workers = más rápido, pero más recursos. Si tu máquina se traba, baja el número.

---

## Construir las imagenes (hacer UNA sola vez, o si cambias el código)

Este paso descarga todo lo necesario. Puede tardar varios minutos la primera vez.

```bash
docker compose build --no-cache
```

Cuando termine vas a ver algo como `✔ Built` para cada imagen. Si no hubo errores, estas listo.

---

## Levantar los servicios

Este comando levanta el dashboard, el bug tracker y el sistema de reportes:

```bash
bash start.sh up
```

Cuando termina, abre tu navegador y entra a estas páginas:

| Que queres ver | URL |
|----------------|-----|
| Dashboard principal | http://localhost:8080 |
| Reportes de pruebas (Allure) | http://localhost:5050 |
| Bug Tracker | http://localhost:3000 |

---

## Ejecutar las pruebas

Este comando corre las 125 pruebas del frontend de OrangeHRM (25 casos núcleo de la Actividad 2 — Sprint N, N+1 y N+2 — más 100 casos de regresión adicionales sobre otros módulos) y las 20 pruebas de la API del clima:

```bash
bash start.sh test
```

Puede tardar varios minutos. Cuando termina, los resultados aparecen en:
- http://localhost:5050 (reporte completo con capturas de pantalla)
- http://localhost:8080/playwright-report/ (reporte HTML de las pruebas E2E)
- http://localhost:8080/api-report/ (reporte HTML de las pruebas de API)

---

## Generar los documentos de entrega

**Plan de Pruebas General** (ítem a de la consigna 7):

```bash
bash start.sh pdf
```

El archivo `Plan_de_Pruebas_General.pdf` aparece en la carpeta `tp-calidad-sistema/`.

---

**Casos de Prueba Frontend** (ítem b de la consigna 7):

```bash
bash start.sh casos
```

El archivo `Casos_de_Prueba_Frontend.pdf` aparece en la carpeta `tp-calidad-sistema/`.

---

**Casos de Prueba de la API del Clima** (ítem c de la consigna 7):

```bash
bash start.sh api
```

El archivo `Casos_de_Prueba_API_Clima.pdf` aparece en la carpeta `tp-calidad-sistema/`.

---

**Planilla Excel con todos los casos y resultados** (detalle caso por caso de las 125 pruebas E2E,
con una columna extra que describe cada fallo en lenguaje simple, lista para volcar a una tarjeta de Trello):

```bash
bash start.sh excel
```

El archivo `Casos_de_Prueba_OrangeHRM.xlsx` aparece en la carpeta `tp-calidad-sistema/`. Requiere haber
corrido `bash start.sh test` antes (lee los resultados desde `playwright-report/results.json`).

---

**Informe final consolidado en Word** (un solo documento .docx con el plan de pruebas, el diseño de
casos frontend y de API, los resultados de ejecución por sprint y el reporte de bugs — ítems a, b, c y d
de la consigna 7 en un solo archivo):

```bash
bash start.sh docx
```

El archivo `Informe_Final_Consigna7.docx` aparece en la carpeta `tp-calidad-sistema/`.

---

**Trabajo Final Integrador completo en Word** (un solo documento .docx que reúne TODO el trabajo:
las respuestas teóricas de las preguntas 1 a 8 del enunciado — Parte I — y la entrega práctica
de la pregunta 7 con sus ítems a, b, c y d — Parte II):

```bash
bash start.sh final
```

El archivo `TP_Final_Integrador.docx` aparece en la carpeta `tp-calidad-sistema/`. Es el entregable
único y consolidado para presentar el trabajo final.

---

**Fusionar los documentos HTML en un solo Word** (combina `plan-pruebas.html`,
`casos-de-prueba.html` y `api-casos-de-prueba.html` en un único archivo .docx y
**elimina los HTML originales** una vez generado correctamente):

```bash
bash start.sh merge-html
```

El archivo `Documentacion_HTML_Consolidada.docx` aparece en la carpeta `tp-calidad-sistema/`
y los tres `.html` de origen dejan de existir.

---

## Hacer todo de una vez

Si queres levantar los servicios y correr las pruebas en un solo paso:

```bash
bash start.sh all
```

---

## Apagar todo cuando termines

```bash
bash start.sh down
```

Esto detiene y elimina todos los contenedores. Los archivos generados (PDF, Excel, Word) quedan guardados en tu disco.

---

## Resumen de comandos

```bash
bash start.sh up      # levanta los servicios (dashboard, allure, bug tracker)
bash start.sh test    # corre todas las pruebas (125 E2E + 20 de API)
bash start.sh pdf     # genera Plan_de_Pruebas_General.pdf
bash start.sh casos   # genera Casos_de_Prueba_Frontend.pdf
bash start.sh api     # genera Casos_de_Prueba_API_Clima.pdf
bash start.sh excel   # genera Casos_de_Prueba_OrangeHRM.xlsx (requiere haber corrido test antes)
bash start.sh docx    # genera Informe_Final_Consigna7.docx (documento único con a, b, c y d)
bash start.sh final   # genera TP_Final_Integrador.docx (teoría preguntas 1-8 + práctica pregunta 7)
bash start.sh merge-html # fusiona los 3 HTML en Documentacion_HTML_Consolidada.docx y los borra
bash start.sh all     # up + test juntos
bash start.sh down    # apaga todo
```

---

## Que entrega cada comando

| Ítem consigna 7 | Como se genera | Donde queda |
|-----------------|----------------|-------------|
| a) Plan de pruebas | `bash start.sh pdf` | `tp-calidad-sistema/Plan_de_Pruebas_General.pdf` |
| b) Casos de prueba frontend + resultados | `bash start.sh casos` + `bash start.sh test` (+ `bash start.sh excel` para el detalle por caso) | `Casos_de_Prueba_Frontend.pdf` + `Casos_de_Prueba_OrangeHRM.xlsx` + http://localhost:5050 |
| c) Casos de prueba y colección Postman de la API del Clima | `bash start.sh api` (la colección ya está lista) | `Casos_de_Prueba_API_Clima.pdf` + `api-tests/collections/WeatherAPI.postman_collection.json` |
| d) Reporte de pruebas ejecutadas + reporte de bugs | `bash start.sh test` (resultados) + Bug Tracker (levantado automáticamente con `bash start.sh up`) | http://localhost:5050 (Allure), http://localhost:8080/api-report/ (Newman) y http://localhost:3000 (Bug Tracker) |
| Documento único con a + b + c + d | `bash start.sh docx` | `Informe_Final_Consigna7.docx` |
| Trabajo Final completo (teoría preguntas 1-8 + práctica pregunta 7) | `bash start.sh final` | `TP_Final_Integrador.docx` |
| Fusión de los 3 HTML (plan + casos frontend + casos API) en un solo Word | `bash start.sh merge-html` | `Documentacion_HTML_Consolidada.docx` (borra los `.html` de origen) |

---

## Si algo no funciona

**"Docker not found" o "docker compose: command not found"**
Docker Desktop no está abierto. Abrilo y esperá a que cargue la ballena.

**"SELF_SIGNED_CERT_IN_CHAIN" al hacer build**
Ya está resuelto en los Dockerfiles con `npm config set strict-ssl false`. Si aparece de nuevo, corré:
```bash
docker compose build --no-cache
```

**El PDF da error de Chromium / versión incorrecta**
Ya está resuelto: el Dockerfile usa `mcr.microsoft.com/playwright:v1.60.0-jammy`. Si aparece de nuevo, forzá el rebuild:
```bash
docker compose build --no-cache
bash start.sh pdf
```

**Las pruebas de la API del clima fallan con "self-signed certificate in certificate chain" o con error 401/2006 a pesar de tener la API key bien puesta**
Ya está resuelto en `api-tests/package.json`: el script de Newman corre con `--insecure` (evita el corte por
inspección HTTPS de redes corporativas/antivirus, igual que `strict-ssl false` en los Dockerfiles) y con
`--env-var "api_key=$WEATHER_API_KEY"` (inyecta la key real desde tu `.env` en tiempo de ejecución, en vez
de depender del placeholder `{{$processEnv WEATHER_API_KEY}}` del archivo de entorno de Postman, que no se
resuelve al usarse como valor estático de otra variable). Si volvés a ver este error, asegurate de:
```bash
docker compose build api-tests
docker compose run --rm api-tests
```

**"version is obsolete"** (warning amarillo al correr comandos)
Es solo un aviso, no es un error. El sistema funciona igual. Ya está corregido en el `docker-compose.yml`.

**Los servicios ya estaban levantados y querés reiniciarlos**
```bash
bash start.sh down
bash start.sh up
```

---

## Estructura de carpetas

```
TPFcalidad/
├── README.md                           <- este archivo
├── Actividades_Practicas/              <- enunciados y plantillas de la materia
├── Material_Clase/                     <- PDFs de las clases
└── tp-calidad-sistema/                 <- TODO el sistema ejecutable
    ├── docker-compose.yml              <- orquesta todos los servicios
    ├── .env.example                    <- plantilla de configuracion (copiar a .env)
    ├── .env                            <- tu configuracion real (con tu API key)
    ├── start.sh                        <- script principal de comandos
    ├── Documentacion_HTML_Consolidada.docx <- fusión de los 3 HTML (plan + casos frontend + casos API) en un solo Word
    ├── Plan_de_Pruebas_General.pdf     <- se genera con: bash start.sh pdf
    ├── Casos_de_Prueba_Frontend.pdf    <- se genera con: bash start.sh casos
    ├── Casos_de_Prueba_API_Clima.pdf   <- se genera con: bash start.sh api
    ├── Casos_de_Prueba_OrangeHRM.xlsx  <- se genera con: bash start.sh excel (detalle por caso + columna para Trello)
    ├── Informe_Final_Consigna7.docx    <- se genera con: bash start.sh docx (documento único a+b+c+d)
    ├── TP_Final_Integrador.docx        <- se genera con: bash start.sh final (teoría preguntas 1-8 + práctica pregunta 7)
    ├── playwright-tests/               <- 125 pruebas E2E (25 núcleo Sprint N/N+1/N+2 + 100 de regresión)
    ├── api-tests/                      <- 20 pruebas de API del Clima (Sprint N+3) + colección Postman/Newman
    ├── excel-generator/                <- genera Casos_de_Prueba_OrangeHRM.xlsx desde los resultados de Playwright
    ├── docx-generator/                 <- genera Informe_Final_Consigna7.docx
    ├── tp-final-generator/             <- genera TP_Final_Integrador.docx (teoría preguntas 1-8 + práctica pregunta 7)
    ├── html-merge-generator/           <- genera Documentacion_HTML_Consolidada.docx (fusiona y borra los HTML fuente)
    ├── bug-tracker/                    <- bug tracker web con 6 bugs pre-cargados
    ├── dashboard/                      <- pagina de inicio con links a todo
    └── nginx/                          <- servidor web de reportes
```
