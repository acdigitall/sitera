# 📘 Sitera Monorepo — Kapsamlı Proje & Mimari Dokümantasyonu

Bu döküman, **Sitera** monorepo projesinin sıfırdan kurulumundan itibaren gerçekleştirilen tüm aşamaları, mimari kararları, veritabanı modelini ve geliştirme adımlarını detaylı olarak açıklar.

---

## 1. Proje Genel Mimarisi & Teknoloji Yığını

| Katman | Teknoloji / Kütüphane | Port / Yol | Açıklama |
| :--- | :--- | :--- | :--- |
| **Monorepo Yöneticisi** | Turborepo + npm Workspaces | Kök Dizin | Paralel derleme, akıllı önbellekleme (*Computation Caching*) |
| **Backend API** | NestJS 10 + TypeORM | `http://localhost:4000/api` | Modüler REST API, RLS Multi-Tenancy, Redis Entegrasyonu |
| **Web Frontend** | React 19 + Vite + TypeScript | `http://localhost:3000` | Modern Glassmorphism panel, Tenant değiştirici, CRUD arayüzü |
| **Mobil Uygulama** | React Native 0.76 + Expo 52 | `http://localhost:8081` | iOS & Android, Monorepo Metro Resolver, Shared Type desteği |
| **Veritabanı** | PostgreSQL 16 + RLS | `localhost:5432` (`sitera_db`) | **Row-Level Security** ve `group_id` ile motor düzeyinde veri izolasyonu |
| **Önbellek & Oturum** | Redis 7 | `localhost:6379` | Sık erişilen grup/kullanıcı verileri, TTL ve Session yönetimi |
| **Ortak Paketler** | `@sitera/shared`, `@sitera/tsconfig` | `packages/*` | Full-stack TypeScript tip güvenliği, DTO ve yardımcılar |

---

## 2. Kronolojik Olarak Gerçekleştirilen Adımlar

### 🔹 Adım 1: Monorepo Kök Yapısı ve Turborepo Kurulumu
1. Proje için `sitera/` ana dizini oluşturuldu.
2. `package.json` ile `apps/*` ve `packages/*` workspace'leri tanımlandı.
3. `turbo.json` ile `build`, `dev`, `lint` ve `typecheck` pipeline'ları ve önbellek kuralları yapılandırıldı.
4. `README.md` ve `.gitignore` dosyaları oluşturuldu.

---

### 🔹 Adım 2: Ortak Paketlerin Geliştirilmesi (`packages/*`)
Uygulamalar arasında kod tekrarını önlemek ve %100 tip güvenliği sağlamak için 2 paket inşa edildi:
1. **`@sitera/tsconfig`** (`packages/tsconfig`):
   - `base.json`: Temel TypeScript derleme kuralları.
   - `nestjs.json`: Decorator metadata ve CommonJS destekli backend kuralları.
   - `react.json`: React JSX ve modern bundler kuralları.
   - `react-native.json`: Expo/React Native kuralları.
2. **`@sitera/shared`** (`packages/shared`):
   - `User`, `CreateUserDto`, `UpdateUserDto` arayüzleri.
   - `Group`, `CreateGroupDto`, `UpdateGroupDto`, `GroupPlan` arayüzleri.
   - `ApiResponse`, `AppHealthStatus` genel API tipleri.
   - `formatFullName`, `formatRoleBadge` gibi ortak yardımcı fonksiyonlar ve sabitler.

---

### 🔹 Adım 3: NestJS Backend API'nin Kurulması (`apps/api`)
1. `apps/api/package.json` ve NestJS CLI konfigürasyonları yapıldı.
2. Global CORS ve `/api` prefix'i tanımlandı (`main.ts`).
3. Sağlık kontrolü (`/api/health`) ve Hoş geldin endpoint'leri eklendi.

---

### 🔹 Adım 4: React + Vite Web Dashboard'unun Kurulması (`apps/web`)
1. React 19 ve Vite 6 altyapısı yapılandırıldı (`vite.config.ts`).
2. Sleek Dark Glassmorphism tasarım sistemi (`index.css`) geliştirildi.
3. Mimari görünüm kartları, Tenant seçici, kullanıcı listesi ve modal bileşenleri kodlandı.

---

### 🔹 Adım 5: React Native (Expo) Mobil Uygulaması (`apps/mobile`)
1. Expo 52 ve React Native 0.76 yapılandırıldı.
2. Monorepo ortamında Metro bundler'ın üst dizindeki `node_modules` ve `@sitera/shared` paketlerini sorunsuz çözümleyebilmesi için özel `metro.config.js` yazıldı.
3. Paylaşılan tipleri kullanan mobil arayüz (`App.tsx`) kodlandı.

