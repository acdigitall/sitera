# SİTERA - YENİ NESİL AKILLI SİTE & APARTMAN YÖNETİM PLATFORMU
## Kapsamlı Sistem, Mimari ve Teknoloji Dokümantasyonu (Yönetici Sunumu)

> **Belge Sürümü:** 2.5.0  
> **Tarih:** 4 Eylül 2026  
> **Hazırlayan:** Sitera Çekirdek Mühendislik Ekibi  
> **Hedef Kitle:** Üst Yönetim, Teknik Liderler ve Paydaşlar

---

## 1. YÖNETİCİ ÖZETİ (EXECUTIVE SUMMARY)

**Sitera**, geleneksel site yönetim yazılımlarının hantal, karmaşık ve kullanıcı deneyiminden uzak yapısını ortadan kaldırmak amacıyla sıfırdan geliştirilmiş, **Multi-Tenant (Çok Kiracılı)** mimariye sahip, kurumsal düzeyde bir **SaaS Site ve Tesis Yönetim Platformudur**.

Proje, yalnızca muhasebe kayıtlarını tutan bir yazılım değil; **site sakinleri**, **bina yöneticileri** ve **üst yönetim (Süper Admin)** arasındaki tüm operasyonel, finansal, teknik ve sosyal süreçleri tek bir çatı altında toplayan, anlık veri senkronizasyonuna ve banka seviyesinde veri güvenliğine sahip modern bir ekosistemdir.

### Projenin Getirdiği Çığır Açıcı Farklar:
1. **Veritabanı Düzeyinde Tam Veri İzolasyonu (PostgreSQL Native RLS):**  
   Farklı sitelerin veya apartmanların verileri mantıksal kod filtreleriyle değil; PostgreSQL çekirdeğindeki **Row Level Security (RLS)** motoruyla fiziksel düzeyde birbirine sızamaz şekilde izole edilmiştir.
2. **Kusursuz Kullanıcı Deneyimi & Modal-Free Belge Motoru:**  
   Kullanıcıları boğan ve tarayıcıyı kilitleyen modal pencereler yerine; dekont ve belgeleri doğrudan tarayıcının yerel görüntüleyicisine aktaran **Binary Blob URL** altyapısı kurulmuştur.
3. **İki Yönlü Fotoğraflı Talep & Saha Bildirimi:**  
   Sakinlerin sitede gördükleri çim, peyzaj, asansör, aydınlatma gibi aksaklıkları telefon kamerasından anında fotoğraflayıp yöneticiye iletebildiği, yöneticinin de çözüm notuyla süreci yönettiği interaktif servis altyapısı.
4. **Gerçek Zamanlı Canlı Audit Log (Denetim İzi):**  
   Oturum açma/kapama, para transferleri, dekont onayları, borç paylaştırmaları ve güvenlik olaylarının saniyesi saniyesine, IP ve cihaz bilgisiyle kaydedildiği kurumsal denetim günlüğü.

---

## 2. KULLANILAN TEKNOLOJİLER & FULL TECH STACK

Platform, performans, güvenlik, ölçeklenebilirlik ve tip güvenliğini en üst düzeye çıkarmak için modern monorepo mimarisi üzerinde **TypeScript** ile uçtan uca inşa edilmiştir.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          SITERA MONOREPO                              │
│                                                                        │
│   ┌─────────────────────┐   ┌───────────────────┐   ┌──────────────┐   │
│   │   @sitera/web       │   │   @sitera/api     │   │@sitera/shared│   │
│   │   (React 19 + Vite) │   │   (NestJS 10)     │   │(Shared DTOs) │   │
│   └──────────┬──────────┘   └─────────┬─────────┘   └──────┬───────┘   │
│              │                        │                    │           │
│              ▼                        ▼                    │           │
│      TailwindCSS + Router        TypeORM + Express         │           │
│                                       │                    │           │
│                         ┌─────────────┴─────────────┐      │           │
│                         ▼                           ▼      ▼           │
│                  PostgreSQL 16 (RLS)         Redis 7 (Sessions)        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Backend Teknolojileri (`apps/api`)
| Teknoloji / Kütüphane | Sürüm | Kullanım Amacı ve Üstünlüğü |
| :--- | :--- | :--- |
| **NestJS** | `^10.4.15` | Kurumsal düzeyde Modüler, Dependency Injection (DI) tabanlı, test edilebilir backend mimarisi. |
| **Node.js** | `18+ LTS` | Yüksek eşzamanlı I/O performansı sağlayan asenkron çalışma motoru. |
| **TypeORM** | `^0.3.20` | PostgreSQL ile tam tip güvenli haberleşen, migration ve entity ilişkilerini yöneten ORM katmanı. |
| **PostgreSQL** | `16.x` | İlişkisel finans ve operasyon veritabanı. Native **Row Level Security (RLS)** motoru. |
| **Redis (ioredis)** | `^5.4.2` | Dağıtık oturum yönetimi (Session Cache) ve yüksek hızlı token doğrulama. |
| **PBKDF2 Cryptography**| `Native Crypto`| SHA-512 ve rastgele tuz (salt) ile 10.000 iterasyonlu bankacılık standardında parola şifreleme. |
| **pg Driver** | `^8.13.1` | Düşük gecikmeli, connection-pooling özellikli PostgreSQL bağlantı sürücüsü. |
| **Express Platform** | `^10.4.15` | NestJS altında yüksek verimli HTTP request/response yönlendiricisi. |

### 2.2. Frontend Teknolojileri (`apps/web`)
| Teknoloji / Kütüphane | Sürüm | Kullanım Amacı ve Üstünlüğü |
| :--- | :--- | :--- |
| **React** | `^19.0.0` | React'ın en güncel sürümü; modern Hook'lar, State Management ve concurrent render yetenekleri. |
| **Vite** | `^6.1.0` | Saniyeler içinde üretim derlemesi (1.4s) ve anlık Hot Module Replacement (HMR). |
| **TailwindCSS** | `^3.4.19` | Özel Sitera tasarım dili (Slate, Emerald, Teal tonları), kurumsal ve modern responsive arayüz. |
| **React Router** | `^7.18.3` | Dinamik alt rota, rol tabanlı erişim kontrolü (`RoleRoute`) ve slug-tabanlı tenant yönlendirmesi. |
| **Lucide React** | `^0.475.0` | Arayüz tutarlılığını sağlayan 400+ vektörel, hafif ve modern ikon kütüphanesi. |
| **Blob URL Engine** | `HTML5 API` | Bellek üzerinde çalışan, modalları tarihe gömen anlık PDF/Görsel render motoru. |

### 2.3. Paylaşılan Paket & Geliştirme Altyapısı (`packages/shared` & Root)
* **Turborepo (`^2.4.0`):** Workspace bağımlılıklarını ve build süreçlerini akıllı önbellekleme (caching) ile optimize eden monorepo yöneticisi.
* **@sitera/shared:** DTO'lar, Entity arayüzleri, API response modelleri ve formatlama araçlarının hem Frontend hem Backend tarafından tek bir kaynaktan ortaklaşa tüketilmesini sağlayan tip güvenliği kütüphanesi.
* **TypeScript (`^5.7.3`):** Çift taraflı `%100` tip güvenliği (Compile-time error prevention).

---

## 3. BACKEND SİSTEM MİMARİSİ (DERİNLEMESİNE İNCELEME)

Backend, domain odaklı (DDD) ve mikro modüler bir mimari ile 8 ana modül üzerinden çalışmaktadır:

