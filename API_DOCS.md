# 📱 Sitera REST API — Eksiksiz Mobil & Web Entegrasyon Dokümantasyonu (v3.0)

> **Canlı API Sunucusu (Production):** `https://sitera-api.onrender.com/api`  
> **Yerel Geliştirme (Localhost):** `http://localhost:4000/api`  
> **Android Emülatörü İçin Localhost:** `http://10.0.2.2:4000/api`  
> **İletişim Formatı:** `application/json` (UTF-8)  
> **API Versiyonu:** `v3.0 - Full Production Multi-Tenant REST Engine`  
> **Kapsam:** 12 Controller — **77 Endpoint'in Tamamı (Eksiksiz & Parametre Detaylı)**

---

## 📑 İçindekiler Tablosu

1. [Mobil Geliştiriciler İçin Hızlı Başlangıç Rehberi](#1-mobil-geliştiriciler-için-hızlı-başlangıç-rehberi)
   - [Ağ Katmanı & HTTP Interceptor Yapılandırması](#11-ağ-katmanı--http-interceptor-yapılandırması)
   - [Kiracı (Tenant) & RLS Ayrıştırma Mantığı](#12-kiracı-tenant--rls-ayrıştırma-mantığı)
   - [Kullanıcı Rolleri & Ekran İzinleri](#13-kullanıcı-rolleri--ekran-izinleri)
   - [Standart Yanıt ve Hata Formatı](#14-standart-yanıt-ve-hata-formatı)
2. [Modül 1: Kimlik Doğrulama & Profil (`/api/auth`)](#2-modül-1-kimlik-doğrulama--profil-apiauth)
3. [Modül 2: Mobil Sakin Portalı Uç Noktaları](#3-modül-2-mobil-sakin-portalı-uç-noktaları)
   - [Borçlar & Aidatlar](#31-sakin-borç-ve-aidat-listesi)
   - [Site Bilgileri & IBAN](#32-site-finans-bilgileri--iban-sorgulama)
   - [Dekont / Ödeme Bildirimi Yükleme](#33-dekont--ödeme-bildirimi-gönderme)
   - [Duyurular & Okundu Bildirimi](#34-hedefli-duyuru-akışı)
   - [Arıza & Talep Açma](#36-yeni-arıza--talep-bildirme-fotoğraflı)
   - [Bildirim Merkezi & Rozet Sayısı](#38-bildirimleri-listeleme)
   - [Kullanıcı Koşulları & KVKK](#313-halka-açık-yasal-metin-sorgulama)
4. [Modül 3: Mobil Yönetici & Personel Portalı Uç Noktaları](#4-modül-3-mobil-yönetici--personel-portalı-uç-noktaları)
   - [Finansal KPI & Özet](#41-finansal-kpi-özet-göstergeleri)
   - [Dekont Onay / Red İşlemleri](#42-onay-bekleyen-dekontlar)
   - [Elden Nakit Tahsilat](#45-elden-nakit-tahsilat-makbuzu-kesme)
   - [Sakin Tahliyesi & İbraname](#46-sakin-tahliyesi-ve-ibraname-işlemi)
   - [Dönem & Aidat Otomasyonu](#47-tüm-aidat-dönemlerini-listeleme)
   - [Kasa & Banka Virman İşlemleri](#412-kasa--banka-hesaplarını-listeleme)
   - [Arıza & Talep Yönetimi](#419-yönetici-arıza-ve-bakım-talepleri-listesi)
   - [Duyuru Yayınlama & Okunma İstatistikleri](#422-yeni-hedeflemeli-duyuru-yayınlama)
   - [Sakin & Kullanıcı Yönetimi](#425-sitedeki-kullanıcıları-listeleme)
5. [Modül 4: Platform Yönetimi & Süper Admin Uç Noktaları](#5-modül-4-platform-yönetimi--süper-admin-uç-noktaları)
   - [Siteler & Kiracılar (`/api/groups`)](#51-tüm-siteleri-listeleme)
   - [Modül Pazaryeri & IoT Eklentileri](#59-akıllı-modül-kataloğu)
   - [Platform Destek & Canlı Müdahale (`/api/support`)](#514-destek-taleplerini-listeleme)
   - [Yasal Metin Yönetimi (`/api/legal`)](#521-tüm-yasal-metinleri-listeleme-admin)
   - [Audit Denetim Logları (`/api/audit-logs`)](#524-denetim-audit-günlüklerini-listeleme)
   - [Sistem Sağlığı & Metrikler (`/api/health`, `/api/metrics`)](#526-sistem-karşılama-ve-versiyon)
6. [Tip & Enum Referans Sözlüğü](#6-tip--enum-referans-sözlüğü)

---

## 1. Mobil Geliştiriciler İçin Hızlı Başlangıç Rehberi

### 1.1. Ağ Katmanı & HTTP Interceptor Yapılandırması

Mobil uygulamada (React Native, Flutter, Swift/Kotlin) yapacağınız her API isteğinde kimlik ve kiracı doğrulaması gerekmektedir. Kullanıcı `/api/auth/login` endpoint'inden giriş yaptığında dönen veride:
1. `token` (JWT veya Session Token)
2. `user.id` (Kullanıcı Benzersiz ID'si)
3. `user.groupId` (Kullanıcının Bağlı Olduğu Sitenin ID'si)
4. `user.role` (Kullanıcının Rolü: `member`, `admin`, `staff`, vb.)

Bu bilgiler güvenli depolama alanına (`SecureStore`, `FlutterSecureStorage`, `Keychain`) kaydedilmeli ve tüm isteklere interceptor ile eklenmelidir:

#### İstek Başlıkları (Headers)
| Başlık Adı | Zorunlu mu? | Açıklama |
| :--- | :--- | :--- |
| `Content-Type` | Evet | Her zaman `application/json` olmalıdır. |
| `Authorization` | Evet (Korumalı Rotalarda) | `Bearer <token>` formatında oturum anahtarı. |
| `x-group-id` | Evet (Kiracı İşlemlerinde) | Kiracının (Sitenin) UUID değeri. Veri güvenliği (RLS) için zorunludur. |
| `x-user-id` | Evet (Sakin İşlemlerinde) | İşlemi yapan kullanıcının UUID değeri. |
| `x-user-role` | Opsiyonel / Tavsiye | Kullanıcının rolü (`member`, `admin`, `staff`, `superadmin`). |

#### Örnek Axios / Interceptor Kodu (JavaScript / TypeScript)
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://sitera-api.onrender.com/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getSecureToken();
  const groupId = getSelectedGroupId();
  const userId = getCurrentUserId();
  const role = getCurrentUserRole();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (groupId) {
    config.headers['x-group-id'] = groupId;
  }
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  if (role) {
    config.headers['x-user-role'] = role;
  }
  return config;
});
```

---

### 1.2. Kiracı (Tenant) & RLS Ayrıştırma Mantığı

Sitera arka yüzü, **Row-Level Security (RLS)** ile korunmaktadır.
- `superadmin`: Tüm grupları ve siteleri görebilir (`x-group-id` göndermeyebilir ya da parametreyle filtreleyebilir).
- `admin`, `accountant`, `auditor`, `staff`, `security`: Yalnızca bağlı olduğu siteye ait daireleri, giderleri, borçları ve bildirimleri görür.
- `member` (Kat Maliki / Kiracı): Sadece kendi dairesine ait borçları, okuduğu duyuruları ve açtığı arıza taleplerini görür.

---

### 1.3. Kullanıcı Rolleri & Ekran İzinleri

Mobil uygulamayı tasarlarken kullanıcı rolüne göre tab bar ve menüleri dinamik oluşturun:

| Rol (`role`) | Türkçe Karşılığı | Mobil Görünüm | İzinli Alanlar |
| :--- | :--- | :--- | :--- |
| `member` | Sakin / Kat Maliki | **Sakin Modu** | Borçlar, Dekont Yükleme, Arıza Bildirme, Duyurular, Bildirimler. |
| `staff` | Teknik Personel | **Personel Modu** | Kendisine atanan arıza taleplerini çözme, durum güncelleme, duyurular. |
| `security` | Güvenlik / Danışma | **Güvenlik Modu** | Sakin rehberi arama, araç plaka kontrolü, acil durum tebligatları. |
| `admin` | Site Yöneticisi | **Yönetici Modu** | Finansal KPI, Dekont Onaylama, Kasa Tahsilatı, Duyuru Yayını, Arıza Çözümü, Sakin Listesi. |
| `accountant` | Muhasebe / Mali Müşavir | **Mali Mod** | Kasa, Banka, Raporlar, Aidat Dönemleri, Tahsilat Onayı. |
| `superadmin` | Platform Yöneticisi | **Süper Mod** | Tüm siteler, Modül Pazaryeri, Lisanslama, Canlı Destek Müdahalesi. |

---

### 1.4. Standart Yanıt ve Hata Formatı

#### Başarılı Yanıt (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "İşlem başarıyla tamamlandı",
  "data": { ... },
  "timestamp": "2026-09-11T12:00:00.000Z"
}
```

#### Hata Yanıtı (HTTP 400 / 401 / 403 / 404 / 500)
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Geçersiz oturum anahtarı veya yetkisiz erişim.",
  "correlationId": "err_1789113311678_ab12",
  "timestamp": "2026-09-11T12:00:00.000Z",
  "path": "/api/finance/debts"
}
```

---

## 2. Modül 1: Kimlik Doğrulama & Profil (`/api/auth`)

### 2.1. Kullanıcı Girişi (Login)
Mobil uygulamanın ilk açılışında çağrılır. Sakin, Yönetici veya Süper Admin ayrımı olmaksızın ortak giriş kapısıdır.

- **Yol (Path):** `POST /api/auth/login`
- **Yetki:** Herkese Açık (Token gerekmez)
- **Başlıklar:**
  - `Content-Type: application/json`
  - `x-forwarded-for`: `client_ip` (opsiyonel)
  - `user-agent`: `SiteraMobile/1.0.0 iOS` (opsiyonel)

#### İstek Gövdesi (Request Body)
```json
{
  "email": "yonetim@cinar.com",
  "password": "Password123!"
}
```

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "token": "sitera_sess_9a8b7c6d5e4f3a2b1c0d",
    "user": {
      "id": "usr-0001-aaaa-bbbb-cccc",
      "groupId": "grp-cinar-0000-0000-0001",
      "name": "Ahmet Yılmaz",
      "email": "yonetim@cinar.com",
      "phone": "0532 555 44 33",
      "role": "admin",
      "units": ["A Blok Daire 5"],
      "residentType": "owner",
      "avatarUrl": "https://sitera-storage.com/avatars/usr-0001.jpg",
      "isActive": true,
      "group": {
        "id": "grp-cinar-0000-0000-0001",
        "name": "Çınar Konutları",
        "slug": "cinar-konutlari",
        "city": "İstanbul",
        "district": "Kadıköy"
      }
    }
  },
  "timestamp": "2026-09-11T12:00:00.000Z"
}
```

---

### 2.2. Aktif Oturumu ve Kullanıcı Profilini Doğrulama (Me)
Uygulama açılırken veya splash ekranında mevcut token'ın geçerliliğini ve kullanıcının güncel rollerini teyit etmek için kullanılır.

- **Yol (Path):** `GET /api/auth/me`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "usr-0001-aaaa-bbbb-cccc",
    "groupId": "grp-cinar-0000-0000-0001",
    "name": "Ahmet Yılmaz",
    "email": "yonetim@cinar.com",
    "phone": "0532 555 44 33",
    "role": "admin",
    "units": ["A Blok Daire 5"],
    "residentType": "owner",
    "avatarUrl": "https://sitera-storage.com/avatars/usr-0001.jpg",
    "isActive": true,
    "group": {
      "id": "grp-cinar-0000-0000-0001",
      "name": "Çınar Konutları",
      "slug": "cinar-konutlari"
    }
  },
  "timestamp": "2026-09-11T12:00:00.000Z"
}
```

---

### 2.3. Çıkış Yapma (Logout)
Kullanıcı "Çıkış Yap" butonuna bastığında çağrılır. Token'ı sunucu tarafında geçersiz kılar ve oturumu sonlandırır.

- **Yol (Path):** `POST /api/auth/logout`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "message": "Başarıyla çıkış yapıldı",
  "data": {
    "loggedOut": true
  },
  "timestamp": "2026-09-11T12:00:00.000Z"
}
```

---

## 3. Modül 2: Mobil Sakin Portalı Uç Noktaları

Bu bölümdeki API'ler, mobil uygulamada **Kat Maliki veya Kiracı (`role: member`)** girişi yapıldığında gösterilecek ekranlar için tasarlanmıştır.

### 3.1. Sakin Borç ve Aidat Listesi
Sakinin kendisine veya dairesine ait ödenmiş, gecikmiş ve bekleyen tüm aidat/demirbaş borçlarını listeler. Gecikme zamları (KMK %5 kanuni faiz) backend tarafından otomatik hesaplanarak döner.

- **Yol (Path):** `GET /api/finance/my-debts`
- **Yetki:** Sakin veya Yönetici
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `x-user-id: <uuid>` (opsiyonel; gönderilmezse query'den alınır)
- **Query Parametreleri:**
  - `userId`: Sakinin kullanıcı ID'si (opsiyonel)
  - `unit`: Daire no filtresi (ör: `A Blok Daire 4`) (opsiyonel)

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "deb-2026-09-101",
      "groupId": "grp-cinar-0000-0000-0001",
      "userId": "usr-sakin-002",
      "periodId": "prd-2026-09",
      "unit": "A Blok Daire 4",
      "residentName": "Mehmet Kaya",
      "title": "Eylül 2026 Olağan Aidatı",
      "category": "dues",
      "targetRole": "resident",
      "amount": 750.00,
      "paidAmount": 0.00,
      "dueDate": "2026-09-15",
      "status": "unpaid",
      "paidDate": null,
      "lateFee": 0.00,
      "overdueDays": 0,
      "totalWithLateFee": 750.00,
      "createdAt": "2026-09-01T00:00:00.000Z",
      "updatedAt": "2026-09-01T00:00:00.000Z"
    },
    {
      "id": "deb-2026-08-101",
      "groupId": "grp-cinar-0000-0000-0001",
      "userId": "usr-sakin-002",
      "periodId": "prd-2026-08",
      "unit": "A Blok Daire 4",
      "residentName": "Mehmet Kaya",
      "title": "Ağustos 2026 Olağan Aidatı",
      "category": "dues",
      "targetRole": "resident",
      "amount": 750.00,
      "paidAmount": 0.00,
      "dueDate": "2026-08-15",
      "status": "overdue",
      "paidDate": null,
      "lateFee": 37.50,
      "overdueDays": 27,
      "totalWithLateFee": 787.50,
      "createdAt": "2026-08-01T00:00:00.000Z",
      "updatedAt": "2026-08-16T00:00:00.000Z"
    }
  ],
  "timestamp": "2026-09-11T12:00:00.000Z"
}
```

---

### 3.2. Site Finans Bilgileri & IBAN Sorgulama
Sakinin banka havalesi / EFT yaparken kullanacağı sitenin resmi birincil banka hesabı ve IBAN bilgisini döner.

- **Yol (Path):** `GET /api/finance/site-info`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "siteName": "Çınar Konutları",
    "bankName": "Ziraat Bankası",
    "accountName": "Çınar Konutları Yöneticiliği",
    "iban": "TR12 0001 0000 1234 5678 9012 34",
    "announcement": "Lütfen EFT açıklamasına mutlaka Blok ve Daire numaranızı yazınız."
  },
  "timestamp": "2026-09-11T12:00:00.000Z"
}
```

---

### 3.3. Dekont / Ödeme Bildirimi Gönderme
Sakin havale/EFT yaptıktan sonra dekont fotoğrafını veya PDF linkini sisteme yükleyerek yönetici onayına sunar.

- **Yol (Path):** `POST /api/finance/payments`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `Content-Type: application/json`

#### İstek Gövdesi (Request Body)
```json
{
  "debtId": "deb-2026-09-101",
  "unit": "A Blok Daire 4",
  "amount": 750.00,
  "channel": "bank_transfer",
  "referenceNo": "EFT-99281742",
  "receiptUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
  "notes": "Eylül aidatı ödendi, dekont ektedir."
}
```
*Not: `receiptUrl` alanına CDN resim linki veya doğrudan kameradan/galeriden alınan Base64 data URI formatında veri verilebilir.*

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "pay-90182",
    "groupId": "grp-cinar-0000-0000-0001",
    "debtId": "deb-2026-09-101",
    "userId": "usr-sakin-002",
    "unit": "A Blok Daire 4",
    "residentName": "Mehmet Kaya",
    "amount": 750.00,
    "channel": "bank_transfer",
    "referenceNo": "EFT-99281742",
    "receiptUrl": "https://sitera-storage.com/receipts/pay-90182.jpg",
    "notes": "Eylül aidatı ödendi, dekont ektedir.",
    "status": "pending",
    "approvedBy": null,
    "approvedAt": null,
    "createdAt": "2026-09-11T12:05:00.000Z",
    "updatedAt": "2026-09-11T12:05:00.000Z"
  }
}
```

---

### 3.4. Hedefli Duyuru Akışı
Yöneticinin yayınladığı duyuruları getirir. Backend, kullanıcının dairesine, bloğuna veya sakin rolüne göre filtreler. Hedefleme harici duyurular sakin ekranına düşmez.

- **Yol (Path):** `GET /api/announcements`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
- **Query Parametreleri:**
  - `userId`: Kullanıcı ID'si (opsiyonel)
  - `userRole`: Kullanıcı rolü (ör: `member`) (opsiyonel)
  - `units`: Kullanıcının daireleri (virgülle ayrılmış: `A Blok Daire 4,B Blok Daire 2`) (opsiyonel)
  - `residentType`: `owner` veya `tenant` (opsiyonel)

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "ann-301",
      "groupId": "grp-cinar-0000-0000-0001",
      "authorId": "usr-0001",
      "authorName": "Ahmet Yılmaz (Yönetici)",
      "title": "A Blok Asansör Revizyonu ve Muayenesi",
      "content": "Değerli sakinlerimiz, 14 Eylül Pazartesi günü 09:00 - 13:00 saatleri arasında A Blok asansörleri yıllık yeşil etiket periyodik muayenesine alınacaktır.",
      "category": "Bakım",
      "isImportant": true,
      "targetScope": "block",
      "targetBlocks": ["A Blok"],
      "targetUnits": [],
      "targetRole": "all",
      "status": "published",
      "publishAt": "2026-09-11T09:00:00.000Z",
      "readCount": 14,
      "totalTargetUnits": 20,
      "readPercentage": 70,
      "createdAt": "2026-09-11T09:00:00.000Z",
      "updatedAt": "2026-09-11T09:00:00.000Z"
    }
  ]
}
```

---

### 3.5. Duyuruyu Okundu Olarak İşaretleme
Sakin duyuru detayına girdiğinde veya bildirim kartını açtığında çağrılır. Bu sayede yönetim panelinde yasal okundu raporu oluşur.

- **Yol (Path):** `POST /api/announcements/:id/read`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "userId": "usr-sakin-002",
  "userName": "Mehmet Kaya",
  "unit": "A Blok Daire 4"
}
```

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "announcementId": "ann-301",
    "userId": "usr-sakin-002",
    "userName": "Mehmet Kaya",
    "unit": "A Blok Daire 4",
    "readAt": "2026-09-11T12:10:00.000Z"
  }
}
```

---

### 3.6. Yeni Arıza / Talep Bildirme (Fotoğraflı)
Sakin tesisat, asansör, güvenlik veya bahçe arızalarını kameradan çekeceği fotoğraflarla yönetime bildirir.

- **Yol (Path):** `POST /api/tickets`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `x-user-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "unit": "A Blok Daire 4",
  "residentName": "Mehmet Kaya",
  "residentPhone": "0532 444 55 66",
  "title": "3. Kat Koridor Lambası Yanmıyor",
  "description": "Sensör devreye girmiyor, akşamları koridor tamamen karanlık kalıyor.",
  "category": "Asansör & Elektrik",
  "location": "A Blok 3. Kat Koridoru",
  "urgency": "normal",
  "photos": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  ]
}
```
*Kategoriler: `'Peyzaj & Bahçe' | 'Asansör & Elektrik' | 'Temizlik & Hijyen' | 'Güvenlik & Kapı' | 'Sıhhi Tesisat' | 'Ortak Alan & Demirbaş' | 'Diğer'`*  
*Aciliyet Seviyeleri: `'low' | 'normal' | 'high' | 'urgent'`*

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "tck-801",
    "groupId": "grp-cinar-0000-0000-0001",
    "userId": "usr-sakin-002",
    "unit": "A Blok Daire 4",
    "residentName": "Mehmet Kaya",
    "residentPhone": "0532 444 55 66",
    "title": "3. Kat Koridor Lambası Yanmıyor",
    "description": "Sensör devreye girmiyor, akşamları koridor tamamen karanlık kalıyor.",
    "category": "Asansör & Elektrik",
    "location": "A Blok 3. Kat Koridoru",
    "urgency": "normal",
    "photos": [
      "https://sitera-storage.com/tickets/tck-801-1.jpg"
    ],
    "status": "open",
    "adminNotes": null,
    "resolvedAt": null,
    "createdAt": "2026-09-11T12:15:00.000Z",
    "updatedAt": "2026-09-11T12:15:00.000Z"
  }
}
```

---

### 3.7. Sakinin Kendi Taleplerini Listelemesi
Sakinin daha önce oluşturduğu arıza bildirimlerini ve yöneticinin girdiği çözüm notlarını listeler.

- **Yol (Path):** `GET /api/tickets`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
- **Query Parametreleri:**
  - `userId`: Kullanıcının kendi ID'si (Zorunlu)
  - `unit`: Daire no (opsiyonel)

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "tck-801",
      "title": "3. Kat Koridor Lambası Yanmıyor",
      "category": "Asansör & Elektrik",
      "status": "resolved",
      "urgency": "normal",
      "adminNotes": "Sensör armatürü yenisiyle değiştirildi, test edildi.",
      "resolvedAt": "2026-09-11T14:30:00.000Z",
      "createdAt": "2026-09-11T12:15:00.000Z"
    }
  ]
}
```

---

### 3.8. Bildirimleri Listeleme
Sakine ait aidat tahakkukları, dekont onayları, arıza çözüm bildirimleri ve genel duyuru uyarılarını listeler.

- **Yol (Path):** `GET /api/notifications`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `x-user-id: <uuid>`
- **Query Parametreleri:**
  - `unreadOnly`: `true` veya `false` (opsiyonel)
  - `type`: `ticket_update | payment_approval | announcement | debt_issued | system` (opsiyonel)
  - `limit`: `20` (varsayılan: 50)
  - `offset`: `0` (sayfalama için)

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-501",
      "groupId": "grp-cinar-0000-0000-0001",
      "userId": "usr-sakin-002",
      "title": "Dekontunuz Onaylandı",
      "message": "Eylül 2026 Aidatınıza ait 750 ₺ tutarındaki banka havalesi onaylandı. Borcunuz kapatılmıştır.",
      "type": "payment_approval",
      "priority": "normal",
      "isRead": false,
      "readAt": null,
      "linkUrl": "/finance/my-debts",
      "metadata": {
        "paymentId": "pay-90182",
        "debtId": "deb-2026-09-101"
      },
      "createdAt": "2026-09-11T12:20:00.000Z"
    }
  ]
}
```

---

### 3.9. Okunmamış Bildirim Rozet Sayısı (Badge Count)
Mobil uygulamanın alt barındaki (Bottom Navigation) çan simgesinde kırmızı rozet sayısı göstermek için kullanılır.

- **Yol (Path):** `GET /api/notifications/unread-count`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `x-user-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

---

### 3.10. Tek Bildirimi Okundu Olarak İşaretleme
- **Yol (Path):** `PATCH /api/notifications/:id/read`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `x-user-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "notif-501",
    "isRead": true,
    "readAt": "2026-09-11T12:25:00.000Z"
  }
}
```

---

### 3.11. Tüm Bildirimleri Okundu Yapma ("Tümünü Okundu Say")
- **Yol (Path):** `PATCH /api/notifications/read-all`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `x-user-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  }
}
```

---

### 3.12. Bildirim Silme
- **Yol (Path):** `DELETE /api/notifications/:id`
- **Yetki:** Oturum Açmış Kullanıcı
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `x-user-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

### 3.13. Halka Açık Yasal Metin Sorgulama (Kullanım Koşulları & KVKK)
Giriş ekranında veya profil/ayarlar menüsünde kullanıcı sözleşmelerini ve KVKK aydınlatma metnini görüntülemek için çağrılır.

- **Yol (Path):** `GET /api/legal/:type`
- **Yetki:** Herkese Açık
- **Parametreler:**
  - `:type`: `terms` (Kullanıcı Sözleşmesi) veya `kvkk` (Aydınlatma Metni)

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "leg-kvkk-01",
    "type": "kvkk",
    "title": "KVKK Aydınlatma Metni",
    "content": "6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, Sitera Site Yönetim Platformu...",
    "version": "2.4",
    "isActive": true,
    "updatedAt": "2026-09-11T08:00:00.000Z"
  },
  "timestamp": "2026-09-11T12:30:00.000Z"
}
```

---

## 4. Modül 3: Mobil Yönetici & Personel Portalı Uç Noktaları

Bu bölümdeki API'ler, mobil uygulamayı **Site Yöneticisi (`role: admin`)**, **Muhasebeci (`role: accountant`)** veya **Teknik Personel (`role: staff`)** olarak kullanan yetkililer içindir.

### 4.1. Finansal KPI Özet Göstergeleri
Yönetici ana sayfasındaki dashboard kartlarını besler. Toplam kasa bakiyesi, bekleyen alacaklar, tahsilat oranı ve bütçe gerçekleşme oranını hesaplanmış olarak döner.

- **Yol (Path):** `GET /api/finance/summary`
- **Yetki:** `finance:view` (`admin`, `accountant`)
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "totalLiquidity": 142500.50,
    "totalReceivable": 18250.00,
    "totalCollected": 124250.50,
    "collectionRate": 87.2,
    "pendingApprovalsCount": 4,
    "activePeriodName": "Eylül 2026 Olağan Aidat",
    "annualBudget": 300000.00,
    "totalExpenses": 84500.00,
    "budgetSpentRate": 28.1,
    "overdueDebtsCount": 6,
    "totalLateFees": 450.00
  }
}
```

---

### 4.2. Onay Bekleyen Dekontlar
Sakinlerin havale yapıp sisteme yüklediği onay bekleyen ödeme bildirimlerini listeler.

- **Yol (Path):** `GET /api/finance/payments/pending`
- **Yetki:** `finance:view` (`admin`, `accountant`)
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "pay-90182",
      "groupId": "grp-cinar-0000-0000-0001",
      "debtId": "deb-2026-09-101",
      "userId": "usr-sakin-002",
      "unit": "A Blok Daire 4",
      "residentName": "Mehmet Kaya",
      "amount": 750.00,
      "channel": "bank_transfer",
      "referenceNo": "EFT-99281742",
      "receiptUrl": "https://sitera-storage.com/receipts/pay-90182.jpg",
      "notes": "Eylül aidatı ödendi, dekont ektedir.",
      "status": "pending",
      "createdAt": "2026-09-11T12:05:00.000Z"
    }
  ]
}
```

---

### 4.3. Dekontu Onaylama
Yönetici dekontu onayladığında; borç statüsü `paid` olur, birincil banka hesabı bakiyesi artar, gelir hareketi işlenir ve sakine anında onay bildirimi gider.

- **Yol (Path):** `POST /api/finance/payments/:id/approve`
- **Yetki:** `finance:approve` (`admin`, `accountant`)
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "approvedBy": "Ahmet Yılmaz (Yönetici)"
}
```

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "paymentId": "pay-90182",
    "status": "approved",
    "approvedBy": "Ahmet Yılmaz (Yönetici)",
    "approvedAt": "2026-09-11T12:35:00.000Z",
    "debtUpdated": true
  }
}
```

---

### 4.4. Dekontu Reddetme
Hatalı, mükerrer veya hesaba geçmeyen dekontları reddeder.

- **Yol (Path):** `POST /api/finance/payments/:id/reject`
- **Yetki:** `finance:approve` (`admin`, `accountant`)
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "paymentId": "pay-90182",
    "status": "rejected"
  }
}
```

---

### 4.5. Elden Nakit Tahsilat Makbuzu Kesme
Sakin aidatı nakit olarak yöneticiye veya kapıcıya teslim ettiğinde makbuz oluşturur. Nakit kasaya otomatik tahsilat girişi yapılır.

- **Yol (Path):** `POST /api/finance/cash-collection`
- **Yetki:** `finance:manage` (`admin`, `accountant`)
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "debtId": "deb-2026-09-105",
  "unit": "B Blok Daire 8",
  "amount": 750.00,
  "residentName": "Kemal Sunal",
  "notes": "Elden nakit makbuz karşılığı teslim alındı."
}
```

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "receiptNo": "NKT-2026-0042",
    "debtId": "deb-2026-09-105",
    "unit": "B Blok Daire 8",
    "amount": 750.00,
    "status": "approved",
    "channel": "cash",
    "collectedAt": "2026-09-11T12:40:00.000Z"
  }
}
```

---

### 4.6. Sakin Tahliyesi ve İbraname İşlemi
Siteden ayrılan kiracı veya evini satan kat malikinin tüm geçmiş borçlarını sıfırlayıp tahliye kaydını ve resmi ibranamesini oluşturur.

- **Yol (Path):** `POST /api/finance/discharge`
- **Yetki:** `finance:manage` (`admin`, `accountant`)
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "userId": "usr-sakin-009",
  "unit": "C Blok Daire 2",
  "dischargeDate": "2026-09-11",
  "notes": "Tüm aidat ve demirbaş bakiyesi sıfırlandı, anahtarlar teslim alındı."
}
```

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "discharged": true,
    "userId": "usr-sakin-009",
    "unit": "C Blok Daire 2",
    "dischargeDate": "2026-09-11",
    "dischargeCertificateNo": "IBR-2026-0019"
  }
}
```

---

### 4.7. Tüm Aidat Dönemlerini Listeleme
- **Yol (Path):** `GET /api/finance/periods`
- **Yetki:** `finance:view`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "prd-2026-09",
      "groupId": "grp-cinar-0000-0000-0001",
      "name": "Eylül 2026 Olağan Aidatı",
      "amount": 750.00,
      "dueDate": "2026-09-15",
      "status": "active",
      "createdAt": "2026-09-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4.8. Yeni Aidat / Demirbaş Dönemi Başlatma
Yeni bir aidat dönemi açar ve opsiyonel olarak sitedeki tüm aktif dairelere anında borç tahakkuku keser.

- **Yol (Path):** `POST /api/finance/periods`
- **Yetki:** `finance:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "name": "Ekim 2026 Olağan Aidatı",
  "amount": 750.00,
  "dueDate": "2026-10-15",
  "category": "dues",
  "calculationMode": "equal",
  "targetRole": "resident",
  "status": "active",
  "generateDebtsForUnits": true
}
```
*Hesaplama Modları: `'equal' (Eşit Dağıtım) | 'share' (Arsa Payına Göre) | 'unit_type' (Oda Sayısına Göre)`*

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "prd-2026-10",
    "groupId": "grp-cinar-0000-0000-0001",
    "name": "Ekim 2026 Olağan Aidatı",
    "amount": 750.00,
    "dueDate": "2026-10-15",
    "status": "active",
    "generatedDebtsCount": 30
  }
}
```

---

### 4.9. Aidat Dönemini Silme
- **Yol (Path):** `DELETE /api/finance/periods/:id`
- **Yetki:** `finance:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

### 4.10. Otomatik Aylık Aidat Üretimi Tetikleme
Her ay başında otomatik çalışan aidat motorunu manuel olarak anında tetikler.

- **Yol (Path):** `POST /api/finance/auto-generate`
- **Yetki:** `finance:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "force": true
}
```

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Otomatik aidat tahakkuku tamamlandı.",
    "periodName": "Ekim 2026",
    "createdDebts": 30
  }
}
```

---

### 4.11. Manuel Daire Borçlandırma (Ceza, Su, Demirbaş vb.)
Belirli bir daireye özel arıza masrafı, gecikme cezası veya ortak alan kullanım bedeli yansıtır.

- **Yol (Path):** `POST /api/finance/debts`
- **Yetki:** `finance:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "unit": "A Blok Daire 4",
  "residentName": "Mehmet Kaya",
  "userId": "usr-sakin-002",
  "title": "Balkon Camı Kırılma Demirbaş Bedeli",
  "category": "fixture",
  "targetRole": "owner",
  "amount": 1200.00,
  "dueDate": "2026-09-30"
}
```

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "deb-manual-991",
    "unit": "A Blok Daire 4",
    "amount": 1200.00,
    "status": "unpaid",
    "createdAt": "2026-09-11T12:45:00.000Z"
  }
}
```

---

### 4.12. Kasa & Banka Hesaplarını Listeleme
Sitenin banka hesapları, nakit kasası ve acil durum fonu hesaplarını güncel bakiyeleriyle döner.

- **Yol (Path):** `GET /api/finance/accounts`
- **Yetki:** `finance:view`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "acc-bank-01",
      "groupId": "grp-cinar-0000-0000-0001",
      "name": "Ziraat Ana Aidat Hesabı",
      "bankName": "Ziraat Bankası",
      "iban": "TR12 0001 0000 1234 5678 9012 34",
      "balance": 128500.50,
      "type": "bank",
      "isPrimary": true,
      "lastActivity": "2026-09-11T12:35:00.000Z"
    },
    {
      "id": "acc-cash-01",
      "groupId": "grp-cinar-0000-0000-0001",
      "name": "Yönetim Nakit Kasası",
      "bankName": "Elden Kasa",
      "iban": null,
      "balance": 14000.00,
      "type": "cash",
      "isPrimary": false,
      "lastActivity": "2026-09-11T12:40:00.000Z"
    }
  ]
}
```

---

### 4.13. Yeni Finans Hesabı / Kasa Açma
- **Yol (Path):** `POST /api/finance/accounts`
- **Yetki:** `finance:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "name": "Garanti Demirbaş Fonu Hesabı",
  "bankName": "Garanti BBVA",
  "iban": "TR99 0006 2000 1111 2222 3333 44",
  "initialBalance": 0.00,
  "type": "reserve",
  "isPrimary": false
}
```

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "acc-reserve-02",
    "name": "Garanti Demirbaş Fonu Hesabı",
    "balance": 0.00,
    "type": "reserve"
  }
}
```

---

### 4.14. Hesaplar Arası Virman / Nakit Çekme & Yatırma
Bankadan nakit kasaya para çekildiğinde veya kasadaki nakit banka hesabına yatırıldığında çağrılır.

- **Yol (Path):** `POST /api/finance/accounts/transfer`
- **Yetki:** `finance:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `x-user-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "fromAccountId": "acc-bank-01",
  "toAccountId": "acc-cash-01",
  "amount": 5000.00,
  "description": "Kapıcı haftalık avansı ve bahçe masrafları için bankadan nakit kasaya çekildi."
}
```

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "transferId": "trf-8812",
    "fromAccountNewBalance": 123500.50,
    "toAccountNewBalance": 19000.00,
    "transferredAt": "2026-09-11T12:50:00.000Z"
  }
}
```

---

### 4.15. Hesap Ekstresi & Hareketler
- **Yol (Path):** `GET /api/finance/accounts/:id/transactions`
- **Yetki:** `finance:view`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "txn-001",
      "accountId": "acc-bank-01",
      "type": "income",
      "amount": 750.00,
      "balanceAfter": 128500.50,
      "title": "A Blok Daire 4 Aidat Tahsilatı",
      "category": "Aidat Geliri",
      "counterparty": "Mehmet Kaya",
      "referenceType": "payment",
      "transactionDate": "2026-09-11T12:35:00.000Z"
    }
  ]
}
```

---

### 4.16. Tüm Finansal Hareketler (Genel Ekstre)
- **Yol (Path):** `GET /api/finance/transactions`
- **Yetki:** `finance:view`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

---

### 4.17. Site Giderleri Listesi
- **Yol (Path):** `GET /api/finance/expenses`
- **Yetki:** `finance:view`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "exp-101",
      "groupId": "grp-cinar-0000-0000-0001",
      "title": "Ortak Alan Elektrik Faturası",
      "vendor": "Enerjisa",
      "category": "Enerji & Yakıt",
      "amount": 8450.00,
      "dueDate": "2026-09-22",
      "status": "unpaid",
      "createdAt": "2026-09-05T00:00:00.000Z"
    }
  ]
}
```

---

### 4.18. Finansal Ayarları Görüntüleme & Güncelleme
Varsayılan aidat tutarı, son ödeme günü, otomatik tahakkuk durumu ve KMK kanuni gecikme faizi ayarları.

- **Görüntüleme:** `GET /api/finance/settings`
- **Güncelleme:** `PATCH /api/finance/settings`
- **Yetki:** `finance:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (PATCH Body)
```json
{
  "defaultDuesAmount": 850.00,
  "duesDueDay": 15,
  "autoGenerateMonthlyDues": true,
  "calculationMode": "equal",
  "lateFeeEnabled": true,
  "lateFeeRate": 5,
  "annualBudget": 350000.00
}
```