---

### 🔹 Adım 6: PostgreSQL Multi-Tenancy & Row-Level Security (RLS) Mimarisi
Kullanıcı gereksinimleri doğrultusunda veritabanı motoru düzeyinde izolasyon sağlayan kurumsal RLS mimarisi kuruldu:
1. **Veritabanı Modülü & RLS Politikaları:**
   - `apps/api/src/database/database.module.ts` TypeORM ile PostgreSQL bağlantısını kurar.
   - Uygulama ayağa kalktığında `ALTER TABLE users ENABLE ROW LEVEL SECURITY` ve `CREATE POLICY tenant_isolation_policy ON users ...` komutlarını otomatik uygular.
2. **Tenant Bağlamı & Middleware:**
   - `TenantContext` (`apps/api/src/tenancy/tenant.context.ts`): Node.js `AsyncLocalStorage` kullanarak istek bazlı thread-safe oturum yönetir.
   - `TenantMiddleware` (`apps/api/src/tenancy/tenant.middleware.ts`): Gelen HTTP isteklerindeki `x-group-id` başlığını yakalar.
   - Her veritabanı işleminde `SET LOCAL app.current_group_id = '<UUID>'` çalıştırılarak PostgreSQL'e o anki tenant bildirilir.
3. **Entity'ler:**
   - `GroupEntity` (`apps/api/src/groups/group.entity.ts`): `groups` tablosu (UUID, name, slug, plan).
   - `UserEntity` (`apps/api/src/users/user.entity.ts`): `users` tablosu (UUID, `group_id` foreign key, name, email, role).
4. **Otomatik Tohumlama (Seed):**
   - `GroupsService` (`apps/api/src/groups/groups.service.ts`) veritabanı ilk kez açıldığında örnek tenant'ları (`Acme Holding`, `Sitera Teknoloji`) otomatik ekler.

---

### 🔹 Adım 7: Redis Önbellek (Cache & Session) Entegrasyonu
1. `apps/api/src/redis/redis.service.ts` geliştirildi.
2. `groups:all`, `users:group:{groupId}:all` gibi anahtarlarla tenant bazlı önbellekleme ve veri güncellendiğinde otomatik önbellek temizleme (*cache invalidation*) mekanizması kuruldu.

---

### 🔹 Adım 8: Docker Compose & Veritabanı Görüntüleme (TablePlus & pgweb)
1. `docker-compose.yml` içine **PostgreSQL 16**, **Redis 7** ve sıfır kurulumlu web arayüzü **pgweb** (`:8082`) eklendi.
2. Yerel macOS PostgreSQL kullanıcısı (`cagataydalaman`) ile entegrasyon sağlandı ve **TablePlus** bağlantısı gerçekleştirildi.

---

### 🔹 Adım 9: Kimlik Doğrulama (Auth) & Süper Admin Login Mimarisi
1. **NestJS Auth Modülü (`apps/api/src/auth`):**
   - `AuthService` PBKDF2 kriptografik salt ile şifreleme ve doğrulama mekanizmasını sağlar.
   - Uygulama ilk açıldığında varsayılan tam yetkili **Süper Admin** (`admin@sitera.com` / `Admin123!`) hesabını tohumlar.
   - `POST /api/auth/login`: Güvenli oturum açma ve 24 saatlik Redis session token üretimi.
   - `GET /api/auth/me`: Aktif kullanıcı profil sorgulama.
   - `POST /api/auth/logout`: Redis oturumunun silinmesi.
2. **Ortak Tipler (`@sitera/shared`):**
   - `superadmin` rolü, `LoginDto`, `AuthUser`, `AuthResponse` tipleri eklendi.
3. **Web Frontend (`apps/web`):**
   - `AuthContext`: Token ve oturum durum yönetimi, `localStorage` senkronizasyonu.
   - `LoginView`: Register olmadan sadece yetkili girişine izin veren ultra modern Glassmorphism giriş ekranı.
   - `Sidebar` & `TopBar`: Sol dikey modern navigasyon paneli (Genel Bakış, Kullanıcı Yönetimi, Tenant & Gruplar, Veri İzolasyonu & RLS).
   - `Header / Sidebar User Profile`: Aktif Süper Admin bilgisi, rol rozeti ve güvenli çıkış butonu.

