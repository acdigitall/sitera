# 📡 Sitera REST API — Kapsamlı Teknik Referans Dokümantasyonu (v2.4)

> **Base URL (Canlı):** `https://sitera-api.onrender.com/api`  
> **Base URL (Geliştirme):** `http://localhost:4000/api`  
> **Format:** `application/json`  
> **Karakter Seti:** `UTF-8`  

---

## 1. Genel Kurallar & Global HTTP Başlıkları (Headers)

Sitera API, **Çok Kiracılı (Multi-Tenant)** ve **Rol Tabanlı Yetkilendirme (RBAC)** ilkeleriyle çalışır.

### İstek Başlıkları Tablosu

| Başlık (Header) | Tip | Zorunlu mu? | Açıklama |
| :--- | :--- | :--- | :--- |
| `Content-Type` | `string` | Evet (POST/PATCH/PUT) | Her zaman `application/json` olmalıdır. |
| `Authorization` | `string` | Evet (Korumalı Rotalarda) | `Bearer <session_token>` formatında oturum anahtarı. |
| `x-group-id` | `UUID` | Kiracı İşlemlerinde | İstek yapılan sitenin/apartmanın benzersiz kimliği (RLS ayrıştırması). |
| `x-user-id` | `UUID` | Bazı İşlemlerde | İşlemi gerçekleştiren kullanıcının benzersiz kimliği. |
| `x-user-role` | `string` | Yetki Kontrolünde | `superadmin`, `admin`, `accountant`, `auditor`, `security`, `member`. |

### Standart API Yanıt Formatı (`ApiResponse<T>`)

Başarılı tüm istekler şu standart gövdeyle döner:
```json
{
  "success": true,
  "message": "İşlem başarılı (opsiyonel)",
  "data": { ... },
  "timestamp": "2026-09-11T08:30:00.000Z"
}
```

Hata durumlarında dönen standart gövde:
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "E-posta veya şifre hatalı.",
  "correlationId": "err_1789113311678_eonz2",
  "timestamp": "2026-09-11T08:30:00.000Z",
  "path": "/api/auth/login"
}
```

---

## 2. Kimlik Doğrulama & Oturum Modülü (`/api/auth`)

### 2.1. Kullanıcı Girişi
Süper Admin, Site Yöneticisi, Personel veya Sakin girişi yapar.

- **URL:** `POST /api/auth/login`
- **Yetki:** Herkese Açık
- **İstek Gövdesi (Body):**
```json
{
  "email": "admin@sitera.com",
  "password": "Admin123!"
}
```
- **Başarılı Yanıt (200 OK):**
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "token": "a1b2c3d4e5f6... (24 saat geçerli oturum anahtarı)",
    "user": {
      "id": "7b79a834-0d7e-4054-913a-7a54823126f5",
      "groupId": null,
      "email": "admin@sitera.com",
      "name": "Süper Yönetici",
      "role": "superadmin",
      "isActive": true,
      "group": null
    }
  },
  "timestamp": "2026-09-11T08:30:00.000Z"
}
```

### 2.2. Aktif Oturumu Doğrulama
Gönderilen Bearer token'a ait kullanıcı profilini ve kiracı detaylarını döner.

- **URL:** `GET /api/auth/me`
- **Başlık:** `Authorization: Bearer <token>`
- **Başarılı Yanıt (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "7b79a834-0d7e-4054-913a-7a54823126f5",
    "groupId": "00000000-0000-0000-0000-000000000001",
    "email": "yonetim@cinar.com",
    "name": "Ahmet Yılmaz",
    "role": "admin",
    "isActive": true,
    "group": {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Çınar Konutları",
      "slug": "cinar-konutlari"
    }
  },
  "timestamp": "2026-09-11T08:30:00.000Z"
}
```

### 2.3. Çıkış Yapma
Aktif oturumu ve Redis/In-memory oturum anahtarını sonlandırır.

- **URL:** `POST /api/auth/logout`
- **Başlık:** `Authorization: Bearer <token>`
- **Başarılı Yanıt (200 OK):**
```json
{
  "success": true,
  "message": "Başarıyla çıkış yapıldı",
  "data": { "loggedOut": true },
  "timestamp": "2026-09-11T08:30:00.000Z"
}
```

---

## 3. Site & Tenant Yönetimi (`/api/groups`)

### 3.1. Siteleri Listele
Süper Admin tüm siteleri, diğer kullanıcılar yalnızca yetkili oldukları siteleri görür.

- **URL:** `GET /api/groups`
- **Başlık:** `Authorization: Bearer <token>`, `x-group-id: <uuid>` (opsiyonel)
- **Başarılı Yanıt (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "9a5b3c4d-1111-2222-3333-444455556666",
      "name": "Çınar Sitesi",
      "slug": "cinar-sitesi",
      "city": "İstanbul",
      "district": "Kadıköy",
      "totalUnits": 30,
      "unitFee": 750,
      "monthlyFee": 22500,
      "subscriptionStatus": "trial",
      "trialEndsAt": "2026-12-11T08:00:00.000Z",
      "licenseExpiresAt": "2027-03-11T08:00:00.000Z",
      "modules": [
        {
          "moduleCode": "ANPR_PLATE_RECOGNITION",
          "status": "active",
          "activatedAt": "2026-09-11"
        }
      ]
    }
  ]
}
```

