# =============================================================================
# SITERA API - KURUMSAL ÇOK AŞAMALI (MULTI-STAGE) DOCKERFILE
# =============================================================================

# --- 1. AŞAMA: Bağımlılıklar (Dependencies) ---
FROM node:20-alpine AS deps
WORKDIR /app

# Alpine kütüphaneleri
RUN apk add --no-cache libc6-compat

# Monorepo paket tanımları
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Yalnızca gerekli paketleri temiz kur
RUN npm ci

# --- 2. AŞAMA: Derleyici (Builder) ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Shared paketi ve NestJS API'yi üretim için derle
RUN npm run build --workspace=@sitera/shared
RUN npm run build --workspace=@sitera/api

# --- 3. AŞAMA: Çalışma Zamanı (Production Runner) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Güvenlik: Root olmayan 'node' kullanıcısı
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Sadece üretim için gereken derlenmiş dosyaları ve paketleri kopyala
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api || exit 1

CMD ["node", "apps/api/dist/main.js"]
