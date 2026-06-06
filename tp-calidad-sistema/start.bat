@echo off
setlocal EnableDelayedExpansion

echo.
echo ============================================================
echo   Taller Calidad de Software - Sistema de Pruebas
echo   OrangeHRM (Sprints N / N+1 / N+2) + Weather API
echo ============================================================
echo.

if "%1"=="" goto help
if /I "%1"=="up"   goto up
if /I "%1"=="test" goto test
if /I "%1"=="all"  goto all
if /I "%1"=="down" goto down
if /I "%1"=="logs" goto logs

:help
echo Uso:  start.bat [comando]
echo.
echo  up     Levanta los servicios (allure, bug-tracker, reporte)
echo  test   Ejecuta pruebas E2E y API  (requiere: start.bat up)
echo  all    Levanta servicios y ejecuta todas las pruebas
echo  down   Detiene y elimina todos los contenedores
echo  logs   Muestra los logs en tiempo real
echo.
echo Antes de ejecutar, copia .env.example a .env y
echo completa tu WEATHER_API_KEY.
echo.
echo URLs disponibles luego de "up":
echo   Dashboard    http://localhost:8080
echo   Allure       http://localhost:5050
echo   Bug Tracker  http://localhost:3000
echo.
goto end

:up
echo [1/2] Construyendo imagenes...
docker-compose build --quiet
if errorlevel 1 (echo ERROR al construir imagenes & goto end)
echo.
echo [2/2] Levantando servicios...
docker-compose up -d allure bug-tracker report-server
if errorlevel 1 (echo ERROR al levantar servicios & goto end)
echo.
echo ============================================================
echo   Servicios activos:
echo     Dashboard    http://localhost:8080
echo     Allure       http://localhost:5050
echo     Bug Tracker  http://localhost:3000
echo ============================================================
goto end

:test
echo [1/2] Ejecutando pruebas E2E (Playwright - OrangeHRM)...
echo       Esto puede tardar varios minutos...
docker-compose --profile test run --rm e2e-tests
echo.
echo [2/2] Ejecutando pruebas de API (Newman - Weather API)...
docker-compose --profile test run --rm api-tests
echo.
echo Pruebas finalizadas. Ver resultados en:
echo   Allure   http://localhost:5050
echo   Reporte  http://localhost:8080
goto end

:all
call "%~f0" up
if errorlevel 1 goto end
timeout /t 3 /nobreak >nul
call "%~f0" test
goto end

:down
docker-compose --profile test down -v
echo Todos los contenedores y volumes eliminados.
goto end

:logs
docker-compose logs -f
goto end

:end
endlocal