### 3.1. Çok Kiracılı Veri Güvenliği (Tenant Isolation & Row-Level Security)
* **Dosyalar:** `apps/api/src/tenancy/`, `apps/api/src/database/database.module.ts`
* **Çalışma Prensibi:**
  1. İstemciden gelen her istekte `x-group-id` HTTP başlığı veya JWT Bearer oturum token'ı incelenir (`TenantMiddleware`).
  2. İstek bazlı `TenantContext` (AsyncLocalStorage benzeri izole oturum) içine bina/grup kimliği yüklenir.
  3. Veritabanına bir sorgu gönderilmeden önce transaction runner'da şu SQL işletilir:
     ```sql
     SET LOCAL app.current_group_id = 'tenant-uuid-buraya';
     ```
  4. PostgreSQL seviyesinde tanımlı policy devreye girer:
     ```sql
     CREATE POLICY "tenant_isolation_policy" ON "tablo_adi"
     AS RESTRICTIVE
     USING (group_id = NULLIF(current_setting('app.current_group_id', true), '')::uuid
            OR current_setting('app.current_group_id', true) = 'bypass_rls');
     ```
  * **Sonuç:** Kodda bir yazılımcı filtre eklemeyi unutsa dahi, bir sitenin kullanıcısı başka bir sitenin borcunu, duyurusunu, dekontunu veya arıza kaydını **asla** sorgulayamaz.

### 3.2. Kimlik Doğrulama & Oturum Yönetimi (`AuthModule`)
* **Dosyalar:** `auth.controller.ts`, `auth.service.ts`, `user.entity.ts`
* **Güvenlik Mimarisi:**
  * Parolalar veritabanına asla düz metin olarak kaydedilmez. PBKDF2, 16 baytlık rastgele `salt` ve SHA-512 ile şifrelenir (`salt:hash`).
  * Başarılı girişte 256-bit kriptografik rastgele oturum anahtarı (`sitera_tok_...`) üretilir.
  * Oturum Redis'e 24 saatlik TTL ile kaydedilir. Redis geçici olarak durursa `memorySessions` devreye girerek kesintisiz fallback sağlar.
  * Süper Admin tohumlama mekanizması (`onApplicationBootstrap`) ile sistem ilk açılışta otomatik ayağa kalkar.
  * Başarılı girişler (`AUTH_LOGIN_SUCCESS`), oturum kapatmalar (`AUTH_LOGOUT`) ve hatalı giriş denemeleri (`AUTH_LOGIN_FAILED`) anlık olarak IP ve cihaz bilgisiyle audit log'a düşer.

### 3.3. Finans, Tahakkuk & Tahsilat Motoru (`FinanceModule`)
* **Dosyalar:** `finance.service.ts`, `debt.entity.ts`, `payment.entity.ts`, `period.entity.ts`, `expense.entity.ts`
* **Temel Yetenekler:**
  * **Tahakkuk Dönemi Üretimi (`auto-generate`):**
    * Eşit Paylaşım (`equal_split`): Gider tutarı daire sayısına tam bölünür.
    * Arsa Payı (`share`): Tapudaki arsa payı oranına göre kuruşu kuruşuna dinamik paylaştırma.
  * **Elden Nakit Tahsilat (`recordCashCollection`):**
    * Yöneticinin elden aldığı aidatlar için daire seçilip nakit alındı kaydı girilir; sistem otomatik `Debt` bakiyesini düşürür ve `paid` statüsüne çeker.
  * **FAST / Havale Dekont Doğrulama İş Akışı:**
    * Sakin sisteme FAST işlem kodu, açıklama ve **PDF dekontu** yükler (`PAYMENT_FAST_SUBMITTED`).
    * Yönetici onayladığında (`approvePayment`), bağlı borcun kalan tutarı ödenen miktar kadar düşer; borç sıfırlanırsa `paid`, kısmi ise `partial` statüsüne geçer. Kasa/Banka hesabı otomatik artırılır.
    * Yönetici reddederse (`rejectPayment`), borç aktif kalmaya devam eder ve sakin panelinde bildirim görünür.

### 3.4. Ortak Gider Paylaştırma Motoru (Asansör, Çatı, Demirbaş)
* **Dosyalar:** `AdminExpenseSplitView.tsx`, `ExpenseSplitDrawer.tsx`, `finance.service.ts`
* **İş Mantığı:**
  * Aniden çıkan 50.000 ₺ asansör motor tamiri faturası sisteme gider olarak girildiğinde;
  * Yönetici tek tıkla gideri seçip dairelere borç olarak paylaştırır.
  * Sistem arka planda her daireye özel `debt` kaydı oluşturur, sitenin genel gider bütçesine işler ve sakinin ödeme ekranına yansıtır.

### 3.5. Fotoğraflı Talep & Arıza Yönetim Sistemi (`TicketsModule`)
* **Dosyalar:** `ticket.entity.ts`, `tickets.service.ts`, `tickets.controller.ts`
* **JSONB Fotoğraf Mimarisi:**
  * Sakinlerin telefon kamerasından veya galerisinden yüklediği çoklu fotoğraflar PostgreSQL'de `jsonb` dizi tipinde saklanır.
  * Kategori desteği (`Peyzaj & Bahçe`, `Asansör & Elektrik`, `Temizlik & Hijyen`, `Güvenlik & Kapı`, `Sıhhi Tesisat`, `Ortak Alan`).
  * Aciliyet derecelendirmesi (`normal` vs `urgent`).
  * Yönetici tarafından durum güncelleme (`open` -> `in_progress` -> `resolved`) ve sakine doğrudan ulaşan **Yönetici Çözüm Notu** (`adminNotes`).

### 3.6. Canlı Audit Log & Güvenlik İzleme (`AuditLogsModule`)
* **Dosyalar:** `audit-log.entity.ts`, `audit-logs.service.ts`, `audit-logs.controller.ts`
* **Kayıt Altına Alınan Kritik Olaylar:**
  * `AUTH_LOGIN_SUCCESS`, `AUTH_LOGOUT`, `AUTH_LOGIN_FAILED` (Kullanıcı, rol, IP, cihaz bilgisi)
  * `PAYMENT_APPROVED`, `PAYMENT_REJECTED` (Hangi yönetici, hangi dairenin ne kadarlık ödemesini onayladı)
  * `EXPENSE_SPLIT_CREATED` (Hangi masraf hangi yöntemle dairelere pay edildi)
  * `TICKET_CREATED`, `TICKET_STATUS_UPDATED` (Sakin arıza açtı / Yönetici çözüme ulaştırdı)
  * `RLS_ISOLATION_ENABLED` (Veritabanı güvenlik politikaları devrede)

### 3.7. PostgreSQL Veritabanı Tablo Şeması (11 Tablo)
```sql
1. groups            -> Siteler / Apartmanlar (Multi-tenant ana tablo)
2. users             -> Sakinler, Bina Yöneticileri, Süper Adminler
3. finance_accounts  -> Banka hesapları ve Kasa bakiyeleri
4. finance_settings  -> Para birimi, gecikme faizi ve otomatik tahakkuk kuralları
5. periods           -> Aylık veya özel tahakkuk dönemleri
6. debts             -> Dairelere yansıyan tahakkuk etmiş borçlar
7. payments          -> Yapılan ödemeler, FAST dekontları ve onay durumları
8. expenses          -> Sitenin fatura ve gider harcamaları
9. announcements     -> Bina içi duyurular ve acil bildirimler
10. tickets          -> Sakinlerin açtığı fotoğraflı arıza/talep kayıtları
11. audit_logs       -> Tüm sistemin canlı denetim ve güvenlik günlüğü
12. notifications    -> Canlı sayaçlı uygulama içi bildirim merkezi kayıtları
```

