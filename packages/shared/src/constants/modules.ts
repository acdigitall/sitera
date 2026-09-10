import { PlatformModuleDefinition } from '../types/group.js';

export const PLATFORM_MODULE_CATALOG: PlatformModuleDefinition[] = [
  {
    code: 'ANPR_PLATE_RECOGNITION',
    name: 'Plaka Tanıma & Bariyer Otomasyonu',
    shortDescription: 'Sakin araç plakalarını kameradan otomatik okuyup bariyeri açar.',
    detailedDescription:
      'Giriş-çıkış noktalarındaki IP kameralar veya ANPR okuyucular ile entegre çalışır. Kayıtlı sakin plakası algılandığında bariyer otomatik kalkar; yabancı araç girişlerinde güvenliğe anlık görsel bildirim düşer.',
    category: 'iot',
    pricingModel: 'per_unit',
    defaultPrice: 5, // ₺5 / daire / ay
    requiredHardware: 'IP Kamera (RTSP/ONVIF) & Röle Kartı',
    iconName: 'Car',
    badgeText: 'Çok Popüler',
    isPopular: true,
  },
  {
    code: 'GUEST_QR_PASS',
    name: 'Tek Seferlik Misafir QR Geçiş Kodu',
    shortDescription: 'Sakinlerin misafirlerine WhatsApp üzerinden süreli kapı geçiş QR kodu üretmesini sağlar.',
    detailedDescription:
      'Sakin mobil uygulamasından tek tıkla 2 saatlik veya günlük geçerli bir QR kod oluşturup misafirine gönderir. Misafir site kapısındaki QR okuyucuya kodu gösterdiğinde kapı/turnike otomatik açılır ve güvenliğe bilgi gider.',
    category: 'access',
    pricingModel: 'flat_monthly',
    defaultPrice: 200, // ₺200 / ay
    requiredHardware: 'Turnike / Kapı QR Okuyucu Röle',
    iconName: 'QrCode',
    badgeText: 'Hızlı Kurulum',
    isPopular: true,
  },
  {
    code: 'SMART_INTERCOM',
    name: 'Akıllı İnterkom & Cep Telefonundan Kapı Açma',
    shortDescription: 'Zil çaldığında telefon bildirimi ile görüntülü konuşma ve uzaktan kapı otomatiği kontrolü.',
    detailedDescription:
      'Daire içi pahalı interkom panellerine gerek kalmadan, bina kapı zilini doğrudan sakinin cep telefonuna görüntülü arama olarak yönlendirir. Sakin evde olmasa dahi kapıyı kuryeye veya misafirine uzaktan açabilir.',
    category: 'iot',
    pricingModel: 'per_unit',
    defaultPrice: 4, // ₺4 / daire / ay
    requiredHardware: 'SIP Destekli IP İnterkom Paneli',
    iconName: 'PhoneCall',
    badgeText: 'Yüksek Talep',
    isPopular: false,
  },
  {
    code: 'FACILITY_RESERVATION',
    name: 'Sosyal Tesis, Havuz & Kort Rezervasyonu',
    shortDescription: 'Havuz, fitness salonu, tenis kortu veya mangal alanları için saatlik kota ve randevu yönetimi.',
    detailedDescription:
      'Ortak kullanım alanlarının adil paylaşılmasını sağlar. Daire başına haftalık/günlük rezervasyon kotası, kullanım saatleri ve doluluk takvimi sunar. Çakışmaları ve tartışmaları sıfıra indirir.',
    category: 'amenities',
    pricingModel: 'flat_monthly',
    defaultPrice: 250, // ₺250 / ay
    requiredHardware: 'Donanım Gerekmez (Bulut Yazılım)',
    iconName: 'CalendarCheck',
    badgeText: 'Bulut Servisi',
    isPopular: false,
  },
  {
    code: 'VALET_PARKING',
    name: 'Vale & Akıllı Otopark Doluluk Takibi',
    shortDescription: 'Sitedeki kapalı otoparkın doluluk durumunu anlık haritada gösterir, vale teslimatını yönetir.',
    detailedDescription:
      'Blok ve kat bazında boş/dolu park yerlerini sensörlerle veya plaka giriş-çıkış sayımıyla tespit eder. Misafir araçları uygun katlara yönlendirir ve vale park/teslimat süreçlerini dijitalleştirir.',
    category: 'security',
    pricingModel: 'flat_monthly',
    defaultPrice: 300, // ₺300 / ay
    requiredHardware: 'Manyetik Zemin Sensörü / Doluluk Panosu',
    iconName: 'ShieldAlert',
    badgeText: 'Lüks Siteler',
    isPopular: false,
  },
];
