# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm run build
COPY . .

RUN mkdir -p /app/out && cp -r /app/.next/static /app/out/ && cp -r /app/public /app/out/
EXPOSE 3000

CMD ["npm", "start"]
