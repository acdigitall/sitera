import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalDocumentEntity } from './legal-document.entity';
import { UpdateLegalDocumentDto } from '@sitera/shared';

export const DEFAULT_TERMS_CONTENT = `# SİTERA YÖNETİM PLATFORMU KULLANICI SÖZLEŞMESİ

**Son Güncelleme:** 10 Eylül 2026  
**Yürürlük Tarihi:** 10 Eylül 2026  
**Sürüm:** v2.4 (KMK & KVKK Uyumlu)

---

### 1. TARAFLAR VE SÖZLEŞMENİN KAPSAMI
İşbu Kullanıcı Sözleşmesi ("Sözleşme"), **Sitera Teknoloji A.Ş.** ("Sitera") ile Sitera Akıllı Yaşam ERP ve Site Yönetim Sistemi'ne erişim sağlayan, üye olan ve sistemi kullanan gerçek veya tüzel kişiler ("Kullanıcı", "Site Yöneticisi", "Kat Maliki", "Kiracı" veya "Bağımsız Bölüm Sakini") arasında akdedilmiştir.

Sitera platformu; 634 sayılı Kat Mülkiyeti Kanunu ("KMK") ve ilgili mevzuat tahtında toplu konut, rezidans, site ve iş merkezi yönetimlerinin işletme defteri, aidat tahakkuku, dijital banka entegrasyonu, sayaç okuma, plaka tanıma ve sakin iletişim süreçlerini dijitalleştiren bir bulut platformudur.

---

### 2. HİZMETİN KULLANIM ESASLARI VE HESAP GÜVENLİĞİ
1. Kullanıcı, sisteme kayıt olurken ve giriş yaparken sağladığı ad, soyad, T.C. Kimlik / Vergi Numarası, telefon, e-posta, daire no ve araç plaka bilgilerinin doğru, eksiksiz ve güncel olduğunu kabul ve taahhüt eder.
2. Kullanıcı hesabı kişiye özeldir. Kullanıcı şifresini ve tek kullanımlık doğrulama kodlarını üçüncü şahıslarla paylaşamaz. Hesabın yetkisiz kişilerce kullanılmasından doğan sorumluluk doğrudan Kullanıcı'ya aittir.
3. Site Yöneticileri, bağımsız bölümlere ilişkin aidat, ortak gider ve işletme avansı tahakkuklarını kat malikleri kurulu kararlarına ve KMK hükümlerine uygun olarak girmekle yükümlüdür.

---

### 3. FİNANSAL İŞLEMLER VE ONLİNE ÖDEME
1. Sitera platformu üzerinden gerçekleştirilen kredi kartı ile aidat ve masraf tahsilatları, lisanslı ödeme kuruluşları ve bankaların 256-Bit SSL ve 3D Secure güvenli ödeme altyapıları üzerinden gerçekleşir.
2. Sitera, tahsil edilen fonları doğrudan ilgili site veya apartman yönetiminin banka hesabına aktarır; herhangi bir fon tutma veya mevduat toplama faaliyeti yürütmez.
3. Hatalı veya mükerrer ödemelerin iadesi, ilgili bina veya site yönetiminin onay ve talimatı doğrultusunda gerçekleştirilir.

---

### 4. FİKRİ MÜLKİYET HAKLARI
Sitera yazılımı, web ve mobil arayüzleri, algoritmaları, logoları, grafik tasarımları ve veritabanı mimarisi Sitera Teknoloji A.Ş.'nin mülkiyetindedir. Platformun tersine mühendislik (reverse engineering) yöntemiyle kopyalanması, kaynak kodunun çözümlenmesi veya izinsiz çoğaltılması kesinlikle yasaktır.

---

### 5. SÖZLEŞME DEĞİŞİKLİKLERİ VE YÜRÜRLÜK
Sitera, mevzuat değişiklikleri veya sistemsel gereksinimler doğrultusunda işbu Sözleşme hükümlerini dilediği zaman güncelleme hakkını saklı tutar. Güncel sözleşme platform üzerinde yayınlandığı andan itibaren tüm kullanıcılar için bağlayıcı hale gelir.
`;