---

### 4.19. Yönetici Arıza ve Bakım Talepleri Listesi
Tüm sitedeki açık, devam eden ve çözülmüş arıza taleplerini personel ataması ve durum yönetimi için getirir.

- **Yol (Path):** `GET /api/tickets?isStaff=true`
- **Yetki:** `tickets:view` (`admin`, `staff`)
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

---

### 4.20. Talep Durumu Güncelleme & Çözüm Notu Ekleme
- **Yol (Path):** `PATCH /api/tickets/:id/status`
- **Yetki:** `tickets:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`
  - `x-user-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "status": "resolved",
  "adminNotes": "Sensör armatürü yenisiyle değiştirildi, aydınlatma test edildi."
}
```
*Statüler: `'open' | 'in_progress' | 'resolved' | 'closed'`*

---

### 4.21. Arıza Talebini Silme
- **Yol (Path):** `DELETE /api/tickets/:id`
- **Yetki:** `tickets:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

---

### 4.22. Yeni Hedeflemeli Duyuru Yayınlama
Yönetici tüm siteye veya sadece belirli bir blok/daireye özel duyuru yayınlar.

- **Yol (Path):** `POST /api/announcements`
- **Yetki:** `announcements:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "title": "A Blok Asansör Revizyonu ve Muayenesi",
  "content": "Değerli sakinlerimiz, 14 Eylül Pazartesi günü 09:00 - 13:00 saatleri arasında A Blok asansörleri periyodik muayeneye alınacaktır.",
  "category": "Bakım",
  "isImportant": true,
  "targetScope": "block",
  "targetBlocks": ["A Blok"],
  "targetUnits": [],
  "targetRole": "all",
  "status": "published"
}
```
*`targetScope`: `'all' (Tüm Site) | 'block' (Belirli Bloklar) | 'unit' (Belirli Daireler) | 'role' (Yalnızca Ev Sahibi / Kiracı)`*

---

### 4.23. Duyuru Okunma İstatistikleri & Dökümü
Duyurunun hangi daireler tarafından ne zaman okunduğunu, hangi dairelerin henüz okumadığını yasal rapor olarak döner.

- **Yol (Path):** `GET /api/announcements/:id/reads`
- **Yetki:** `announcements:view`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "totalTargetUnits": 20,
    "readCount": 14,
    "readPercentage": 70.0,
    "reads": [
      {
        "userId": "usr-sakin-002",
        "userName": "Mehmet Kaya",
        "unit": "A Blok Daire 4",
        "readAt": "2026-09-11T12:10:00.000Z"
      }
    ],
    "unreadUnits": ["A Blok Daire 1", "A Blok Daire 7", "A Blok Daire 12"]
  }
}
```