### 3.2. Yeni Site / Apartman Oluştur
- **URL:** `POST /api/groups`
- **Yetki:** `superadmin`
- **İstek Gövdesi:**
```json
{
  "name": "Palmiye Evleri",
  "slug": "palmiye-evleri",
  "city": "İzmir",
  "district": "Karşıyaka",
  "address": "Atatürk Mah. 1881 Sok. No: 12",
  "totalUnits": 24,
  "unitFee": 850,
  "managerName": "Kemal Demir",
  "managerEmail": "yonetim@palmiye.com",
  "managerPhone": "0532 111 22 33"
}
```

### 3.3. Akıllı Modül Pazaryeri Kataloğu
Sistemde mevcut olan tüm akıllı donanım ve yazılım modüllerini listeler.

- **URL:** `GET /api/groups/modules/catalog`
- **Başarılı Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "code": "ANPR_PLATE_RECOGNITION",
      "name": "Plaka Tanıma Sistemi (ANPR)",
      "category": "hardware",
      "defaultPrice": 5,
      "pricingModel": "per_unit"
    },
    {
      "code": "SMART_INTERCOM",
      "name": "Akıllı İnterkom & Görüntülü Diyafon",
      "category": "hardware",
      "defaultPrice": 4,
      "pricingModel": "per_unit"
    },
    {
      "code": "FACILITY_RESERVATION",
      "name": "Sosyal Tesis & Havuz Rezervasyonu",
      "category": "software",
      "defaultPrice": 250,
      "pricingModel": "flat_monthly"
    }
  ]
}
```

### 3.4. Modül Aboneliğini Açma / Kapatma
- **URL:** `POST /api/groups/:id/modules/toggle`
- **İstek Gövdesi:**
```json
{
  "moduleCode": "ANPR_PLATE_RECOGNITION",
  "status": "active",
  "durationDays": 30,
  "customPrice": 5
}
```

### 3.5. Site Yasal Veri Dökümü (Export)
Sitenin tüm finansal, sakin, arıza ve geçmiş kayıtlarını tek bir arşiv halinde döner.
- **URL:** `GET /api/groups/:id/export`

---

## 4. Kullanıcı Yönetimi (`/api/users`)

### 4.1. Kullanıcıları Listele
- **URL:** `GET /api/users`
- **Başlık:** `x-group-id: <uuid>`
- **Başarılı Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": "e4f3a2b1-9999-8888-7777-666655554444",
      "name": "Mehmet Kaya",
      "email": "mehmet@cinar.com",
      "phone": "0532 444 55 66",
      "role": "member",
      "units": ["A Blok Daire 4"],
      "residentType": "owner",
      "isActive": true
    }
  ]
}
```

### 4.2. Yeni Kullanıcı Oluşturma
- **URL:** `POST /api/users`
- **Başlık:** `x-group-id: <uuid>`
- **İstek Gövdesi:**
```json
{
  "name": "Selin Aydın",
  "email": "selin@cinar.com",
  "password": "Selin1234!",
  "role": "member",
  "units": ["B Blok Daire 12"],
  "residentType": "tenant",
  "phone": "0533 222 33 44"
}
```

### 4.3. Toplu Daire / Sakin Oluşturma (Bulk)
Excel veya toplu daire oluşturma sihirbazı ile kullanılır.
- **URL:** `POST /api/users/bulk`
- **İstek Gövdesi:** `CreateUserDto[]` dizi formatında.