export const DEFAULT_KVKK_CONTENT = `# SİTERA AKILLI YAŞAM PLATFORMU 
## 6698 SAYILI KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) AYDINLATMA METNİ

**Veri Sorumlusu:** Sitera Teknoloji A.Ş. & İlgili Site/Apartman Yönetimi  
**Son Güncelleme:** 10 Eylül 2026  
**Sürüm:** v2.4

---

### 1. VERİ SORUMLUSUNUN KİMLİĞİ
6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; veri sorumlusu sıfatıyla **Sitera Teknoloji A.Ş.** ("Sitera") ve hizmet aldığınız **Bağlı Bulunduğunuz Site / Toplu Konut / Apartman Yönetimi** tarafından aşağıda açıklanan çerçevede işlenmektedir.

---

### 2. İŞLENEN KİŞİSEL VERİLERİNİZ
Sitera Akıllı Yaşam ERP altyapısı üzerinden toplanan kişisel verileriniz şunlardır:
- **Kimlik Bilgileri:** Ad, soyad, T.C. kimlik numarası, doğum tarihi.
- **İletişim Bilgileri:** Telefon numarası, e-posta adresi, ikamet adresi.
- **Mülkiyet & Bağımsız Bölüm Bilgileri:** Blok, kat, daire/kapı numarası, maliklik veya kiracılık statüsü, hisse oranları.
- **Finansal Bilgiler:** Aidat ve avans tahakkukları, gecikme tazminatları, ödeme geçmişi, banka dekontları, borç/alacak bakiyeleri.
- **Fiziksel Mekan Güvenliği:** Plaka tanıma sistemi kayıtları, otopark giriş-çıkış logları, akıllı interkom arama logları, bina güvenlik kamerası görüntüleri.
- **İşlem Güvenliği:** IP adresleri, kullanıcı oturum kayıtları, denetim (audit) logları.

---

### 3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI
Toplanan kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
1. 634 sayılı Kat Mülkiyeti Kanunu ("KMK") kapsamında site ve apartman yönetiminin yasal defterlerinin tutulması, aidat ve ortak gider paylaşımlarının yapılması,
2. Site sakinlerinin portala güvenli erişiminin sağlanması ve bina içi bildirim/duyuruların iletilmesi,
3. Site güvenliğinin temini, bariyer ve plaka tanıma otomasyonunun işletilmesi,
4. Borçlu bağımsız bölümlere ilişkin yasal icra takip ve bildirim süreçlerinin yürütülmesi,
5. Bilgi güvenliği ve denetim loglarının tutulması (5651 sayılı Kanun yükümlülükleri).

---

### 4. KİŞİSEL VERİLERİN AKTARILMASI
Kişisel verileriniz; kanunen yetkili kamu kurum ve kuruluşlarına, adli mercilere, bankalara, lisanslı ödeme ve e-fatura kuruluşlarına, KMK uyarınca genel kurul ve denetim raporlamalarında kat maliklerine mevzuatın izin verdiği sınırlar dahilinde aktarılabilir.

---

### 5. HUKUKİ SEBEPLER VE TOPLAMA YÖNTEMİ
Kişisel verileriniz; KVKK Madde 5/2-a (Kanunlarda açıkça öngörülmesi), 5/2-c (Sözleşmenin kurulması ve ifası), 5/2-ç (Veri sorumlusunun hukuki yükümlülüğü) ve 5/2-f (Meşru menfaat) hukuki sebeplerine dayalı olarak web portalı, mobil uygulama ve akıllı donanımlar aracılığıyla otomatik yöntemlerle toplanmaktadır.

---

### 6. KVKK MADDE 11 KAPSAMINDAKİ HAKLARINIZ
KVKK'nın 11. maddesi uyarınca veri sahipleri;
- Kişisel verilerinin işlenip işlenmediğini öğrenme,
- İşlenmişse buna ilişkin bilgi talep etme,
- Verilerin amacına uygun kullanılıp kullanılmadığını öğrenme,
- Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,
- Eksik veya yanlış işlenmişse düzeltilmesini isteme,
- KVKK 7. maddesi uyarınca silinmesini veya yok edilmesini isteme haklarına sahiptir.

Başvurularınızı ilgili site yönetiminiz veya **kvkk@sitera.com** adresimiz üzerinden yazılı olarak iletebilirsiniz.
`;