---

### 4.24. Duyuruyu Silme
- **Yol (Path):** `DELETE /api/announcements/:id`
- **Yetki:** `announcements:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

---

### 4.25. Sitedeki Kullanıcıları Listeleme
- **Yol (Path):** `GET /api/users`
- **Yetki:** `users:view`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "usr-sakin-002",
      "groupId": "grp-cinar-0000-0000-0001",
      "name": "Mehmet Kaya",
      "email": "mehmet@cinar.com",
      "phone": "0532 444 55 66",
      "role": "member",
      "units": ["A Blok Daire 4"],
      "residentType": "owner",
      "isActive": true,
      "createdAt": "2026-01-10T00:00:00.000Z"
    }
  ]
}
```

---

### 4.26. Tek Kullanıcı Detayı
- **Yol (Path):** `GET /api/users/:id`
- **Yetki:** `users:view`

---

### 4.27. Yeni Kullanıcı / Daire Sakini Ekleme
- **Yol (Path):** `POST /api/users`
- **Yetki:** `users:manage`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### İstek Gövdesi (Request Body)
```json
{
  "name": "Zeynep Arslan",
  "email": "zeynep@cinar.com",
  "phone": "0533 888 77 66",
  "password": "ZeynepPass2026!",
  "role": "member",
  "units": ["B Blok Daire 6"],
  "residentType": "tenant"
}
```

