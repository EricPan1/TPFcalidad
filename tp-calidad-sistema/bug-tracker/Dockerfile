FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set strict-ssl false && npm install --omit=dev
COPY . .
RUN mkdir -p data
EXPOSE 3000
CMD ["node", "server.js"]
