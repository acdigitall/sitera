import React from 'react';
import { PlatformModuleDefinition } from '@sitera/shared';

export interface ModuleHardwareTabProps {
  moduleDef: PlatformModuleDefinition;
}

export const ModuleHardwareTab: React.FC<ModuleHardwareTabProps> = ({ moduleDef }) => {
  const getHardwareData = (code: string) => {
    switch (code) {
      case 'ANPR_PLATE_RECOGNITION':
        return {
          items: [
            { title: 'Mevcut Kameralar', highlight: 'Hikvision, Dahua, Uniview ve Tüm RTSP Kameralar', desc: 'Sitenizin girişinde takılı olan IP kameralar doğrudan Sitera IoT bulut servisine bağlanabilir. Yeni kamera alma zorunluluğu yoktur.' },
            { title: 'Bariyer Motoru', highlight: 'Nice, BFT, White Rose, Came ve Tüm Motorlar', desc: 'Bariyer anakartına 15 dakika içinde 1 adet Sitera IoT Kuru Kontak Rölesi takılır. Motor garantisini bozmaz.' },
          ],
          support: 'Montaj ve kamera açı kalibrasyonu Sitera teknik saha ekibi tarafından 1 iş günü içinde tamamlanır.',
          duration: '1 İş Günü',
        };
      case 'GUEST_QR_PASS':
        return {
          items: [
            { title: 'Optik QR / Barkod Okuyucu', highlight: 'Wiegand 26/34 & TCP/IP Standart Turnike Okuyucular', desc: 'Yaya demir kapısı veya bina lobisindeki turnike üzerine hava koşullarına dayanıklı IP65 okuyucu monte edilir.' },
            { title: 'Bina Kapı Otomatiği & Turnike', highlight: '12V/24V Tüm Manyetik Kilit ve Bas-Aç Sistemleri', desc: 'Mevcut apartman kapı otomatiğine doğrudan Sitera akıllı röle ünitesi bağlanır; ekstra kablo çekilmez.' },
          ],
          support: 'Okuyucu montajı ve bina otomatiği entegrasyonu Sitera teknisyenleri tarafından yarım iş gününde devreye alınır.',
          duration: 'Yarım Gün',
        };
      case 'SMART_INTERCOM':
        return {
          items: [
            { title: 'Dış Panel Zil & Kamera', highlight: 'SIP / IP Tabanlı Gece Görüşlü Dış Mekan Paneli', desc: 'Bina ana girişine dokunmatik tuş takımlı, HD kameralı ve hava şartlarına dayanıklı şık dış panel takılır.' },
            { title: 'Daire İçi Sıfır Ekipman & Sıfır Kablo', highlight: 'Mevcut Akıllı Telefonlar (iOS & Android)', desc: 'Daire içine eski tip hantal diyafon ekranları konulmaz; binlerce liralık ekran arızası ve kablolama masrafı sıfırlanır.' },
          ],
          support: 'Dış panel montajı ve bina internet bağlantısı 1 iş gününde tamamlanarak daireler anında sisteme eklenir.',
          duration: '1 İş Günü',
        };
      case 'FACILITY_RESERVATION':
        return {
          items: [
            { title: '%100 Bulut Tabanlı Yazılım', highlight: 'Ekstra Hiçbir Donanım Zorunluluğu Yoktur', desc: 'Rezervasyon modülü doğrudan mobil uygulama ve yönetici paneli üzerinden sıfır donanım maliyetiyle anında çalışır.' },
            { title: 'Opsiyonel Kapı & Aydınlatma Otomasyonu', highlight: 'PIN Kodlu Kilit & Akıllı Röle Desteği', desc: 'İstenirse tesis kapısına şifreli akıllı kilit veya kort ışıklarını saatine göre açan Sitera IoT rölesi eklenebilir.' },
          ],
          support: 'Aktivasyon anında gerçekleşir; kurallar ve tesis saatleri yönetici tarafından panelden tanımlanır.',
          duration: 'Anında Devrede',
        };
      case 'VALET_PARKING':
        return {
          items: [
            { title: 'Giriş / Çıkış Algılama Donanımı', highlight: 'Plaka Tanıma Kameraları veya Taban Döngü Sensörleri', desc: 'Mevcut otopark bariyerindeki kameralar veya geçiş sensörleri sayısal veri üretir.' },
            { title: 'Giriş LED Kapasite Tabelası', highlight: 'RS485 / TCP/IP Dış Mekan LED Matris Ekran', desc: 'Otopark girişine yerleştirilen tabela ile sürücülere anlık boş yer sayısı gösterilir.' },
          ],
          support: 'Kapasite sensör kalibrasyonu ve tabela bağlantısı Sitera teknik ekibi tarafından 1 iş gününde tamamlanır.',
          duration: '1 İş Günü',
        };
      default:
        return {
          items: [
            { title: 'Bulut Entegrasyonu', highlight: 'Sitera IoT Platformu', desc: 'Sisteme kolayca bağlanır.' },
          ],
          support: '1 iş gününde devreye alınır.',
          duration: '1 İş Günü',
        };
    }
  };

  const hw = getHardwareData(moduleDef.code);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900">Donanım Uyumu &amp; Kurulum Şeması</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Sitenizde sıfırdan pahalı sistemler kurmanıza gerek yoktur; mevcut donanımlarınız değerlendirilir.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {hw.items.map((item, idx) => (
            <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">{item.title}</span>
              <div className="font-bold text-slate-900 text-sm">{item.highlight}</div>
              <p className="text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-center justify-between">
          <div>
            <strong className="font-bold block text-sm text-slate-900">Anahtar Teslim Kurulum Desteği:</strong>
            {hw.support}
          </div>
          <span className="text-xs font-semibold text-slate-600 shrink-0 ml-4">{hw.duration}</span>
        </div>
      </div>
    </div>
  );
};
