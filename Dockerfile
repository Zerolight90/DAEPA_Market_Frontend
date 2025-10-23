# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
# CI 환경엔 npm ci가 안전하지만, lock이 불완전하면 npm install 사용
RUN npm ci || npm install
COPY . .
RUN npm run build

# --- Run stage (SSR) ---
FROM node:20-alpine
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
# Next.js SSR (next start)
CMD ["npm", "run", "start"]