### 🔹 Adım 10: Web Frontend (React 19) Feature-Based Kurumsal Mimari
Frontend projesinin ölçeklenebilir, okunabilir ve başka geliştiriciler için %100 anlaşılır olması amacıyla **Domain/Feature-Driven** mimarisine geçildi:
1. **`src/features/` (İş Mantığı & Modüller):**
   - `auth/`: `AuthContext`, `LoginView`, `auth.api.ts`
   - `users/`: `UserList`, `CreateUserModal`, `useUsers` hook'u, `users.api.ts`
   - `tenants/`: `GroupsView`, `CreateGroupModal`, `useTenants` hook'u, `tenants.api.ts`
   - `architecture/`: `ArchitectureView`, `useHealth` hook'u, `health.api.ts`
2. **`src/components/common/` (Ortak UI & Design System):**
   - `Modal.tsx`, `Spinner.tsx`, `Badge.tsx`, `Card.tsx`
3. **`src/components/layout/` (Navigasyon & Sayfa İskeleti):**
   - `Sidebar.tsx`, `TopBar.tsx`, `DashboardLayout.tsx`
4. **`src/services/` (Merkezi API İstemcisi):**
   - `api-client.ts`: Otomatik Bearer Token ve PostgreSQL RLS `x-group-id` enjeksiyonu.
5. **`src/App.tsx`:**
   - 50 satırlık, temiz ve sadece yönlendirme ve layout birleştirmesi yapan deklaratif ana bileşen.

---

## 3. Klasör & Dosya Ağacı

```
sitera/
├── 📱 apps/
│   ├── api/                            # Backend API (NestJS 10)
│   │   ├── src/
│   │   │   ├── auth/                   # Kimlik Doğrulama & Oturum Modülü
│   │   │   ├── database/               # PostgreSQL & RLS Policy Module
│   │   │   ├── tenancy/                # AsyncLocalStorage & Tenant Middleware
│   │   │   ├── redis/                  # Redis Cache & Session Service
│   │   │   ├── groups/                 # Tenant/Group CRUD & Entities
│   │   │   ├── users/                  # User CRUD & RLS-Scoped Repository
│   │   │   ├── app.controller.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   ├── web/                            # Web Paneli (React 19 + Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/             # Ortak UI & Layout Bileşenleri
│   │   │   │   ├── common/             # Modal, Spinner, Badge, Card
│   │   │   │   └── layout/             # Sidebar, TopBar, DashboardLayout
│   │   │   ├── features/               # Feature-Driven Modüller
│   │   │   │   ├── auth/               # Context, LoginView, auth.api.ts
│   │   │   │   ├── users/              # UserList, CreateUserModal, useUsers, users.api.ts
│   │   │   │   ├── tenants/            # GroupsView, CreateGroupModal, useTenants, tenants.api.ts
│   │   │   │   └── architecture/       # ArchitectureView, useHealth, health.api.ts
│   │   │   ├── services/
│   │   │   │   └── api-client.ts       # Global Fetch İstemcisi (Auth & RLS Headers)
│   │   │   ├── App.tsx                 # Deklaratif Ana Dashboard Yönlendiricisi
│   │   │   └── index.css               # Glassmorphism Tasarım Sistemi
│   │   └── package.json
│   └── mobile/                         # Mobil Uygulama (React Native / Expo)
│       ├── App.tsx                     # Mobil Arayüz
│       ├── metro.config.js             # Monorepo Workspace Resolver
│       └── package.json
├── 📦 packages/
│   ├── shared/                         # @sitera/shared (DTO, Tipler, Sabitler)
│   └── tsconfig/                       # @sitera/tsconfig (Ortak TS Yapılandırmaları)
├── docker-compose.yml                  # Postgres + Redis + pgweb Containerları
├── turbo.json                          # Turborepo Yapılandırması
├── package.json                        # Workspaces & Scriptler
└── README.md                           # Başlangıç Kılavuzu
```

---

## 4. Geliştirici Kılavuzu & Sık Kullanılan Komutlar

### 🚀 Geliştirme Ortamını Başlatma:
```bash
# Tüm Monorepo uygulamalarını (API + Web + Mobil) aynı anda başlatmak için:
npm run dev

# Sadece API (NestJS):
npm run dev --filter=@sitera/api

# Sadece Web (React):
npm run dev --filter=@sitera/web

# Sadece Mobil (Expo):
npm run dev --filter=@sitera/mobile
```

### 🔍 Tip Kontrolü ve Derleme:
```bash
# Tüm paketlerde TypeScript kontrolü:
npm run typecheck

# Tüm paketleri optimize ederek derleme:
npm run build
```

### 🗄️ Veritabanı Bağlantı Parametreleri:
- **Host:** `localhost`
- **Port:** `5432`
- **User:** `cagataydalaman` (veya Docker için `postgres`)
- **Database:** `sitera_db`
- **Password:** *(Yerel Mac için boş, Docker için `postgres123`)*