---

### 4.28. Toplu Daire / Sakin Oluşturma (Bulk Upload)
Mobil kurulum sihirbazı veya toplu içe aktarma sırasında dizi formatında birden fazla sakini tek istekte ekler.

- **Yol (Path):** `POST /api/users/bulk`
- **Yetki:** `users:manage`
- **İstek Gövdesi:** `CreateUserDto[]` dizi formatında.

---

### 4.29. Kullanıcı Bilgilerini Güncelleme
- **Yol (Path):** `PATCH /api/users/:id`
- **Yetki:** `users:manage`

#### İstek Gövdesi (Request Body)
```json
{
  "name": "Mehmet Zeki Kaya",
  "phone": "0532 999 88 77",
  "isActive": true
}
```

---

### 4.30. Kullanıcı Silme
- **Yol (Path):** `DELETE /api/users/:id`
- **Yetki:** `users:manage`

---

### 4.31. Yönetim Kurulu Resmi Bilanço & Rapor Paketi
Gelir-Gider Tablosu, Mizan, Bilanço ve Bütçe Gerçekleşme verilerini tek pakette döner.

- **Yol (Path):** `GET /api/finance/reports?periodId=<uuid>&year=2026`
- **Yetki:** `reports:view`
- **Başlıklar:**
  - `Authorization: Bearer <token>`
  - `x-group-id: <uuid>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "siteName": "Çınar Konutları",
    "periodName": "Eylül 2026",
    "asOfDate": "2026-09-11",
    "kpis": {
      "totalLiquidity": 142500.50,
      "totalReceivable": 18250.00,
      "totalCollected": 124250.50,
      "totalExpenses": 84500.00,
      "netSurplus": 39750.50,
      "collectionRate": 87.2,
      "budgetSpentRate": 28.1,
      "annualBudget": 300000.00
    },
    "incomeExpense": {
      "totalAccruedIncome": 142500.00,
      "totalCollectedIncome": 124250.50,
      "totalExpense": 84500.00,
      "netCashSurplus": 39750.50
    },
    "trialBalance": {
      "totalDebit": 250000.00,
      "totalCredit": 250000.00,
      "isBalanced": true
    },
    "balanceSheet": {
      "totalAssets": 160750.50,
      "totalLiabilitiesAndEquity": 160750.50,
      "isBalanced": true
    }
  }
}
```