@Injectable()
export class LegalService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LegalService.name);

  constructor(
    @InjectRepository(LegalDocumentEntity)
    private readonly legalRepo: Repository<LegalDocumentEntity>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaultsIfMissing();
  }

  /**
   * Sistem başlangıcında Kullanıcı Sözleşmesi ve KVKK metinleri veritabanında yoksa otomatik tohumlar.
   */
  async seedDefaultsIfMissing(): Promise<void> {
    try {
      const termsExist = await this.legalRepo.findOne({ where: { type: 'terms' } });
      if (!termsExist) {
        await this.legalRepo.save({
          type: 'terms',
          title: 'Sitera Kullanıcı Sözleşmesi',
          content: DEFAULT_TERMS_CONTENT,
          version: 'v2.4 - Eylül 2026',
          isActive: true,
        });
        this.logger.log('Varsayılan Kullanıcı Sözleşmesi başarıyla tohumlandı.');
      }

      const kvkkExist = await this.legalRepo.findOne({ where: { type: 'kvkk' } });
      if (!kvkkExist) {
        await this.legalRepo.save({
          type: 'kvkk',
          title: '6698 Sayılı KVKK Aydınlatma Metni',
          content: DEFAULT_KVKK_CONTENT,
          version: 'v2.4 - Eylül 2026',
          isActive: true,
        });
        this.logger.log('Varsayılan KVKK Aydınlatma Metni başarıyla tohumlandı.');
      }
    } catch (err: any) {
      this.logger.error(`LegalDocument tohumlama hatası: ${err.message}`);
    }
  }

  /**
   * Belirli bir yasal belgeyi getirir (Halka açık).
   */
  async getDocument(type: 'terms' | 'kvkk'): Promise<LegalDocumentEntity> {
    const doc = await this.legalRepo.findOne({
      where: { type, isActive: true },
    });

    if (!doc) {
      // Veritabanında yoksa dinamik varsayılanı döndür
      return {
        id: 'default',
        type,
        title: type === 'terms' ? 'Sitera Kullanıcı Sözleşmesi' : '6698 Sayılı KVKK Aydınlatma Metni',
        content: type === 'terms' ? DEFAULT_TERMS_CONTENT : DEFAULT_KVKK_CONTENT,
        version: 'v2.4 - Eylül 2026',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return doc;
  }

  /**
   * Tüm yasal belgeleri listeler (Süper Admin).
   */
  async getAllDocuments(): Promise<LegalDocumentEntity[]> {
    return this.legalRepo.find({
      order: { type: 'ASC' },
    });
  }

  /**
   * Süper Admin tarafından belgeyi günceller.
   */
  async updateDocument(
    type: 'terms' | 'kvkk',
    dto: UpdateLegalDocumentDto,
    adminUserId?: string,
  ): Promise<LegalDocumentEntity> {
    let doc = await this.legalRepo.findOne({ where: { type } });

    if (!doc) {
      doc = this.legalRepo.create({
        type,
        title: dto.title || (type === 'terms' ? 'Sitera Kullanıcı Sözleşmesi' : 'KVKK Aydınlatma Metni'),
        content: dto.content || (type === 'terms' ? DEFAULT_TERMS_CONTENT : DEFAULT_KVKK_CONTENT),
        version: dto.version || 'v1.0',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        updatedBy: adminUserId || null,
      });
    } else {
      if (dto.title !== undefined) doc.title = dto.title;
      if (dto.content !== undefined) doc.content = dto.content;
      if (dto.version !== undefined) doc.version = dto.version;
      if (dto.isActive !== undefined) doc.isActive = dto.isActive;
      doc.updatedBy = adminUserId || null;
    }

    const saved = await this.legalRepo.save(doc);
    this.logger.log(`Yasal metin güncellendi: ${type} (Sürüm: ${saved.version}) - Güncelleyen: ${adminUserId || 'Süper Admin'}`);
    return saved;
  }

  /**
   * Belgeyi orijinal varsayılan şablona sıfırlar (Süper Admin).
   */
  async resetToDefault(type: 'terms' | 'kvkk', adminUserId?: string): Promise<LegalDocumentEntity> {
    const defaultContent = type === 'terms' ? DEFAULT_TERMS_CONTENT : DEFAULT_KVKK_CONTENT;
    const defaultTitle = type === 'terms' ? 'Sitera Kullanıcı Sözleşmesi' : '6698 Sayılı KVKK Aydınlatma Metni';

    return this.updateDocument(
      type,
      {
        title: defaultTitle,
        content: defaultContent,
        version: 'v2.4 (Orijinal Şablon)',
        isActive: true,
      },
      adminUserId,
    );
  }
}
