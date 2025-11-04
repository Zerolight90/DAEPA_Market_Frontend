# ---- 1) deps ----
FROM node:20-alpine AS deps
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci || npm install


# ---- 2) builder ----
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_SHARP_SKIP_SMART_SUBINSTALL=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx next build --no-lint


# ---- 3) runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