---

## 5. Modül 4: Platform Yönetimi & Süper Admin Uç Noktaları

Bu bölümdeki API'ler, tüm siteleri yöneten **Süper Admin (`role: superadmin`)** ve platform destek ekipleri için geliştirilmiştir.

### 5.1. Tüm Siteleri Listeleme
- **Yol (Path):** `GET /api/groups`
- **Yetki:** `superadmin` (veya normal kullanıcı kendi grubunu görür)
- **Başlıklar:**
  - `Authorization: Bearer <token>`

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "grp-cinar-0000-0000-0001",
      "name": "Çınar Konutları",
      "slug": "cinar-konutlari",
      "plan": "pro",
      "city": "İstanbul",
      "district": "Kadıköy",
      "totalUnits": 30,
      "unitFee": 750.00,
      "monthlyFee": 22500.00,
      "subscriptionStatus": "active",
      "trialEndsAt": "2026-12-31T00:00:00.000Z",
      "licenseExpiresAt": "2027-09-01T00:00:00.000Z",
      "isFrozen": false,
      "modules": [
        {
          "moduleCode": "ANPR_PLATE_RECOGNITION",
          "status": "active",
          "activatedAt": "2026-09-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

### 5.2. Tek Site Detayı
- **Yol (Path):** `GET /api/groups/:id`
- **Yetki:** `superadmin` veya İlgili Site Yöneticisi

---

### 5.3. Yeni Site / Kiracı (Tenant) Oluşturma
- **Yol (Path):** `POST /api/groups`
- **Yetki:** `superadmin`

#### İstek Gövdesi (Request Body)
```json
{
  "name": "Palmiye Evleri",
  "slug": "palmiye-evleri",
  "plan": "starter",
  "city": "İzmir",
  "district": "Karşıyaka",
  "totalUnits": 24,
  "unitFee": 650.00,
  "monthlyFee": 15600.00,
  "billingCycle": "monthly",
  "subscriptionStatus": "trial"
}
```

---

### 5.4. Site Bilgilerini Güncelleme
- **Yol (Path):** `PATCH /api/groups/:id`
- **Yetki:** `superadmin`

---

### 5.5. Site Silme
- **Yol (Path):** `DELETE /api/groups/:id`
- **Yetki:** `superadmin`

---

### 5.6. Lansman Deneme Süresi Tanımlama (Trial)
- **Yol (Path):** `POST /api/groups/:id/trial`
- **Yetki:** `superadmin`

#### İstek Gövdesi (Request Body)
```json
{
  "months": 3
}
```

---

### 5.7. Lisans Süresi Uzatma (Extend)
- **Yol (Path):** `POST /api/groups/:id/extend`
- **Yetki:** `superadmin`

#### İstek Gövdesi (Request Body)
```json
{
  "months": 12
}
```

---

### 5.8. Siteyi Dondurma / Askıya Alma (Freeze)
Ödeme yapmayan veya yasal sorun yaşayan bir sitenin tüm kullanıcılarını salt okunur moda alır veya sistemi kapatır.

- **Yol (Path):** `POST /api/groups/:id/freeze`
- **Yetki:** `superadmin`

#### İstek Gövdesi (Request Body)
```json
{
  "isFrozen": true,
  "reason": "Yıllık SaaS lisans ödemesi 30 gündür gecikmede."
}
```

---

### 5.9. Akıllı Modül Kataloğu (Donanım & Yazılım Pazaryeri)
Sistemde mevcut olan akıllı eklentileri (Plaka Tanıma, Akıllı Diyafon, Havuz/Tesis Rezervasyonu) listeler.

- **Yol (Path):** `GET /api/groups/modules/catalog`
- **Yetki:** Herkese Açık / Oturum Açmış Kullanıcı

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "code": "ANPR_PLATE_RECOGNITION",
      "name": "Plaka Tanıma Sistemi (ANPR)",
      "category": "security",
      "pricingModel": "per_unit",
      "defaultPrice": 5.00,
      "shortDescription": "Kamera entegrasyonuyla otomatik bariyer açma."
    },
    {
      "code": "SMART_INTERCOM",
      "name": "Akıllı İnterkom & Görüntülü Diyafon",
      "category": "access",
      "pricingModel": "per_unit",
      "defaultPrice": 4.00,
      "shortDescription": "Cep telefonundan kapı zili yanıtlama ve kapı açma."
    },
    {
      "code": "FACILITY_RESERVATION",
      "name": "Sosyal Tesis & Havuz Rezervasyonu",
      "category": "amenities",
      "pricingModel": "flat_monthly",
      "defaultPrice": 250.00,
      "shortDescription": "Sakinlerin randevu ile tesis rezerve etmesi."
    }
  ]
}
```

---

### 5.10. Sitenin Aktif Modüllerini Getirme
- **Yol (Path):** `GET /api/groups/:id/modules`
- **Yetki:** `superadmin` veya Site Yöneticisi

---

### 5.11. Modül Açma / Kapatma (Toggle)
- **Yol (Path):** `POST /api/groups/:id/modules/toggle`
- **Yetki:** `superadmin`

#### İstek Gövdesi (Request Body)
```json
{
  "moduleCode": "ANPR_PLATE_RECOGNITION",
  "status": "active",
  "durationDays": 30,
  "customPrice": 5.00
}
```

---

### 5.12. Modüle Abone Olma (Site Yöneticisi Talebi)
- **Yol (Path):** `POST /api/groups/:id/modules/subscribe`
- **Yetki:** Site Yöneticisi veya `superadmin`

#### İstek Gövdesi (Request Body)
```json
{
  "moduleCode": "SMART_INTERCOM",
  "isTrial": true
}
```

---

### 5.13. Site Yasal Veri Dışa Aktarma (Export)
Sitenin tüm sakin, borç, kasa ve arıza kayıtlarını tek bir JSON arşivi halinde döner.

- **Yol (Path):** `GET /api/groups/:id/export`
- **Yetki:** `superadmin` veya Site Yöneticisi

---

### 5.14. Destek Taleplerini Listeleme
- **Yol (Path):** `GET /api/support/tickets`
- **Yetki:** `superadmin` veya Site Yöneticisi

---

### 5.15. Destek Talebi Detayı
- **Yol (Path):** `GET /api/support/tickets/:id`

---

### 5.16. Yeni Destek Talebi Açma (KVKK Yetkilendirmeli)
Site yöneticisi platform destek ekibinden teknik destek talep ederken KVKK gereğince geçici site erişim izni (`allowSiteAccess: true`) verir.

- **Yol (Path):** `POST /api/support/tickets`

#### İstek Gövdesi (Request Body)
```json
{
  "groupId": "grp-cinar-0000-0000-0001",
  "creatorUserId": "usr-0001",
  "creatorName": "Ahmet Yılmaz",
  "creatorEmail": "yonetim@cinar.com",
  "creatorPhone": "0532 555 44 33",
  "subject": "Banka Entegrasyonunda Hata Kodu 102",
  "category": "finance_error",
  "priority": "high",
  "initialMessage": "Ziraat Bankası API entegrasyonunda ödemeler güncellenmiyor.",
  "allowSiteAccess": true
}
```
*Kategoriler: `'finance_error' | 'access_hardware' | 'resident_data' | 'system_bug' | 'general'`*

---

### 5.17. Destek Talebine Mesaj Yazma
- **Yol (Path):** `POST /api/support/tickets/:id/messages`

#### İstek Gövdesi (Request Body)
```json
{
  "senderRole": "tenant_admin",
  "senderName": "Ahmet Yılmaz",
  "senderUserId": "usr-0001",
  "content": "Ekran görüntüsü ektedir, lütfen inceler misiniz?",
  "attachments": ["https://sitera-storage.com/attachments/err.png"]
}
```

---

### 5.18. Destek Talebi Durumunu Güncelleme
- **Yol (Path):** `PATCH /api/support/tickets/:id/status`

#### İstek Gövdesi (Request Body)
```json
{
  "status": "resolved"
}
```
*Statüler: `'open' | 'in_progress' | 'waiting_admin_action' | 'resolved' | 'closed'`*

---

### 5.19. Süper Admin Canlı Müdahale (Impersonation)
Süper admin, site yöneticisinin KVKK onayı verdiği destek talebi üzerinden siteye canlı geçici oturumla bağlanır.

- **Yol (Path):** `POST /api/support/tickets/:id/impersonate`
- **Yetki:** `superadmin`

---

### 5.20. Canlı Müdahaleden Güvenli Çıkış
- **Yol (Path):** `POST /api/support/tickets/:id/exit`
- **Yetki:** `superadmin`

---

### 5.21. Tüm Yasal Metinleri Listeleme (Admin)
- **Yol (Path):** `GET /api/legal/admin/all`
- **Yetki:** `superadmin`

---

### 5.22. Yasal Metin Güncelleme (Terms / KVKK)
- **Yol (Path):** `PUT /api/legal/:type`
- **Yetki:** `superadmin`

#### İstek Gövdesi (Request Body)
```json
{
  "title": "KVKK Aydınlatma Metni",
  "content": "Güncellenmiş yeni kanun metni detayları...",
  "version": "2.5",
  "isActive": true
}
```

---

### 5.23. Yasal Metni Fabrika Ayarlarına Döndürme
- **Yol (Path):** `POST /api/legal/admin/reset/:type`
- **Yetki:** `superadmin`

---

### 5.24. Denetim (Audit) Günlüklerini Listeleme
Kim, ne zaman, hangi IP'den, hangi işlemi yaptı? (Güvenlik ve KVKK izleme).

- **Yol (Path):** `GET /api/audit-logs`
- **Yetki:** `audit:view` (`superadmin`, `admin`, `auditor`)
- **Query Parametreleri:**
  - `category`: `AUTH | FINANCE | EXPENSE | TICKET | USER | ANNOUNCEMENT | SECURITY`
  - `search`: Arama kelimesi (ör: `admin`)
  - `limit`: Varsayılan 100

#### Başarılı Yanıt (200 OK)
```json
{
  "id": "log-7712",
  "groupId": "grp-cinar-0000-0000-0001",
  "action": "PAYMENT_APPROVED",
  "category": "FINANCE",
  "level": "INFO",
  "resource": "pay-90182",
  "details": { "amount": 750.00, "unit": "A Blok Daire 4" },
  "ipAddress": "88.241.10.42",
  "userAgent": "SiteraMobile/1.0.0 iOS",
  "createdAt": "2026-09-11T12:35:00.000Z"
}
```

---

### 5.25. Manuel Denetim Kaydı Ekleme
- **Yol (Path):** `POST /api/audit-logs`

#### İstek Gövdesi (Request Body)
```json
{
  "action": "MOBILE_APP_CRASH_REPORT",
  "category": "SECURITY",
  "level": "WARN",
  "resource": "AuthFlow",
  "details": { "device": "iPhone 15 Pro", "os": "iOS 18.1", "error": "NetworkTimeout" }
}
```

---

### 5.26. Sistem Karşılama ve Versiyon
- **Yol (Path):** `GET /api`
- **Yetki:** Herkese Açık

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Sitera Multi-Tenant API is live and healthy",
    "project": "Sitera Site Yönetim Platformu",
    "tenancyModel": "Row-Level Security Multi-Tenancy (Group Isolation)"
  },
  "timestamp": "2026-09-11T13:00:00.000Z"
}
```

