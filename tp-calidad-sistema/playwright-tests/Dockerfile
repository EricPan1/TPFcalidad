FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm config set strict-ssl false && npm install

COPY . .

ENV ALLURE_RESULTS_DIR=/allure-results

CMD ["npx", "playwright", "test"]
