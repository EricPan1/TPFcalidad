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

Este comando corre las 25 pruebas del frontend de OrangeHRM y las 20 pruebas de la API del clima:

```bash
bash start.sh test
```

Puede tardar varios minutos. Cuando termina, los resultados aparecen en:
- http://localhost:5050 (reporte completo con capturas de pantalla)
- http://localhost:8080/playwright-report/ (reporte HTML de las pruebas E2E)
- http://localhost:8080/api-report/ (reporte HTML de las pruebas de API)

---

## Generar los PDFs de entrega

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

Esto detiene y elimina todos los contenedores. Los PDFs generados quedan guardados en tu disco.

---

## Resumen de comandos

```bash
bash start.sh up      # levanta los servicios (dashboard, allure, bug tracker)
bash start.sh test    # corre todas las pruebas
bash start.sh pdf     # genera Plan_de_Pruebas_General.pdf
bash start.sh casos   # genera Casos_de_Prueba_Frontend.pdf
bash start.sh all     # up + test juntos
bash start.sh down    # apaga todo
```

---

## Que entrega cada comando

| Ítem consigna 7 | Como se genera | Donde queda |
|-----------------|----------------|-------------|
| a) Plan de pruebas | `bash start.sh pdf` | `tp-calidad-sistema/Plan_de_Pruebas_General.pdf` |
| b) Casos de prueba frontend + resultados | `bash start.sh casos` + `bash start.sh test` | `Casos_de_Prueba_Frontend.pdf` + http://localhost:5050 |
| c) Colección Postman API del Clima | ya está lista | `api-tests/collections/WeatherAPI.postman_collection.json` |
| d) Reporte de bugs | levantado automáticamente | http://localhost:3000 |

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
    ├── plan-pruebas.html               <- fuente del Plan de Pruebas (HTML)
    ├── casos-de-prueba.html            <- fuente de los Casos de Prueba (HTML)
    ├── Plan_de_Pruebas_General.pdf     <- se genera con: bash start.sh pdf
    ├── Casos_de_Prueba_Frontend.pdf    <- se genera con: bash start.sh casos
    ├── playwright-tests/               <- 25 pruebas E2E (Sprint N, N+1, N+2)
    ├── api-tests/                      <- 20 pruebas de API del Clima (Sprint N+3)
    ├── bug-tracker/                    <- bug tracker web con 6 bugs pre-cargados
    ├── dashboard/                      <- pagina de inicio con links a todo
    └── nginx/                          <- servidor web de reportes
```
