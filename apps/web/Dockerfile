# =============================================================================
# SITERA WEB - NGINX SPA ÜRETİM DOCKERFILE
# =============================================================================

# --- 1. AŞAMA: Bağımlılıklar (Dependencies) ---
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# --- 2. AŞAMA: Derleyici (Builder) ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Üretim ortam değişkenleri ile Vite derlemesi
ENV NODE_ENV=production
RUN npm run build --workspace=@sitera/shared
RUN npm run build --workspace=@sitera/web

# --- 3. AŞAMA: Nginx Web Sunucusu (Production Runner) ---
FROM nginx:1.27-alpine AS runner

# Özel Nginx konfigürasyonunu kopyala
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Derlenmiş statik dosyaları Nginx kök dizinine yerleştir
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