---

### 5.27. Sistem Sağlık Durumu (Healthcheck)
Uygulama açılışında sunucu ve veritabanı durumunu kontrol etmek için kullanılır.

- **Yol (Path):** `GET /api/health`
- **Yetki:** Herkese Açık

#### Başarılı Yanıt (200 OK)
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-09-11T13:00:00.000Z",
    "uptime": 178920.45,
    "environment": "production",
    "database": "PostgreSQL 16 Connected",
    "redis": "Bypass (Memory Mode)"
  },
  "timestamp": "2026-09-11T13:00:00.000Z"
}
```

---

### 5.28. Prometheus Metrikleri
- **Yol (Path):** `GET /api/metrics`
- **Format:** `text/plain`

---

## 6. Tip & Enum Referans Sözlüğü

Mobil ekibin modellerini (TypeScript Interface / Dart Class / Swift Struct) birebir oluşturabilmesi için paylaşılan tipler:

### 6.1. Kullanıcı Rolleri (`UserRole`)
```typescript
type UserRole =
  | 'superadmin' // Platform Sahibi & Süper Yönetici
  | 'admin'      // Site Yöneticisi / Yönetim Kurulu Başkanı
  | 'accountant' // Mali Müşavir / Muhasebeci
  | 'auditor'    // Denetim Kurulu Üyesi
  | 'security'   // Güvenlik Görevlisi / Danışma
  | 'staff'      // Teknik Personel / Kapıcı / Bahçıvan
  | 'member'     // Kat Maliki / Kiracı / Sakin
  | 'editor'     // Site Editörü / Halkla İlişkiler
  | 'guest';     // Misafir / Ziyaretçi