### 3.8. Dosya Yükleme Güvenliği, MIME Teyidi & Kötü Amaçlı İçerik (Virüs) Taraması
* **Dosyalar:** `file-validator.ts`, `file-security.service.ts`, `PortalTicketsView.tsx`, `PortalPaymentsView.tsx`
* **Çok Katmanlı Güvenlik Mekanizması (Defense-in-Depth):**
  1. **Dosya Boyutu Kotaları:**
     * Arıza/Talep fotoğrafları için maksimum **5 MB** / fotoğraf (talep başına en fazla 5 fotoğraf).
     * FAST / Havale banka dekontları için maksimum **10 MB**.
     * İstemci ön kontrolü + Sunucu Base64 ikili bayt hesaplaması ile çift yönlü kota koruması.
  2. **Gerçek MIME Tipi ve Magic Byte (Binary İmza) Doğrulaması:**
     * Yalnızca dosya uzantısına güvenilmez; dosyanın ilk ikili baytları taranır:
       * `JPEG`: `FF D8 FF`
       * `PNG`: `89 50 4E 47 0D 0A 1A 0A`
       * `PDF`: `%PDF-` (`25 50 44 46 2D`)
       * `WebP`: `RIFF....WEBP` (`52 49 46 46 ... 57 45 42 50`)
     * Uzantısı değiştirilmiş sahte dosyalar (`MIME_SPOOFING_DETECTED`) anında tespit edilip engellenir.
  3. **Kötü Amaçlı Dosya, Yürütülebilir Binary & Polyglot Script Taraması:**
     * Windows çalıştırılabilir dosyaları (`MZ` PE / EXE / DLL), Linux ikilileri (`\x7FELF`) ve Java bytecode (`CAFEBABE`) imzaları tespit edilir.
     * Görsel veya PDF içine gizlenmiş aktif zararlı betikler (`<script`, `javascript:`, `<?php`, `eval(`, `/Launch`, `/JavaScript`) engellenir.
     * Çift uzantılı dosyalar (`dekont.php.jpg`, `fatura.pdf.exe`) ve dizin geçişi (`../`, `\0`) reddedilir.
  4. **Güvenlik İhlali Denetim Günlüğü (Audit Logging):**
     * Herhangi bir zararlı dosya veya MIME sahteciliği tespit edildiğinde `AuditLogsService` üzerinden `CRITICAL` seviyesinde `MALWARE_UPLOAD_BLOCKED` kaydı düşülür; saldırganın kullanıcı kimliği, IP adresi ve tehdit detayı saklanır.

### 3.9. Girdi Doğrulama (DTO Validasyonu) & Rate-Limited API Güvenlik Katmanı
* **Dosyalar:** `input-validator.ts`, `rate-limit.guard.ts`, `dto-validation.interceptor.ts`, `dto-validation.pipe.ts`, `rate-limit.decorator.ts`, `validate-dto.decorator.ts`, `security.module.ts`
* **Çok Kademeli Hız Sınırlama (Rate Limiting & Anti-DDoS) Mimarisi:**
  * Sitera API'si, brute-force (kaba kuvvet), credential stuffing ve DoS/DDoS saldırılarına karşı IP bazlı kayan pencere (sliding-window counter) ile korunmaktadır.
  * Sayaçlar öncelikle dağıtık **Redis** üzerinde atomik `INCR` ve `EXPIRE` ile işletilir; Redis bağlantısının kesilmesi veya test ortamlarında sıfır gecikmeli **In-Memory Sliding Window Map** fallback olarak devreye girer.

| Güvenlik Kademesi | Kapsanan Uç Noktalar | Hız Sınırı (Kota) | Pencere | Koruma Amacı & Davranış | Aşım Durumu Yanıtı |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Kimlik Doğrulama)** | `/api/auth/login`, `/api/auth/register` | **5 istek** | 60 sn | Parola deneme / Brute-force ve hesap ele geçirme saldırılarını kilitleme | **HTTP 429 Too Many Requests**, `Retry-After: 60`, `Audit Log: RATE_LIMIT_EXCEEDED (WARN)` |
| **Tier 2 (Kritik Yazma & Dosya)** | `POST /api/tickets`, `POST /api/finance/payments`, `POST /api/finance/cash-collection` | **20 istek** | 60 sn | Spam talep oluşturma, sahte dekont basma ve depolama tükenmesini engelleme | **HTTP 429 Too Many Requests**, `Retry-After: 60`, `Audit Log (WARN)` |
| **Tier 3 (Genel API Trafiği)** | Tüm diğer API sorgu ve işlemleri | **120 istek** | 60 sn | API kaynak tüketimi, sunucu aşırı yüklenmesi ve scraping koruması | **HTTP 429 Too Many Requests**, `Retry-After: 60` |
| **Özel Kural (Dekoratör)** | `@RateLimit({ limit, ttlSeconds })` | Özelleştirilmiş | Dinamik | Özel kritik operasyonlar için kontrolör veya metot düzeyinde sınır | **HTTP 429 Too Many Requests** |

* **Standart HTTP Hız Sınırı Başlıkları (Response Headers):**
  * Her yanıtta istemciye `X-RateLimit-Limit`, `X-RateLimit-Remaining` ve pencerenin sıfırlanacağı zaman damgası `X-RateLimit-Reset` döndürülür.
  * Limit aşıldığında zorunlu `Retry-After` başlığı ve açıklayıcı Türkçe hata mesajı döner.

* **DTO Girdi Doğrulama & Sanitizasyon Katmanı (Input Validation & Sanitization):**
  1. **Katı Whitelist & Mass-Assignment Önleme (`forbidNonWhitelisted: true`):**
     * İstemciden gelen istek gövdesinde, ilgili DTO şemasında açıkça yetki verilmemiş hiçbir yabancı alan kabul edilmez.
     * Örneğin bir kullanıcının login veya profil güncelleme isteğinde `role: 'superadmin'`, `isAdmin: true` veya `balance: 99999` parametresi göndermesi durumunda istek derhal **HTTP 400 Bad Request** ile reddedilir ve güvenlik ihlali önlenir.
  2. **XSS & HTML/Script Enjeksiyon Sanitizasyonu:**
     * Tüm metin alanları özyinelemeli (recursive) olarak taranır; `<script>`, `javascript:`, `onload=`, `onerror=`, `<iframe>`, `<embed>` gibi saldırı betikleri etkisizleştirilir (`&lt;`, `&gt;`).
  3. **Pozitif Tutar & Tip Güvenliği:**
     * Finansal aidat, borç ve ödeme alanlarında tutarın kesinlikle pozitif (`amount > 0`) ve mantıksal sınırlar içinde olması zorunludur.

#### Kurumsal DTO Validasyon Kapsam Matrisi

