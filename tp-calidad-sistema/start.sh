#!/usr/bin/env bash
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

header() {
  echo -e "\n${BOLD}============================================================${RESET}"
  echo -e "${BOLD}  Taller Calidad de Software – Sistema de Pruebas${RESET}"
  echo -e "${BOLD}  OrangeHRM (Sprints N / N+1 / N+2) + Weather API${RESET}"
  echo -e "${BOLD}============================================================${RESET}\n"
}

usage() {
  header
  echo -e "Uso:  ${CYAN}bash start.sh <comando>${RESET}\n"
  echo -e "Comandos disponibles:"
  echo -e "  ${GREEN}up${RESET}      Construye imágenes y levanta los servicios (allure, bug-tracker, dashboard)"
  echo -e "  ${GREEN}test${RESET}    Ejecuta pruebas E2E y de API  (requiere servicios levantados)"
  echo -e "  ${GREEN}all${RESET}     Equivale a 'up' + 'test' en un solo paso"
  echo -e "  ${GREEN}pdf${RESET}     Genera Plan_de_Pruebas_General.pdf en este directorio"
  echo -e "  ${GREEN}casos${RESET}   Genera Casos_de_Prueba_Frontend.pdf en este directorio"
  echo -e "  ${GREEN}api${RESET}     Genera Casos_de_Prueba_API_Clima.pdf en este directorio"
  echo -e "  ${GREEN}excel${RESET}   Genera Casos_de_Prueba_OrangeHRM.xlsx desde el último run de tests"
  echo -e "  ${GREEN}docx${RESET}    Genera Informe_Final_Consigna7.docx (plan, casos, resultados y bugs)"
  echo -e "  ${GREEN}final${RESET}   Genera TP_Final_Integrador.docx (respuestas teóricas preguntas 1-8 + entrega práctica pregunta 7)"
  echo -e "  ${GREEN}merge-html${RESET} Fusiona plan-pruebas.html + casos-de-prueba.html + api-casos-de-prueba.html"
  echo -e "             en Documentacion_HTML_Consolidada.docx y elimina los .html originales"
  echo -e "  ${GREEN}down${RESET}    Detiene y elimina todos los contenedores y volúmenes"
  echo -e "  ${GREEN}logs${RESET}    Muestra logs de todos los servicios en tiempo real\n"
  echo -e "Antes de correr por primera vez:"
  echo -e "  ${YELLOW}cp .env.example .env${RESET}  y editar WEATHER_API_KEY\n"
  echo -e "URLs disponibles luego de 'up':"
  echo -e "  Dashboard    ${CYAN}http://localhost:8080${RESET}"
  echo -e "  Allure       ${CYAN}http://localhost:5050${RESET}"
  echo -e "  Bug Tracker  ${CYAN}http://localhost:3000${RESET}\n"
}

cmd_up() {
  echo -e "${BOLD}[1/2]${RESET} Construyendo imágenes..."
  docker compose build

  echo -e "\n${BOLD}[2/2]${RESET} Levantando servicios..."
  docker compose up -d allure bug-tracker report-server

  echo -e "\n${GREEN}✔ Servicios activos:${RESET}"
  echo -e "   Dashboard    ${CYAN}http://localhost:8080${RESET}"
  echo -e "   Allure       ${CYAN}http://localhost:5050${RESET}"
  echo -e "   Bug Tracker  ${CYAN}http://localhost:3000${RESET}\n"
}

cmd_test() {
  echo -e "${BOLD}[1/2]${RESET} Ejecutando pruebas E2E (Playwright – OrangeHRM)..."
  echo -e "      Esto puede tardar varios minutos...\n"
  docker compose run --rm e2e-tests

  echo -e "\n${BOLD}[2/2]${RESET} Ejecutando pruebas de API (Newman – Weather API)..."
  docker compose run --rm api-tests

  echo -e "\n${GREEN}✔ Pruebas finalizadas. Ver resultados en:${RESET}"
  echo -e "   Allure   ${CYAN}http://localhost:5050${RESET}"
  echo -e "   Reporte  ${CYAN}http://localhost:8080${RESET}\n"
}

cmd_down() {
  docker compose down -v
  echo -e "${GREEN}✔ Todos los contenedores y volúmenes eliminados.${RESET}\n"
}

cmd_logs() {
  docker compose logs -f
}

# ── Main ──────────────────────────────────────────────────────────────────────

COMANDO="${1:-}"

cmd_pdf() {
  echo -e "${BOLD}Generando Plan_de_Pruebas_General.pdf...${RESET}"
  docker compose run --rm pdf-generator
  echo -e "\n${GREEN}✔ Listo: $(pwd)/Plan_de_Pruebas_General.pdf${RESET}\n"
}

cmd_casos() {
  echo -e "${BOLD}Generando Casos_de_Prueba_Frontend.pdf...${RESET}"
  docker compose run --rm casos-pdf-generator
  echo -e "\n${GREEN}✔ Listo: $(pwd)/Casos_de_Prueba_Frontend.pdf${RESET}\n"
}

cmd_api() {
  echo -e "${BOLD}Generando Casos_de_Prueba_API_Clima.pdf...${RESET}"
  docker compose run --rm api-casos-pdf-generator
  echo -e "\n${GREEN}✔ Listo: $(pwd)/Casos_de_Prueba_API_Clima.pdf${RESET}\n"
}

cmd_excel() {
  echo -e "${BOLD}Generando Casos_de_Prueba_OrangeHRM.xlsx...${RESET}"
  docker compose run --rm excel-generator
  echo -e "\n${GREEN}✔ Listo: $(pwd)/Casos_de_Prueba_OrangeHRM.xlsx${RESET}\n"
}

cmd_docx() {
  echo -e "${BOLD}Generando Informe_Final_Consigna7.docx...${RESET}"
  docker compose run --rm docx-generator
  echo -e "\n${GREEN}✔ Listo: $(pwd)/Informe_Final_Consigna7.docx${RESET}\n"
}

cmd_final() {
  echo -e "${BOLD}Generando TP_Final_Integrador.docx (respuestas teóricas + entrega práctica)...${RESET}"
  docker compose run --rm tp-final-generator
  echo -e "\n${GREEN}✔ Listo: $(pwd)/TP_Final_Integrador.docx${RESET}\n"
}

cmd_merge_html() {
  echo -e "${BOLD}Fusionando los HTML (plan, casos frontend y casos API) en un solo .docx...${RESET}"
  docker compose run --rm html-merge-generator
  echo -e "\n${GREEN}✔ Listo: $(pwd)/Documentacion_HTML_Consolidada.docx (los .html originales fueron eliminados)${RESET}\n"
}

case "$COMANDO" in
  up)    header; cmd_up ;;
  test)  header; cmd_test ;;
  all)   header; cmd_up; cmd_test ;;
  pdf)   header; cmd_pdf ;;
  casos) header; cmd_casos ;;
  api)   header; cmd_api ;;
  excel) header; cmd_excel ;;
  docx)  header; cmd_docx ;;
  final) header; cmd_final ;;
  merge-html) header; cmd_merge_html ;;
  down)  header; cmd_down ;;
  logs)  docker compose logs -f ;;
  *)     usage ;;
esac
