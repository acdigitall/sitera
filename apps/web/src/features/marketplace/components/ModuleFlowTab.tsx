import React from 'react';
import { PlatformModuleDefinition } from '@sitera/shared';

export interface ModuleFlowTabProps {
  moduleDef: PlatformModuleDefinition;
}

export const ModuleFlowTab: React.FC<ModuleFlowTabProps> = ({ moduleDef }) => {
  const getModuleFlow = (code: string) => {
    switch (code) {
      case 'ANPR_PLATE_RECOGNITION':
        return [
          { step: 1, title: 'Sakin Plakasını Tanımlar', desc: 'Sakin Sitera mobil uygulamasını açarak dairesine ait araç plakasını tanımlar. Yöneticiye liste toplama zahmeti kalmaz.' },
          { step: 2, title: 'Kapıda 0.3 Saniyede Otomatik Eylem', desc: 'Araç kapıya yaklaştığında kamera plakayı okur ve bariyer otomatik kalkar. Kumanda arama ve pil bitme devri biter.' },
          { step: 3, title: 'Sakine Anlık Güvenlik Bildirimi', desc: 'Araç siteye giriş yaptığında sakinin telefonuna "34 SBR 890 plakalı aracınız siteye giriş yaptı" bildirimi düşer.' },
        ];
      case 'GUEST_QR_PASS':
        return [
          { step: 1, title: 'Sakin QR Kodu Oluşturur', desc: 'Sakin tek tıkla kurye veya misafiri için WhatsApp üzerinden 2 saatlik geçici geçiş bağlantısı paylaşır.' },
          { step: 2, title: 'Turnike veya Kapıdaki Okuyucuya Gösterir', desc: 'Misafir kapıdaki optik okuyucuya telefon ekranındaki QR kodu gösterir; kapı 0.2 saniyede açılır.' },
          { step: 3, title: 'Güvenlik Araması Olmadan Bildirim', desc: 'Güvenliğin daireyi telefonla arama yükü kalkar; sakinin telefonuna "Misafiriniz turnikeden geçti" bildirimi iletilir.' },
        ];
      case 'SMART_INTERCOM':
        return [
          { step: 1, title: 'Ziyaretçi Zile Basar', desc: 'Bina ana girişindeki şık dış panelden daire numarası tuşlandığında sistem bulut üzerinden çağrı başlatır.' },
          { step: 2, title: 'Telefon Ekranında Görüntülü Arama Çalar', desc: 'Sakin evde olmasa bile (ofiste, tatilde, markette) telefonunda canlı yüksek çözünürlüklü görüntü açılır.' },
          { step: 3, title: 'Konuşup Cepten Dış Kapıyı Açar', desc: 'Kuryeyle konuşarak "Paketi kapıya bırakın" der ve ekrandaki tek butonla bina dış kapısını açar.' },
        ];
      case 'FACILITY_RESERVATION':
        return [
          { step: 1, title: 'Sakin Müsait Saatleri İnceler', desc: 'Sakin Sitera uygulamasından tenis kortu veya sosyal tesisin haftalık boşluk tablosunu görüntüler.' },
          { step: 2, title: 'Tek Tıkla Randevu Alır', desc: 'Uygun saat dilimini seçer; sistem daire kotasını ve aidat durumunu anında doğrulayarak saati kilitler.' },
          { step: 3, title: 'Geçiş Yetkisi Aktifleşir', desc: 'Randevu saatinde sakinin tesis kapı şifresi veya QR kodu aktifleşir; komşular arası sıra tartışması son bulur.' },
        ];
      case 'VALET_PARKING':
        return [
          { step: 1, title: 'Sensör ve Kameralar Sayım Yapar', desc: 'Giriş ve çıkış noktalarındaki algılayıcılar otoparktaki anlık araç adedini sürekli günceller.' },
          { step: 2, title: 'Sakin Yoldayken Boş Yeri Görür', desc: 'Sakin eve dönerken cep telefonundan otoparkta kaç boş yer olduğunu görerek park stresinden kurtulur.' },
          { step: 3, title: 'Dolu Olduğunda Kapıda Uyarı', desc: 'Kapasite dolduğunda girişteki bariyer uyarısı "OTOPARK DOLU" moduna geçer ve içeriye gereksiz yığılmayı önler.' },
        ];
      default:
        return [
          { step: 1, title: 'Sistem Yapılandırması', desc: 'Site yöneticisi yönetim panelinden kuralları belirler.' },
          { step: 2, title: 'Sakin Kullanımı', desc: 'Sakinler mobil uygulama üzerinden servisten yararlanır.' },
          { step: 3, title: 'Operasyonel Raporlama', desc: 'Ay sonunda kullanım istatistikleri ve aidat dağılımı otomatik hazırlanır.' },
        ];
    }
  };

  const flowSteps = getModuleFlow(moduleDef.code);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">Sakinler ve Güvenlik Sistemi Nasıl Kullanır?</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {moduleDef.name} devreye alındığında apartman sakinlerinin ve yönetimin günlük operasyon adımları
        </p>
      </div>

      <div className="space-y-4 text-xs text-slate-700">
        {flowSteps.map((item) => (
          <div key={item.step} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {item.step}
            </div>
            <div>
              <strong className="font-bold text-slate-900 text-sm block">{item.title}:</strong>
              <span className="leading-relaxed mt-0.5 block">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