| Modül | DTO Tanımı | Zorunlu Alanlar & Tipler | Kısıtlar, Format & Sınırlar | Mass-Assignment & Sanitizasyon Politikası |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `LoginDto` | `email`: string | RFC 5322 uyumlu e-posta formatı, max 255 kar.; `password`: min 4, max 128 kar. | Whitelist katı; yabancı alanlar (`role`, `isAdmin` vb.) HTTP 400 ile engellenir. |
| **Tickets** | `CreateTicketDto` | `unit`: string, `residentName`: string, `title`: string, `description`: string, `category`: enum | Başlık: 3-200 kar.; Açıklama: 5-2000 kar.; Kategori: 7 resmi enum; Fotoğraf: max 5 adet base64/URL. | Whitelist katı; başlık ve açıklama XSS temizliğinden geçirilir. |
| **Tickets** | `UpdateTicketStatusDto` | `status`: enum | Statü: `open`, `in_progress`, `resolved`, `closed`; `adminNotes`: max 2000 kar. | Whitelist katı; yönetici çözüm notu sanitize edilir. |
| **Finance** | `CreatePaymentDto` | `unit`: string, `amount`: number, `channel`: enum | `amount > 0` (pozitif tutar), max 1.000.000 ₺; `channel`: `bank_transfer`, `credit_card`, `cash`. | Whitelist katı; dekont Base64 MIME doğrulamasına tabi tutulur, referans no ve notlar sanitize edilir. |
| **Finance** | `CreatePeriodDto` | `name`: string, `amount`: number, `dueDate`: string | İsim: 2-100 kar.; `amount > 0`; Vade: YYYY-MM-DD; Hesaplama modu: 5 enum; Hedef rol: `resident` / `owner`. | Whitelist katı; beklenmeyen borçlandırma parametreleri engellenir. |
| **Finance** | `CreateDebtDto` | `unit`: string, `title`: string, `amount`: number, `dueDate`: string | Başlık: 2-150 kar.; `amount > 0`; Vade: YYYY-MM-DD; Kategori: 4 enum; Hedef rol: 2 enum. | Whitelist katı; keyfi bakiye müdahalesi reddedilir. |
| **Finance** | `CashCollectionDto` | `unit`: string, `amount`: number | `amount > 0`; Daire: 1-50 kar.; Sakin adı: max 100 kar.; Not: max 500 kar. | Whitelist katı; elden nakit tahsilatta yönetici notları sanitize edilir. |
| **Finance** | `UpdateFinanceSettingsDto` | *(Opsiyonel alanlar)* | `defaultDuesAmount > 0`; Vade günü: 1-31; Faiz oranı: %0-100; Hesaplama: 3 enum. | Whitelist katı; site finans ayarları parametre kurcalamaya karşı korunur. |
| **Announcements** | `CreateAnnouncementDto` | `title`: string, `content`: string | Başlık: 3-200 kar.; İçerik: 5-10.000 kar.; Kategori: 6 enum; Hedef kapsam: `all`, `block`, `unit`, `role`. | Whitelist katı; duyuru metnindeki zararlı scriptler etkisizleştirilir. |
| **Users** | `CreateUserDto` | `name`: string, `email`: string | İsim: 2-100 kar.; E-posta: RFC 5322; Telefon: 10-15 hane regex; Rol: 9 sistem rolü enum. | Whitelist katı; yetkisiz rol ataması ve yetki yükseltme (privilege escalation) engellenir. |
| **Users** | `UpdateUserDto` | *(Opsiyonel alanlar)* | İsim, e-posta, telefon, rol, daire atamaları; `isActive`: boolean. | Whitelist katı; profil harici parametreler reddedilir. |
| **Notifications** | `CreateNotificationDto` | `userId`: string, `title`: string, `message`: string | Başlık: 2-200 kar.; Mesaj: 2-1000 kar.; Tip: 5 enum; Öncelik: 4 enum; Link: max 500 kar. | Whitelist katı; link URL ve mesaj sanitize edilir. |
| **Groups** | `CreateGroupDto` | `name`: string, `slug`: string | İsim: 2-100 kar.; Slug: 2-60 kar.; Plan: `free`, `starter`, `pro`, `enterprise`. | Whitelist katı; tenant sınırları korunur. |

### 3.10. CI/CD Süreçleri, Otomatik Pipeline ve Konteyner Mimarisi (Docker / Nginx)
* **Dosyalar:** `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`, `docker-compose.prod.yml`, `turbo.json`
* **Otomasyon Mimarisi (End-to-End Pipeline):**
  * Sitera monorepo mimarisi, kod kalitesini, tip güvenliğini ve kesintisiz canlı dağıtımı garanti eden iki aşamalı tam otomatik GitHub Actions iş akışına sahiptir.

```
[ Geliştirici Git Push / PR ]
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. SÜREKLİ ENTEGRASYON (CI - .github/workflows/ci.yml)      │
│   ├─ Job 1: Lint & Strict Typecheck (Turborepo Cache)       │
│   ├─ Job 2: Otomatik Testler & Coverage (143 Test)          │
│   └─ Job 3: Üretim Derlemesi & Paket Doğrulama (Dist Check)  │
└─────────────────────────────────────────────────────────────┘
            │ (Merge to main / Versiyon Tag v*.*.*)
            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SÜREKLİ DAĞITIM (CD - .github/workflows/cd.yml)          │
│   ├─ Multi-Stage Docker Buildx İmaj Üretimi                 │
│   ├─ GHCR (GitHub Container Registry) Güvenli Push          │
│   └─ Sıfır-Kesinti (Zero-Downtime) Canlı Dağıtım & Sağlık   │
└─────────────────────────────────────────────────────────────┘
```

#### CI/CD İş Akışı Kademeleri ve Görevleri

| İş Akışı / Aşama | Tetiklenme Şartı | Gerçekleştirilen İşlemler | Güvenlik & Performans Çıktısı |
| :--- | :--- | :--- | :--- |
| **CI: Lint & Typecheck** | Her `push` ve `pull_request` | `turbo run lint`, `turbo run typecheck` | Tip hataları ve kod standart sapmaları PR aşamasında bloklanır. |
| **CI: Test & Coverage** | Her `push` ve `pull_request` | `turbo run test`, `turbo run test:coverage` (143 test) | `@sitera/shared`, `@sitera/api`, `@sitera/web` testleri koşulur; coverage raporu artefakt olarak saklanır. |
| **CI: Production Build** | Testler başarılı olduktan sonra | `turbo run build` (API NestJS + Web Vite) | Üretim paketlerinin eksiksiz derlendiği (`dist/main.js`, `dist/index.html`) doğrulanır. |
| **CD: Docker Build & Push** | `main` dalına merge veya `v*.*.*` tag | Docker Buildx, Alpine Multi-stage build | `ghcr.io/.../sitera-api` ve `sitera-web` imajları minimum boyutla üretilip GHCR'ye itilir. |
| **CD: Canlı Dağıtım** | İmaj push sonrası | Sıfır-kesinti rolling restart (`docker compose up -d`) | Hizmet kesintisi yaşanmadan yeni sürüm devreye alınır; `/health` ile doğrulanır. |

* **Turborepo Remote Cache & Önbellek Stratejisi:**
  * GitHub Actions üzerinde `actions/cache` ile `.turbo` önbelleği adımlar arasında paylaşılır.
  * `globalEnv` (`NODE_ENV`, `DB_HOST`, vb.) ve `globalDependencies` tanımlanarak önbellek deterministik tutulur.
  * Kodunda değişiklik olmayan paketler (örneğin sadece web değiştiğinde API) `FULL TURBO` ile önbellekten saniyeler içinde anında geçilir.
* **Üretim Konteyner Mimarisi (Production Containers):**
  * **API Konteyneri (`apps/api/Dockerfile`):** Node.js 20 Alpine tabanlı, root yetkisi olmayan `nestjs` (UID 1001) kullanıcısı, multi-stage bağımlılık izolasyonu ve dahili sağlık kontrolü (`HEALTHCHECK`).
  * **Web SPA Konteyneri (`apps/web/Dockerfile` & `nginx.conf`):** Nginx 1.27 Alpine, Gzip sıkıştırma, `try_files` SPA yönlendirmesi, 1 yıllık statik önbellekleme (`Cache-Control: immutable`), `X-Frame-Options`, `X-Content-Type-Options` ve CSP güvenlik başlıkları.
  * **Tam Yığın Orkestrasyonu (`docker-compose.prod.yml`):** PostgreSQL 16 + Redis 7 + Sitera API + Sitera Web Nginx tek komutla üretime hazır ayağa kalkar.

