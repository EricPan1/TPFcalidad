FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV ALLURE_RESULTS_DIR=/allure-results

CMD ["npx", "playwright", "test", "--reporter=list,allure-playwright,html"]