---

## 5. Finans & Muhasebe Motoru (`/api/finance`)

### 5.1. Finansal Özet Göstergeleri (KPI)
- **URL:** `GET /api/finance/summary`
- **Başlık:** `x-group-id: <uuid>`
- **Başarılı Yanıt:**
```json
{
  "success": true,
  "data": {
    "totalBalance": 142500.50,
    "pendingReceivables": 18250.00,
    "monthlyExpenseTotal": 32400.00,
    "collectionRate": 88.5,
    "primaryAccount": {
      "bankName": "Ziraat Bankası",
      "iban": "TR12 0001 0000 1234 5678 9012 34",
      "balance": 128500.50
    }
  }
}
```

### 5.2. Yeni Aidat Dönemi Başlatma
- **URL:** `POST /api/finance/periods`
- **İstek Gövdesi:**
```json
{
  "name": "Ekim 2026 Olağan Aidat",
  "periodType": "dues",
  "amount": 750,
  "dueDate": "2026-10-15",
  "description": "Ekim ayı bina temizlik, asansör ve güvenlik giderleri"
}
```

### 5.3. Sakin Borç Sorgulama (Sakin Portalı)
- **URL:** `GET /api/finance/my-debts`
- **Başlık:** `x-group-id: <uuid>`, `x-user-id: <uuid>`
- **Başarılı Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": "deb-101",
      "unit": "Daire 4",
      "periodName": "Ekim 2026 Olağan Aidat",
      "amount": 750,
      "paidAmount": 0,
      "lateFeeAmount": 0,
      "status": "pending",
      "dueDate": "2026-10-15"
    }
  ]
}
```

### 5.4. Dekont / Ödeme Bildirimi Yükleme
- **URL:** `POST /api/finance/payments`
- **İstek Gövdesi:**
```json
{
  "debtId": "deb-101",
  "amount": 750,
  "channel": "bank_transfer",
  "referenceNo": "DEKONT-847291",
  "receiptUrl": "https://sitera-storage.../dekont.pdf"
}
```

### 5.5. Dekont Onaylama (Yönetici)
Yönetici dekontu onayladığı anda borç statüsü `paid` olur, kasa bakiyesi artar ve tahsilat makbuzu üretilir.
- **URL:** `POST /api/finance/payments/:id/approve`
- **İstek Gövdesi:**
```json
{
  "approvedBy": "Ahmet Yılmaz (Yönetici)"
}
```

### 5.6. Elden Nakit Tahsilat Makbuzu Kaydı
- **URL:** `POST /api/finance/cash-collection`
- **İstek Gövdesi:**
```json
{
  "debtId": "deb-101",
  "amount": 750,
  "payerName": "Mehmet Kaya",
  "unit": "Daire 4",
  "notes": "Elden makbuz karşılığı teslim alındı"
}
```

### 5.7. Kasa & Banka Virman / Transfer
- **URL:** `POST /api/finance/accounts/transfer`
- **İstek Gövdesi:**
```json
{
  "fromAccountId": "acc-bank-1",
  "toAccountId": "acc-cash-safe",
  "amount": 5000,
  "description": "Kapıcı avansı için bankadan nakit kasaya çekildi"
}
```

### 5.8. Yönetim Kurulu Resmi Bilanço & Rapor Paketi
- **URL:** `GET /api/finance/reports?periodId=<uuid>&year=2026`

---

## 6. Duyuru & Tebligat Yönetimi (`/api/announcements`)

### 6.1. Duyuru Listesi (Hedefleme Korumalı)
- **URL:** `GET /api/announcements?userId=<uuid>&userRole=member`
- **Başlık:** `x-group-id: <uuid>`

### 6.2. Yeni Duyuru Yayınlama
- **URL:** `POST /api/announcements`
- **İstek Gövdesi:**
```json
{
  "title": "A Blok Asansör Revizyonu",
  "content": "Perşembe günü 10:00 - 14:00 arasında periyodik muayene yapılacaktır.",
  "category": "Bakım",
  "isImportant": true,
  "targetScope": "block",
  "targetBlocks": ["A Blok"],
  "status": "published"
}
```

### 6.3. Okundu Bildirimi Gönderme
- **URL:** `POST /api/announcements/:id/read`
- **İstek Gövdesi:**
```json
{
  "userId": "usr-101",
  "userName": "Can Yurt",
  "unit": "Daire 1"
}
```

### 6.4. Okunma Dökümü & İstatistikler
- **URL:** `GET /api/announcements/:id/reads`
- **Başarılı Yanıt:**
```json
{
  "success": true,
  "data": {
    "totalTargetUnits": 24,
    "readCount": 18,
    "readPercentage": 75,
    "reads": [
      {
        "userId": "usr-101",
        "userName": "Can Yurt",
        "unit": "Daire 1",
        "readAt": "2026-09-11T09:15:20.000Z"
      }
    ],
    "unreadUnits": ["Daire 5", "Daire 9", "Daire 14"]
  }
}
```

---

## 7. Talep, Arıza & Bakım Yönetimi (`/api/tickets`)

### 7.1. Yeni Arıza / Talep Bildirme (Sakin)
- **URL:** `POST /api/tickets`
- **İstek Gövdesi:**
```json
{
  "title": "3. Kat Koridor Lambası Yanmıyor",
  "description": "Sensör devreye girmiyor, akşamları koridor karanlık kalıyor.",
  "category": "Elektrik & Aydınlatma",
  "location": "A Blok 3. Kat",
  "urgency": "normal",
  "photos": ["https://sitera-storage.../lamba.jpg"]
}
```

### 7.2. Talep Durumu Güncelleme & Çözüm Notu Ekleme (Yönetici)
- **URL:** `PATCH /api/tickets/:id/status`
- **İstek Gövdesi:**
```json
{
  "status": "resolved",
  "adminNotes": "Elektrikçi çağrıldı, armatür sensörü yenisiyle değiştirildi."
}
```

---

## 8. Bildirim Merkezi (`/api/notifications`)

- `GET /api/notifications` $\rightarrow$ Kullanıcının bildirim akışını getirir (`unreadOnly=true` filtresi desteklenir).
- `GET /api/notifications/unread-count` $\rightarrow$ Okunmamış bildirim adedini döner.
- `PATCH /api/notifications/:id/read` $\rightarrow$ Belirli bildirimi okundu işaretler.
- `PATCH /api/notifications/read-all` $\rightarrow$ Tüm bildirimleri tek tıkla okundu yapar.

---

## 9. Denetim & Audit Günlükleri (`/api/audit-logs`)

- **URL:** `GET /api/audit-logs?category=AUTH&search=admin&limit=50`
- **Başlık:** `x-group-id: <uuid>`
- **Başarılı Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-1",
      "action": "AUTH_LOGIN_SUCCESS",
      "category": "AUTH",
      "level": "INFO",
      "userName": "Süper Yönetici",
      "ipAddress": "88.241.10.42",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
      "timestamp": "2026-09-11T08:30:15.000Z"
    }
  ]
}
```

