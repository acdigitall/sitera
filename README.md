# 🚀 Sitera Monorepo

Modern, yüksek performanslı ve tam tip güvenliğine (Full-stack TypeScript) sahip **NestJS**, **React (Vite)** ve **React Native (Expo)** Monorepo Projesi.

## 📁 Mimari Yapı

```
sitera/
├── apps/
│   ├── api/            # 🌐 NestJS REST API (Port: 4000)
│   ├── web/            # 💻 React + Vite Web Dashboard (Port: 3000)
│   └── mobile/         # 📱 Expo / React Native Mobil Uygulama (Port: 8081)
├── packages/
│   ├── shared/         # 🔄 Ortak DTO'lar, Tipler, Fonksiyonlar (@sitera/shared)
│   └── tsconfig/       # ⚙️ Paylaşılan TypeScript Konfigürasyonları (@sitera/tsconfig)
├── package.json        # 📦 Monorepo Workspaces Tanımları
├── turbo.json          # ⚡ Turborepo Pipeline & Caching
└── README.md
```

---

## 🛠️ Kurulum & Başlangıç

### 1. Bağımlılıkları Yükleyin
Proje kök dizininde aşağıdaki komutu çalıştırın:

```bash
npm install
```

### 2. Geliştirme Sunucularını Başlatma

Tüm projeleri (API, Web ve Mobile) Turborepo ile paralel olarak başlatmak için:
```bash
npm run dev
```

Veya belirli bir projeyi tek başına çalıştırmak için:
- **Sadece Backend (NestJS):**
  ```bash
  npm run dev --filter=@sitera/api
  ```
- **Sadece Web (React):**
  ```bash
  npm run dev --filter=@sitera/web
  ```
- **Sadece Mobil (Expo):**
  ```bash
  npm run dev --filter=@sitera/mobile
  ```

---

## 📦 Projeler ve Portlar

| Proje | Teknoloji | Varsayılan Adres | Açıklama |
| :--- | :--- | :--- | :--- |
| **@sitera/api** | NestJS 10 + TypeScript | `http://localhost:4000/api` | Backend REST API & Swagger/Health |
| **@sitera/web** | React 19 + Vite + Glassmorphism | `http://localhost:3000` | Web Yönetim Paneli & API İstemcisi |
| **@sitera/mobile** | Expo 52 + React Native | `http://localhost:8081` | iOS & Android Mobil Uygulaması |
| **@sitera/shared** | TypeScript Package | Dahili | DTO, Interface ve Tip Tanımları |

---

## 🏗️ Derleme (Build) ve Tip Kontrolü (Typecheck)

- **Tüm Projeleri Derleme:**
  ```bash
  npm run build
  ```

- **Tip Kontrolü:**
  ```bash
  npm run typecheck
  ```