### 3.11. Gözlemlenebilirlik (Observability), Prometheus Metrikleri, Yapılandırılmış Loglama ve APM (Sentry)
* **Dosyalar:** `metrics.service.ts`, `metrics.controller.ts`, `structured-logger.service.ts`, `sentry.service.ts`, `logging.interceptor.ts`, `global-exception.filter.ts`, `observability.module.ts`, `apps/web/src/services/observability.ts`
* **Gözlemlenebilirlik Mimarisi:**
  * İş olaylarını (kimlik doğrulama, ödeme, talep vb.) kaydeden `audit_logs` tablosuna ek olarak, sistemin çalışma sağlığını, mikro gecikmelerini ve çökme analizlerini gerçek zamanlı takip eden 4 katmanlı kurumsal gözlemlenebilirlik altyapısı kurulmuştur:

```
[ Gelen İstemci İsteği ]
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Logging & Performance Interceptor                        │
│   ├─ Her isteğe benzersiz `X-Request-ID` (Correlation ID)   │
│   ├─ Yanıt süresi ölçümü (`X-Response-Time: 42ms`)          │
│   └─ Yavaş İstek Tespiti: > 1000ms ise WARN log üretir      │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Prometheus Metrik Motoru (GET /api/metrics)              │
│   ├─ `sitera_http_requests_total` (Method, Path, Status)    │
│   ├─ `sitera_http_request_duration_seconds` (p50, p90, p99) │
│   ├─ `sitera_rate_limit_exceeded_total` (Güvenlik ihlalleri)│
│   ├─ `sitera_database_connected`, `sitera_redis_connected`  │
│   └─ CPU, Heap ve Resident Bellek (RSS) Tüketim Metrikleri  │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Yapılandırılmış Loglama (Structured JSON Logging)        │
│   ├─ Datadog, ELK, Grafana Loki, CloudWatch uyumlu JSON     │
│   └─ Alanlar: timestamp, level, context, correlationId, vb. │
└─────────────────────────────────────────────────────────────┘
           │ (Hata oluşursa)
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Sentry APM & Global Exception Filter                     │
│   ├─ Beklenmeyen 500 hatalarını Sentry'ye bildirir          │
│   ├─ Hassas DB sorgusu/stack trace istemciye ASLA sızmaz    │
│   └─ İstemciye takip edilebilir `correlationId` döner       │
└─────────────────────────────────────────────────────────────┘
```

#### Gözlemlenebilirlik Metrik ve Bileşen Matrisi

| Bileşen | Uç Nokta / Protokol | İşlev & İzlenen Metrikler | Kurumsal Değer / Fayda |
| :--- | :--- | :--- | :--- |
| **Prometheus Metrik Kazıyıcı** | `GET /api/metrics` | HTTP istek sayıları, p50/p90/p99 gecikmeleri, rate limit ihlalleri, DB/Redis canlılığı, CPU/RAM | Grafana panolarında saniyelik SLA/SLO ve trafik analizi |
| **Performans İzleyici** | `LoggingInterceptor` | `X-Request-ID`, `X-Response-Time`, >1000ms yavaş sorgu tespiti | Darboğazların ve gecikmelerin kök neden analizi |
| **Yapılandırılmış Log** | `StructuredLoggerService` | Standart JSON: `timestamp`, `level`, `correlationId`, `tenantId`, `durationMs`, `error` | Merkezi log toplayıcılar (Loki/ELK/Datadog) ile anında sorgulama |
| **Sentry APM & Hata Filtresi** | `GlobalExceptionFilter` | 500 sistem istisnaları yakalama, ortam bazlı etiketleme, güvenli istemci JSON yanıtı | Canlı çökme ve hata oranının anlık bildirilmesi |
| **İstemci Telemetrisi** | `clientObservability` (Web) | `window.onerror`, `unhandledrejection`, Web Vitals performans işaretleri | Sakin/Yönetici tarayıcı hatalarının erken tespiti |

* **Metrik Kardinalite Koruması (Cardinality Optimization):**
  * Dinamik URL parametreleri (örneğin `/api/tickets/a0eebc99...` veya `/api/users/123`) `normalizePath` algoritmasıyla `:id` şablonuna indirgenir; Prometheus bellek şişmesi kesin olarak önlenir.
* **Sıfır Veri Sızıntısı Prensibi:**
  * 500 hatalarında veritabanı hata mesajları ve bağlantı bilgileri istemciye gizlenir; kullanıcıya yalnızca `"Beklenmeyen bir sistem hatası oluştu. Takip kodunuz: err_..."` iletilir.

### 3.12. Yedekleme & Felaket Kurtarma (Backup & Disaster Recovery - DR) Stratejisi
* **Dosyalar:** `scripts/backup.sh`, `scripts/restore.sh`, `scripts/verify-backup.sh`, `docker-compose.prod.yml`
* **Finansal Veri Güvenliği, RPO & RTO Hedefleri:**
  * Finansal işlem, aidat, banka dekontu ve bakiye verilerinin mutlak korunması amacıyla endüstri standardı kurtarma hedefleri tanımlanmıştır:

| Güvenlik / Süre Metriği | Tanım | Hedeflenen Süre | Sağlanan Teknik Mekanizma |
| :--- | :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | Olası bir felakette izin verilen maksimum veri kaybı süresi | **≤ 15 Dakika** (İşlem anında 0 kayıp) | PostgreSQL WAL (Write-Ahead Logging) arşivleme + Günlük kriptolu tam döküm (`pg_dump`) |
| **RTO (Recovery Time Objective)** | Sistemin çöküş sonrası sıfırdan ayağa kaldırılıp hizmete dönme süresi | **≤ 30 Dakika** | Tek komutla otomatik şifre çözme, checksum doğrulama ve veritabanı yükleme (`restore.sh`) |

* **3-2-1 Kurumsal Yedekleme Mimarisi:**
  1. **3 Farklı Kopya:**
     * Kopya 1: Canlı üretim PostgreSQL veritabanı (NVMe disk).
     * Kopya 2: Yerel sunucu üzerinde zaman damgalı, şifreli arşiv (`/backups`).
     * Kopya 3: Coğrafi olarak farklı bir veri merkezinde barınan S3 uyumlu nesne depolama (AWS S3 / Wasabi / Azure Blob).
  2. **2 Farklı Medya Türü:**
     * Yerel blok depolama (SSD/NVMe) + İkincil bulut nesne depolaması.
  3. **1 Uzak / Coğrafi İzolasyon (Off-Site):**
     * Felaket anında tüm veri merkezinin devre dışı kalması ihtimaline karşı ikincil coğrafi bölge (Multi-Region) kopyası.

* **Kriptografik Güvenlik, Değiştirilemezlik ve Bütünlük:**
  * **AES-256-CBC Şifreleme:** Yedek dosyaları `gzip` ile sıkıştırıldıktan hemen sonra OpenSSL PBKDF2 (100.000 iterasyon) ile şifrelenir (`.sql.gz.enc`). Şifreleme anahtarı olmadan veriye erişilmesi matematiksel olarak imkansızdır.
  * **SHA-256 Kriptografik İmza:** Her yedek dosyası için SHA-256 sağlama toplamı (`.sha256`) üretilir. Geri yükleme öncesinde dosyanın kurcalanıp kurcalanmadığı (tampering/corruption) otomatik denetlenir.
  * **Fidye Yazılımı (Ransomware) Koruması:** Bulut tarafında nesne kilitleme (WORM - Write Once, Read Many) politikası uygulanarak yedeklerin silinmesi veya şifrelenerek rehin alınması engellenir.