---

## 10. Platform Destek & Canlı Müdahale (`/api/support`)

- `GET /api/support/tickets` $\rightarrow$ Süper Admin tüm destek taleplerini, site yöneticisi kendi açtığı talepleri görür.
- `POST /api/support/tickets` $\rightarrow$ Site yöneticisi KVKK onayıyla canlı destek talebi oluşturur (`allowSiteAccess: true`).
- `POST /api/support/tickets/:id/impersonate` $\rightarrow$ Süper Admin geçici canlı müdahale oturumu başlatır.
- `POST /api/support/tickets/:id/exit` $\rightarrow$ Canlı müdahale oturumunu güvenle sonlandırır.

---

## 11. Yasal Metinler & KVKK (`/api/legal`)

- `GET /api/legal/:type` $\rightarrow$ Halka açık metni döner (`terms` veya `kvkk`).
- `GET /api/legal/admin/all` $\rightarrow$ Tüm metinleri versiyon geçmişiyle döner (Yalnızca Süper Admin).
- `PUT /api/legal/:type` $\rightarrow$ Metni günceller ve versiyon yükseltir (`v2.5`).
- `POST /api/legal/admin/reset/:type` $\rightarrow$ Metni varsayılan fabrika ayarlarına sıfırlar.

---

## 12. Sistem Sağlık & Metrikler (`/api/metrics` & `/api/health`)

- `GET /api/health` $\rightarrow$ `{ "status": "ok", "database": "PostgreSQL 16 Connected", "redis": "connected / bypass" }`
- `GET /api/metrics` $\rightarrow$ Prometheus metrikleri (`sitera_http_requests_total`, `process_resident_memory_bytes`, `sitera_database_connected`).
