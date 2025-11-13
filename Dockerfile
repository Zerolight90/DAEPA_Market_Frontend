# ---- 1) builder + deps ----
FROM node:20-alpine AS builder
WORKDIR /app

# 공통 환경
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_SHARP_SKIP_SMART_SUBINSTALL=1 \
    PORT=3000

# Next 빌드에 필요한 패키지
RUN apk add --no-cache libc6-compat

# 빌드 타임 env (docker-compose에서 args로 주입)
ARG NEXT_PUBLIC_API_BASE
ARG NEXT_PUBLIC_API_ORIGIN
ARG NEXT_PUBLIC_WS_BASE
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TOSS_CLIENT_KEY
ARG TOSS_SECRET_KEY

ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NEXT_PUBLIC_API_ORIGIN=${NEXT_PUBLIC_API_ORIGIN}
ENV NEXT_PUBLIC_WS_BASE=${NEXT_PUBLIC_WS_BASE}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_TOSS_CLIENT_KEY=${NEXT_PUBLIC_TOSS_CLIENT_KEY}
ENV TOSS_SECRET_KEY=${TOSS_SECRET_KEY}

# 의존성 먼저 복사 → npm ci 레이어 캐시 최적화
COPY package*.json ./
RUN npm ci || npm install

# 그 다음 나머지 소스 복사
COPY . .

# Next 빌드
RUN npx next build --no-lint


# ---- 2) runner (실행용) ----
FROM builder AS runner
WORKDIR /app

# 실행용 환경변수 (이미 builder에서 NODE_ENV, PORT 설정했지만 한 번 더 명시해도 무방)
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# package.json에 "start": "next start -p 3000" 이 있다고 가정
CMD ["npm", "start"]