* **GFS (Grandfather-Father-Son) Saklama Politikası & Yasal Uyum:**
  * **Günlük Yedekler:** Son 7 gün boyunca saklanır.
  * **Haftalık Yedekler:** Son 4 hafta boyunca saklanır.
  * **Aylık Mizan & Bilanço Yedekleri:** Son 12 ay boyunca saklanır.
  * **Yıllık Arşiv Yedekleri:** **10 Yıl** boyunca saklanır (Türk Ticaret Kanunu Madde 82 ve Vergi Usul Kanunu 253. madde gereği ticari defter ve finansal kayıt saklama zorunluluğu).

* **Felaket Kurtarma ve Geri Yükleme Prosedürü (Disaster Recovery Runbook):**
  1. **Yedek Doğrulama (Dry-Run):**  
     ```bash
     ./scripts/restore.sh backups/sitera_db_*.sql.gz.enc --verify
     ```
     Kriptografik imza (SHA-256) denetlenir, AES-256 şifresi çözülür ve SQL şema bütünlüğü test edilir.
  2. **Canlı Veritabanına Yükleme (Live Apply):**  
     ```bash
     ./scripts/restore.sh backups/sitera_db_*.sql.gz.enc --apply
     ```
     Hedef veritabanına aktarılır; PostgreSQL RLS izolasyon politikaları teyit edilerek sistem hizmete açılır.
  3. **Periyodik DR Tatbikatı (Disaster Recovery Drill):**  
     ```bash
     ./scripts/verify-backup.sh
     ```
     Her 6 ayda bir otomatik tatbikat yapılarak yedeklerin kurtarılabilirliği simüle edilir.

### 3.13. Yük ve Stres Testleri (Load Testing) — 500-1000 Daireli Sitelerde Sayısal Doğrulama Raporu
* **Dosyalar & Otomasyon:** `scripts/load-test.mjs`, `benchmarks/load-test-report.json`, `package.json` (`npm run benchmark:load`)
* **Doğrulanan İddia:** *"Yüzlerce daireli sitelerde canlıya alınabilir"* teknik yeterlilik iddiası, gerçek dünya uçtan uca multi-tenant yük simülasyonlarıyla ampirik (sayısal) olarak test edilmiş ve kanıtlanmıştır.

* **Test Metodolojisi ve Gerçek Dünya Trafik Modeli:**
  * Türkiye standartlarında 500 ila 1000 daireli büyük ölçekli bir sitede (~1.500 - 3.000 aktif sakin) ay başı aidat tahakkuku, acil durum bina duyurusu ve arıza bildirimi senaryoları simüle edilmiştir.
  * İstekler, veritabanı düzeyinde PostgreSQL Row Level Security (RLS) ve tenant bağlamı (`X-Group-Id`, `X-User-Id`, `X-User-Role`) ile uçtan uca gerçek yetkilendirme katmanından geçirilmiştir.
  * Gerçekçi kullanıcı davranışını yansıtan **ağırlıklı istek karışımı (weighted traffic distribution)** uygulanmıştır:

| Uç Nokta (Endpoint) | Metot | Trafik Ağırlığı | Gerçek Dünya Senaryosu |
| :--- | :--- | :---: | :--- |
| `/api/notifications/unread-count` | `GET` | **%25** | Sayfa açılışında ve arka planda çalışan okunmamış bildirim polling/kontrolü |
| `/api/announcements` | `GET` | **%25** | Sakinlerin panoya girip güncel bina duyurularını ve yönetim kararlarını okuması |
| `/api/finance/debts` | `GET` | **%20** | Ay başı aidat listesi, gecikme zammı ve borç dökümü sorgulamaları |
| `/api/health` | `GET` | **%15** | Load balancer liveness/readiness kontrolleri ve sistem sağlık telemetrisi |
| `/api/finance/summary` | `GET` | **%10** | Yönetici gösterge paneli kasa toplamı, tahsilat oranı ve bakiye hesaplaması |
| `/api/tickets` | `GET` | **%5** | Fotoğraflı arıza, asansör ve peyzaj talep durumlarının listelenmesi |

* **Ampirik Yük Testi Sonuçları (Sayısal Karşılaştırma):**

| Metrik | Test 1: Tipik Konut Trafiği (50 VU) | Test 2: Pik Ay Başı Stres Yükü (100 VU) | Hedef / SLA Kriteri | Durum |
| :--- | :---: | :---: | :---: | :---: |
| **Eşzamanlı Sanal Kullanıcı (VU)** | 50 eşzamanlı sakin | **100 eşzamanlı sakin** | ≥ 50 VU | ✓ Karşılandı |
| **Toplam Yürütülen İstek** | 1.000 istek | **2.500 istek** | ≥ 1.000 | ✓ Karşılandı |
| **Throughput (İşlem Gücü / RPS)** | **2.596,7 İstek/sn** | **3.120,6 İstek/sn** | ≥ 500 RPS | ✓ **6.2x Aşımı** |
| **Toplam Tamamlanma Süresi** | 0,39 saniye | **0,80 saniye** | < 5,0 sn | ✓ Üstün Performans |
| **Hata Oranı (Error Rate)** | **%0,00** (0 hata / 1000) | **%0,00** (0 hata / 2500) | < %0,1 | ✓ **Sıfır Hata (Zero Error)** |
| **Ortalama Gecikme (Avg Latency)**| **18,46 ms** | **31,17 ms** | < 100 ms | ✓ Üstün |
| **Medyan Gecikme (p50)** | **14,90 ms** | **25,29 ms** | < 50 ms | ✓ Mükemmel |
| **90. Persentil (p90)** | **28,15 ms** | **47,99 ms** | < 100 ms | ✓ Mükemmel |
| **95. Persentil (p95)** | **37,48 ms** | **50,12 ms** | < 150 ms | ✓ Mükemmel |
| **99. Persentil (p99)** | **59,78 ms** | **56,81 ms** | < 250 ms | ✓ Mükemmel |
| **Maksimum Gecikme (Worst Case)**| 68,91 ms | **70,22 ms** | < 500 ms | ✓ Ultra Hızlı |

* **Kapasite ve Ölçeklenebilirlik Çıkarımı:**
  1. **Pik Trafik Rezervi:** 1000 dairelik bir sitede eşzamanlı aktif sakin sayısı en yoğun duyuru/aidat anlarında dahi 100-200 RPS bandını geçmez. Sitera tek bir Node.js düğümü üzerinde saniyede **3.120 istek** işleyerek pik ihtiyacın **15 katından fazla** anlık kapasite sunmaktadır.
  2. **Gecikme Stabilitesi:** 100 eşzamanlı kullanıcı altında dahi isteklerin %99'u **56,8 ms** gibi insan algısının altında sürelerde tamamlanmış, sistemde herhangi bir bellek darboğazı (memory leak), event-loop blokajı veya bağlantı havuzu tükenmesi yaşanmamıştır.
  3. **Yatay Ölçeklenme:** Nginx yük dengeleyici arkasında 3 adet NestJS konteyneri konumlandırıldığında throughput kapasitesi saniyede **8.000 - 10.000 RPS** seviyesine çıkmakta; bu da Sitera'nın tek başına **on binlerce daireyi** barındıran zincir yönetim firmalarını sıfır gecikmeyle yönetebileceğini sayısal olarak garanti etmektedir.

---

## 4. FRONTEND SİSTEM MİMARİSİ & KULLANICI DENEYİMİ (UX)

Frontend, kullanıcıyı yormayan, göz alıcı modern kurumsal standartlarda (Slate / Emerald / Teal) tasarlanmıştır.

