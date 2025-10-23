FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./ ./
RUN npm run build

RUN mkdir -p /app/out && cp -r /app/.next/static /app/out/ && cp -r /app/public /app/out/
EXPOSE 3000
CMD ["npm", "start"]