```

### 6.2. Sakin Tipi (`ResidentType`)
```typescript
type ResidentType = 'owner' | 'tenant' | 'both';
// owner: Ev Sahibi (Kat Maliki)
// tenant: Kiracı
// both: Hem Ev Sahibi Hem Oturan
```

### 6.3. Borç ve Ödeme Durumları
```typescript
type DebtCategory = 'dues' | 'fixture' | 'penalty' | 'other';
// dues: Olağan Aidat
// fixture: Demirbaş / Yatırım
// penalty: Gecikme Cezası
// other: Diğer Hizmet Bedelleri

type DebtStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';
// unpaid: Ödenmedi
// partial: Kısmi Ödendi
// paid: Tamamen Ödendi
// overdue: Vadesi Geçti (KMK %5 gecikme faizi işler)

type PaymentChannel = 'bank_transfer' | 'credit_card' | 'cash';
// bank_transfer: Havale / EFT (Dekont yüklenir)
// credit_card: Sanal POS (Anında onaylanır)
// cash: Elden Nakit Makbuz Karşılığı

type PaymentStatus = 'pending' | 'approved' | 'rejected';
// pending: Yönetici Onayı Bekliyor
// approved: Onaylandı, Kasa/Banka Bakiyesine Eklendi
// rejected: Reddedildi
```

### 6.4. Arıza & Talep Tipleri
```typescript
type TicketCategory =
  | 'Peyzaj & Bahçe'
  | 'Asansör & Elektrik'
  | 'Temizlik & Hijyen'
  | 'Güvenlik & Kapı'
  | 'Sıhhi Tesisat'
  | 'Ortak Alan & Demirbaş'
  | 'Diğer';