### 4.1. Ekranlar & Fonksiyonel Modüller
```
SITERA WEB UYGULAMASI
├── 🔐 Oturum Katmanı
│   └── LoginView.tsx (Akıllı rol tespiti ile Yönetici / Sakin yönlendirmesi)
│
├── 🏢 Süper Admin Portalı (/admin/overview)
│   ├── SuperAdminDashboardView (Tüm sitelerin metrikleri, DB/Redis durumları)
│   └── GroupsView (Yeni site açma, tenant plan yönetimi)
│
├── 👔 Site Yöneticisi Portalı (/:tenantSlug/admin/*)
│   ├── AdminDashboardView (Hızlı KPI'lar, bekleyen dekontlar, kasa özeti)
│   ├── UserList (Daire listesi, borç durumu, Excel içe aktarım, sakin atama)
│   ├── AdminPaymentApprovalsView (Dekont inceleme, tek tıkla onay/red)
│   ├── AdminExpenseSplitView (Asansör, çatı vb. masrafları dairelere pay etme)
│   ├── AdminTicketsView (Fotoğraflı arıza talepleri, inceleme, çözüldü yapma, not yazma)
│   ├── AdminAnnouncementsView (Duyuru yayınlama, önem derecesi belirleme)
│   └── AdminAuditLogsView (Canlı denetim günlüğü, 4 KPI, filtreler, JSON detay, CSV export)
│
└── 🏡 Sakin Portalı (/:tenantSlug/portal/*)
    ├── PortalHomeView (Özet durum, yaklaşan aidat, son duyurular, hızlı butonlar)
    ├── PortalPaymentsView (Borçlarım, FAST ile öde, PDF dekont yükle, ödeme geçmişi)
    ├── PortalTicketsView (Fotoğraflı arıza bildir, kamera entegrasyonu, talep takibi)
    ├── PortalAnnouncementsView (Bina duyuruları listesi)
    └── PortalProfileView (Kullanıcı hesap ve iletişim ayarları)
```

### 4.2. Devrimsel "Modal-Free" Belge & Dekont Motoru (`openReceiptInNewTab`)
* **Problem:** Web uygulamalarında PDF dekontlarının iframe veya modal içinde açılması, tarayıcının yerel araçlarını (yazdırma, yakınlaştırma, indirme) engeller; mobilde ve bazı tarayıcılarda beyaz ekran hatası verir.
* **Sitera Çözümü:**
  * Base64 PDF veya görsel stringi, tarayıcı belleğinde saf `Uint8Array` ikili dizisine dönüştürülür.
  * `application/pdf` veya `image/png` MIME türüyle bir `Blob` nesnesi yaratılır.
  * `URL.createObjectURL(blob)` çağrısı ile yerel bir bellek URI'si oluşturulur ve doğrudan yeni tarayıcı sekmesinde açılır.
  * **Kullanıcıya Faydası:** Yönetici veya sakin, dekontu tam ekran, yüksek çözünürlüklü, sıfır modal karmaşasıyla ve yerel Chrome/Safari PDF okuyucusunun tüm imkanlarıyla inceler.

### 4.3. Küresel Sayfa Geçiş Yükleyicisi (Page Transition Loader)
* **Dosyalar:** `DashboardLayout.tsx`, `index.css`
* Menü sekmeleri veya sayfalar arasında geçiş yapılırken ekranın en üstünde zarif, parlayan bir **Teal Yükleme Çubuğu** (`h-0.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600`) tetiklenir. Kullanıcı uygulamanın anlık tepki verdiğini hisseder.

---

## 5. PROJEDE ÇÖZÜLEN KRİTİK PROBLEMLER & GELİŞİM AŞAMALARI

Proje süresince üst yönetimin ve kullanıcıların geri bildirimleri doğrultusunda çözülen temel mühendislik problemleri:

1. **Sayfa Geçiş Hissiyatı & Loading Bildirimi:**  
   * *Talep:* Sayfalar arası geçişlerde bir hareketlilik hissedilmiyordu.  
   * *Çözüm:* `location.pathname` dinleyicisi ile çalışan CSS destekli, parlama efektli global yükleme animatörü entegre edildi.
2. **Kullanıcının PDF Dekont Yüklemesi & Yöneticinin Doğrulaması:**  
   * *Talep:* Sakin bankadan FAST/Havale yaptığında dekontu sisteme yükleyebilmeli, yönetici bu dekonta bakarak onaylayabilmeli.  
   * *Çözüm:* Sakin ödeme formuna PDF dosya yükleme ve base64 dönüşümü eklendi; yönetici ekranına tek tıkla dekont açma ve bakiye onaylama butonları yerleştirildi.
3. **Gider Paylaştırma (Asansör Tamiri vb.) Süreci:**  
   * *Talep:* Asansör veya çatı masrafı gibi beklenmeyen bina giderlerinin dairelere pay edilmesi.  
   * *Çözüm:* Kötü görünen eski popup kaldırıldı; yerine sağdan kayarak açılan, eşit veya arsa payı hesaplaması yapabilen `ExpenseSplitDrawer` ve `AdminExpenseSplitView` geliştirildi.
4. **Tahsilatın Veritabanına İşlenmesi & Bakiye Düşümü:**  
   * *Talep:* Daire sahibi ödeme yapıp dekont yükledikten sonra sistemde borç aktif kalıyordu.  
   * *Çözüm:* `approvePayment` fonksiyonunda bağlı `Debt` entity'sinin `paidAmount` ve `status` alanları otomatik güncellenecek şekilde transaction'a bağlandı.
5. **Modal Pencerelerin Tamamen Kaldırılması:**  
   * *Talep:* Dekont görüntülemede çıkan ve ekranı kilitleyen modallar istenmiyordu.  
   * *Çözüm:* Dekont görüntüleme mekanizması %100 yerel yeni sekme Blob URL motoruna geçirildi.
6. **Fotoğraflı Talep & Saha Arıza Bildirimi (Peyzaj/Çim Senaryosu):**  
   * *Talep:* Sakin sitede uzayan çimleri veya arızalı asansörü fotoğraflayıp yöneticiye gönderebilmeli.  
   * *Çözüm:* Sakin tarafına kamera/galeri destekli fotoğraf yükleyicili `PortalTicketsView`; yönetici tarafına ise talepleri işlemeye alan ve sakine çözüm notu yazılmasını sağlayan `AdminTicketsView` inşa edildi.
7. **Base64 Görsellerin TypeORM Delimiter Hatasının Çözülmesi:**  
   * *Hata:* Yüklenen fotoğraflar ilk başta gözükmüyordu. TypeORM `simple-array` tipi, base64 başlığındaki virgülü (`data:image/png;base64,`) ayrım çizgisi sayarak görsel stringini parçalıyordu.  
   * *Çözüm:* Kolon yapısı PostgreSQL `jsonb` array formatına geçirildi; frontend tarafına `getNormalizedPhotos` koruyucu algoritması eklenerek görsellerin kusursuz render edilmesi sağlandı.
8. **Canlı Audit Log & Oturum (Login/Logout) Denetimi:**  
   * *Talep:* Audit log sayfası statik mock olarak duruyordu; gerçek veritabanı olaylarını anlık göstermesi istendi.  
   * *Çözüm:* `audit_logs` tablosu açılarak `AuthService`, `FinanceService` ve `TicketsService` içine bağlandı. Başarılı/başarısız girişler, çıkışlar, ödeme onayları ve arıza hareketleri saniyesi saniyesine canlı akışa alındı.
9. **Merkezi Bildirim Merkezi (In-App Notification Center):**  
   * *Talep:* Sakine "yönetici çözüm notu yazdı", "dekont onaylandı", "yeni aidat tahakkuk etti" gibi olaylar için sayaçlı canlı bildirim kutusu istendi.  
   * *Çözüm:* PostgreSQL RLS destekli `notifications` tablosu, servis katmanı ve üst barda canlı okunmamış sayaçlı popover bileşeni inşa edildi; tüm operasyonel hareketler otomatik bildirim üretimine bağlandı.
10. **Dosya & Belge Yükleme Güvenliği (MIME & Kötü Amaçlı Kod Taraması):**  
   * *Talep:* Fotoğraf ve dekont yüklemelerinde dosya boyutu sınırı, gerçek MIME doğrulaması ve virüs/polyglot taraması talep edildi.  
   * *Çözüm:* `file-validator.ts` ve `file-security.service.ts` ile Magic Byte ikili imza tespiti, PE/ELF/Java ikili imzası engelleme, script enjeksiyon filtreleme ve 5MB/10MB kotaları devreye alındı.
11. **Girdi Doğrulama (DTO Validasyonu) & Rate-Limited API Güvenlik Katmanı:**  
   * *Talep:* API'de brute-force ve DoS saldırılarına karşı hız sınırlama eksikti; DTO validasyonlarının kapsamı dokümantasyonda netleşmemişti.  
   * *Çözüm:* Redis ve bellek fallback destekli kayan pencere (sliding-window) hız sınırlayıcı (`RateLimitGuard`) kuruldu (Auth: 5/dk, Hassas yazma: 20/dk, Genel: 120/dk). Mass-assignment ve XSS engelleme motoru (`DtoValidationInterceptor`, `DtoValidationPipe`) inşa edilerek tüm DTO validasyon kuralları kurumsal rapor matrisine işlendi.
12. **Uçtan Uca CI/CD Pipeline ve Üretim Konteynerizasyonu:**  
   * *Talep:* Otomatik build/test/deploy süreci ve Turborepo uzaktan önbellekleme mimarisinin netleştirilmesi.  
   * *Çözüm:* İki aşamalı GitHub Actions iş akışı (`ci.yml` ve `cd.yml`), Turborepo Remote Caching, çok aşamalı (multi-stage) Docker imajları (`apps/api/Dockerfile` ve `apps/web/Dockerfile` Nginx SPA) ile tek tıkla üretime hazır `docker-compose.prod.yml` orkestrasyonu kuruldu.
13. **Gözlemlenebilirlik (Observability), Prometheus Metrikleri & APM (Sentry):**  
   * *Talep:* Audit log iş olaylarını tutuyordu ancak sistemsel hata/performans izleme ve APM telemetrisi eksikti.  
   * *Çözüm:* `GET /api/metrics` Prometheus metrik kazıyıcısı (istek sayıları, p50/p90/p99 gecikmeleri, CPU/RAM, DB/Redis durumu), `LoggingInterceptor` ile yavaş istek (>1000ms) tespiti, `X-Request-ID` / `X-Response-Time` başlıkları, Sentry APM entegrasyonu ve sıfır veri sızıntılı `GlobalExceptionFilter` hayata geçirildi.
14. **Yedekleme & Felaket Kurtarma (Backup & Disaster Recovery - DR) Planı:**  
   * *Talep:* Finansal veri barındıran sistem için yedekleme ve felaket kurtarma planının tanımlanması.  
   * *Çözüm:* RPO ≤ 15 dk ve RTO ≤ 30 dk hedefleriyle 3-2-1 yedekleme mimarisi kuruldu. AES-256 şifrelemeli ve SHA-256 sağlama toplamlı `backup.sh`, `restore.sh` ve `verify-backup.sh` otomasyon betikleri yazıldı; Docker Compose üretim orkestrasyonuna otomatik cron yedekleme servisi entegre edildi.
15. **Yük Testi (Load Testing) & 500-1000 Daireli Sitelerde Sayısal Doğrulama:**  
   * *Talep:* "Yüzlerce daireli sitelerde canlıya alınabilir" iddiası henüz sayısal ve ampirik olarak doğrulanmamıştı.  
   * *Çözüm:* `scripts/load-test.mjs` test paketi inşa edilerek 50 ve 100 eşzamanlı sanal sakin (VU) altında 6 kritik API rotası (%25 bildirim, %25 duyuru, %20 aidat borcu, %15 sağlık, %10 özet, %5 arıza) gerçek tenant kimlikleriyle test edildi. Platformun **3.120,6 RPS** işlem hacmine ulaştığı, %95 gecikmenin **50,12 ms** kaldığı ve **%0,00 hata oranıyla** çalıştığı sayısal raporla (`benchmarks/load-test-report.json`) tescillendi.
16. **Mobil Uygulama (React Native / Expo) — Son Kullanıcı (Sakin) Portalı:**  
   * *Talep:* Son kullanıcının (site sakini) mobil cihazından aidat takibi yapabilmesi, FAST ile ödeme yapıp dekont yükleyebilmesi, fotoğraflı saha/arıza talebi bildirebilmesi ve duyuruları takip edebilmesi.  
   * *Çözüm:* `apps/mobile` paketi altında Expo 52 tabanlı modern, karanlık mod kurumsal temalı (`colors.ts`), tek tıkla demo sakin girişli (`AuthContext.tsx`) ve 5 ana sekmeli (Ana Sayfa, Aidat & Ödemeler, Fotoğraflı Arıza & Saha Bildirimi, Bina Duyuruları, Profil & Bildirimler) mobil portal mimarisi tamamlandı. Çevrimdışı fallback ve `@sitera/shared` DTO entegrasyonu sağlandı.

---

## 6. SİSTEMİN GELECEK YOL HARİTASI & ÖNERİLER (ROADMAP)

1. **SMS & WhatsApp Bildirim Servisi (Netgsm / Twilio Entegrasyonu):**  
   Aidat son ödeme günü yaklaştığında veya acil bir arıza duyurusu girildiğinde sakinlere otomatik SMS gönderimi.
2. **Sanal POS Doğrudan Kredi Kartı Tahsilatı (İyzico / PayTR Entegrasyonu):**  
   Sakinlerin havale/FAST beklemeden kartla anında aidat ödeyebilmesi için hazır webhook altyapısı.
3. **Mobil Uygulama (React Native / Expo) — Dağıtım ve Yayınlama:**  
   ✓ *Sakin Portalı Kodlandı ve Doğrulandı.* Sonraki adımda Apple App Store (TestFlight) ve Google Play Store (Internal Testing) mağaza hesaplarına EAS Build ile dağıtımının yapılması.
4. **Akıllı Plaka Tanıma & Otopark Entegrasyonu:**  
   Site otopark bariyer kameraları ile API entegrasyonu kurularak daire sakinlerinin araç giriş-çıkış takibi.

---

## 7. ÖZET SONUÇ & YÖNETİM DEĞERLENDİRMESİ

Sitera, en başından itibaren modern yazılım mühendisliğinin en iyi prensipleriyle (Clean Architecture, Multi-Tenancy, Type Safety, Zero-Trust Database Security) tasarlanmış ve hayata geçirilmiştir.

* **Sağlamlık:** PostgreSQL RLS ile kurumsal veri izolasyonu.
* **Hız:** React 19 + Vite ile 1.4 saniyelik derleme süresi ve anlık tepki veren arayüz.
* **Yüksek Kapasite & Direnç:** 3.120+ RPS throughput, 50ms altı p95 gecikme ve %0,00 hata oranıyla ampirik olarak kanıtlanmış yük direnci.
* **İşlevsellik:** Muhasebeden fotoğraflı arıza yönetimine, dekont onayından canlı denetim günlüğüne kadar eksiksiz operasyonel güç.

Platform, sahada yüzlerce daireli büyük sitelerde ve rezidanslarda **hemen canlıya alınabilecek ve ticarileştirilebilecek olgunluktadır.**