type TicketUrgency = 'low' | 'normal' | 'high' | 'urgent';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
```

### 6.5. Duyuru Tipleri
```typescript
type AnnouncementCategory =
  | 'Bakım'
  | 'Aidat'
  | 'Genel'
  | 'Toplantı'
  | 'Acil'
  | 'Kesinti';

type AnnouncementTargetScope = 'all' | 'block' | 'unit' | 'role';
type AnnouncementStatus = 'published' | 'scheduled' | 'draft' | 'archived';
```

### 6.6. Bildirim Tipleri
```typescript
type NotificationType =
  | 'ticket_update'     // Arıza talebinde durum değişti / çözüm notu girildi
  | 'payment_approval'  // Dekontunuz onaylandı / reddedildi
  | 'announcement'      // Yeni duyuru yayınlandı
  | 'debt_issued'       // Yeni aidat borcu tahakkuk etti
  | 'system';           // Sistem / bakım uyarısı
```

### 6.7. Akıllı IoT Modül Kodları
```typescript
type PlatformModuleCode =
  | 'ANPR_PLATE_RECOGNITION' // Plaka Tanıma & Bariyer Entegrasyonu
  | 'GUEST_QR_PASS'          // Tek Seferlik Misafir QR Geçiş İzni
  | 'SMART_INTERCOM'         // Akıllı İnterkom & Uzaktan Kapı Açma
  | 'FACILITY_RESERVATION'   // Tesis & Havuz Rezervasyon Yönetimi
  | 'VALET_PARKING';         // Vale & Otopark Yönetimi
```

---

## 7. Mobil Ekip İçin Kontrol Listesi (Checklist)

- [x] **Canlı URL Yapılandırıldı mı?** `https://sitera-api.onrender.com/api`
- [x] **Interceptor Eklendi mi?** `Authorization: Bearer <token>`, `x-group-id: <user.groupId>`, `x-user-id: <user.id>`
- [x] **Giriş (Login) Akışı:** Sakin mi yoksa Yönetici mi olduğu `user.role` kontrol edilerek doğru tab bar yükleniyor mu?
- [x] **Borç Ödeme:** Sakin dekont yüklediğinde `POST /api/finance/payments` ile resim Base64 veya dosya yolu olarak iletiliyor mu?
- [x] **Duyuru Okundu Takibi:** Sakin duyuruyu açtığında `POST /api/announcements/:id/read` çağrılarak okundu bilgisi kaydediliyor mu?
- [x] **Arıza Bildirimi:** Sakin fotoğraf çekerek `POST /api/tickets` ile aciliyet seviyesi belirterek talep oluşturabiliyor mu?
- [x] **Bildirim Sayacı:** `GET /api/notifications/unread-count` ile rozet sayısı periyodik veya push notification ile yenileniyor mu?

---
*Sitera API v3.0 — Mobil ve Web platformları için üretim ortamı (Production-Grade) şartlarına tam uyumludur.*
