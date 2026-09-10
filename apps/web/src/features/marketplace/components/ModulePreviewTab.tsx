import React from 'react';
import {
  Video,
  SlidersHorizontal,
} from 'lucide-react';
import { PlatformModuleDefinition } from '@sitera/shared';

export interface ModulePreviewTabProps {
  moduleDef: PlatformModuleDefinition;
}

export const ModulePreviewTab: React.FC<ModulePreviewTabProps> = ({ moduleDef }) => {
  const getModuleRules = (code: string) => {
    switch (code) {
      case 'ANPR_PLATE_RECOGNITION':
        return [
          { title: 'Daire Başı Araç Kotası', desc: 'Her daireye izin verilen aktif plaka sayısını (örn. 1 veya 2 araç) tek tıkla sınırlandırabilirsiniz.' },
          { title: 'Borçlu Sakin Kuralı (Opsiyonel)', desc: '3 dönemden fazla aidat borcu olan dairelerin bariyer otomatik geçiş yetkisini kısıtlayabilirsiniz.' },
          { title: 'Fotoğraflı Güvenlik Kaydı', desc: 'Her araç geçişinde plaka görüntüsü ve kamera fotoğrafı 1 yıl boyunca güvenle arşivlenir.' },
          { title: 'Güvenlik Kulübesi Uyarısı', desc: 'Site girişindeki güvenlik ekranına yabancı veya kara listedeki araç uyarısı anında düşer.' },
        ];
      case 'GUEST_QR_PASS':
        return [
          { title: 'Zaman Aşımı Kuralı', desc: 'Üretilen QR kodlar için maksimum geçerlilik süresini (örn: 2 saat veya tek geçişlik) belirleyebilirsiniz.' },
          { title: 'Gece Geçiş Kısıtlaması', desc: 'Gece 00:00 - 06:00 saatleri arasında sakin onayı olmadan misafir QR kodlarının geçişini engelleyebilirsiniz.' },
          { title: 'Kurye & Kargo Protokolü', desc: 'Getir, Yemeksepeti ve kurye geçişleri sistemde ayrı etiketlenir ve doğrudan kapı loguna işlenir.' },
          { title: 'Turnike & Manyetik Kilit Kontrolü', desc: 'Farklı kapı ve turnikeler için yetkili QR geçiş noktalarını ayrı ayrı tanımlayabilirsiniz.' },
        ];
      case 'SMART_INTERCOM':
        return [
          { title: 'Daire İçi Sınırsız Eşleşme', desc: 'Aynı dairede ikamet eden tüm aile fertlerinin telefonları eş zamanlı zil çağrısı alabilir.' },
          { title: 'Sessiz Saat & Rahatsız Etme', desc: 'Sakinler dilediklerinde gece saatleri için zil çağrılarını sessize alabilir.' },
          { title: 'Fotoğraflı Ziyaretçi Arşivi', desc: 'Zile basıldığı anda dış panelin çektiği fotoğraf sakinin uygulamasına ve yönetici loguna kaydedilir.' },
          { title: 'Güvenlik & Yönetici Acil Hattı', desc: 'Dış panelden doğrudan güvenlik kulübesi veya bina görevlisine tek tuşla çağrı başlatılabilir.' },
        ];
      case 'FACILITY_RESERVATION':
        return [
          { title: 'Haftalık Adil Kota Sınırı', desc: 'Bir dairenin tüm haftayı kapatmasını önlemek için daire başına haftalık kullanım saati (örn: 2 saat) belirlenir.' },
          { title: 'İptal & İade Süresi Kuralı', desc: 'Rezervasyon saatinden en geç 2 saat öncesine kadar cezasız iptal kuralı konulabilir.' },
          { title: 'Borçlu Daire Engeli', desc: 'Aidat borcu olan dairelerin sosyal tesis randevusu alması otomatik kısıtlanabilir.' },
          { title: 'Otomatik Aydınlatma Entegrasyonu', desc: 'Opsiyonel: Rezervasyon başladığında tenis kortu ışıkları otomatik yanar, süre bitince söner.' },
        ];
      case 'VALET_PARKING':
        return [
          { title: 'Sakin Başı Sabit Park Kotası', desc: 'Her dairenin hakkı olan araç adedi otopark kapasitesine göre tanımlanır.' },
          { title: 'Misafir Park Kapasite Ayrımı', desc: 'Misafir araçlar için ayrılan kontenjan dolduğunda kapıda otomatik misafir kabulü durdurulur.' },
          { title: 'Hatalı Park & Çift Sıra İhlali', desc: 'Park ihlali yapan plakalar güvenlik kulübesi ekranında anlık uyarıyla listelenir.' },
          { title: 'Giriş LED Bilgi Tabelası Entegrasyonu', desc: 'Otopark kapısında kalan boş yer sayısı dış tabelada anlık olarak yayınlanır.' },
        ];
      default:
        return [
          { title: 'Esnek Yetkilendirme', desc: 'Modül kullanım kurallarını site bütçenize ve daire ihtiyaçlarınıza göre yönetebilirsiniz.' },
          { title: 'Ayrıntılı Güvenlik Günlüğü', desc: 'Tüm sistem hareketleri saatli ve kullanıcı bilgili olarak güvenle saklanır.' },
        ];
    }
  };

  const rules = getModuleRules(moduleDef.code);

  return (
    <div className="space-y-6">
      {/* MODÜL 1: PLAKA TANIMA CANLI LOG TABLOSU */}
      {moduleDef.code === 'ANPR_PLATE_RECOGNITION' && (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Site Ana Giriş Bariyeri · Son Araç Geçiş Logları
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Kamera plakayı okuduğunda sistemin otomatik oluşturduğu canlı güvenlik kayıtları
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
              Kamera Aktif · 0.3s
            </span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/40">
                <th className="py-3 px-4">Tarih / Saat</th>
                <th className="py-3 px-4">Plaka</th>
                <th className="py-3 px-4">Daire / Sakin</th>
                <th className="py-3 px-4">Kapı Noktası</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono text-slate-500">Bugün 14:32</td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-xs shadow-2xs">
                    34 SBR 890
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900">Ahmet Yılmaz</span>
                  <span className="text-slate-400 ml-1.5">(Daire 12)</span>
                </td>
                <td className="py-3 px-4 text-slate-600">Ana Giriş Bariyeri</td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                    Bariyer Açıldı ✓
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono text-slate-500">Bugün 14:15</td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-xs shadow-2xs">
                    06 BJK 1903
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900">Mehmet Öz</span>
                  <span className="text-slate-400 ml-1.5">(Daire 4)</span>
                </td>
                <td className="py-3 px-4 text-slate-600">Kapalı Otopark</td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                    Bariyer Açıldı ✓
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono text-slate-500">Bugün 13:50</td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-xs shadow-2xs">
                    34 MTR 45
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900">Ali Kaya</span>
                  <span className="text-slate-400 ml-1.5">(Daire 7)</span>
                </td>
                <td className="py-3 px-4 text-slate-600">Ana Giriş Bariyeri</td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                    Bariyer Açıldı ✓
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-rose-50/40 transition-colors bg-rose-50/20">
                <td className="py-3 px-4 font-mono text-slate-500">Bugün 13:10</td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-rose-900 bg-white border border-rose-300 px-2 py-0.5 rounded text-xs shadow-2xs">
                    34 YBN 999
                  </span>
                </td>
                <td className="py-3 px-4 text-rose-700 font-semibold">Tanımsız Araç (Kayıtsız)</td>
                <td className="py-3 px-4 text-slate-600">Ana Giriş Bariyeri</td>
                <td className="py-3 px-4 text-right">
                  <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                    Açılmadı · Uyarı ⚠️
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Geçiş anında aracın güvenlik kamerası fotoğrafı 1 yıl boyunca arşivlenir.</span>
            <span className="font-semibold text-slate-700">Fotoğraflı Güvenlik Arşivi</span>
          </div>
        </div>
      )}

      {/* MODÜL 2: MİSAFİR QR GEÇİŞ LOGLARI */}
      {moduleDef.code === 'GUEST_QR_PASS' && (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Yaya Girişi &amp; Turnike · Misafir QR Geçiş Kayıtları
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Sakinlerin WhatsApp ile ürettiği süreli QR kodların kapıdaki anlık kullanım dökümü
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
              Turnike Okuyucu Devrede
            </span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/40">
                <th className="py-3 px-4">Kod No</th>
                <th className="py-3 px-4">Ziyaretçi Tanımı</th>
                <th className="py-3 px-4">Davet Eden Sakin</th>
                <th className="py-3 px-4">Geçerlilik</th>
                <th className="py-3 px-4 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-800">QR-9841</td>
                <td className="py-3 px-4 font-semibold text-slate-900">Aras Kargo Kuryesi</td>
                <td className="py-3 px-4 text-slate-600">Daire 5 · Selin Ak</td>
                <td className="py-3 px-4 text-slate-500">Tek Geçişlik (14:20)</td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                    Kapı Açıldı ✓
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-800">QR-9838</td>
                <td className="py-3 px-4 font-semibold text-slate-900">Misafir: Burak Demir</td>
                <td className="py-3 px-4 text-slate-600">Daire 14 · Canan Yılmaz</td>
                <td className="py-3 px-4 text-slate-500">2 Saat Süreli</td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                    Geçiş Yapıldı ✓
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition-colors bg-slate-50/40">
                <td className="py-3 px-4 font-mono font-bold text-slate-400">QR-9812</td>
                <td className="py-3 px-4 text-slate-500">Getir Su Siparişi</td>
                <td className="py-3 px-4 text-slate-400">Daire 2 · Eren Kurt</td>
                <td className="py-3 px-4 text-slate-400">Süresi Doldu</td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    Kullanım Dışı
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Güvenlik görevlisinin daireleri telefonla arama yükünü tamamen ortadan kaldırır.</span>
            <span className="font-semibold text-slate-700">Süreli &amp; Otomatik İmha</span>
          </div>
        </div>
      )}

      {/* MODÜL 3: AKILLI İNTERKOM ARAMA EKRANI */}
      {moduleDef.code === 'SMART_INTERCOM' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Akıllı Diyafon · Mobil Canlı Arama Arayüzü
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Dış kapı ziline basıldığında sakinin telefonuna düşen çağrı ekranı
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
              Daire İçi Sıfır Kablo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  CANLI ÇAĞRI
                </span>
                <span>DIŞ PANEL</span>
              </div>

              <div className="p-3 bg-slate-800 rounded-lg flex items-center gap-3 border border-slate-700">
                <div className="w-11 h-11 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200 shrink-0">
                  <Video size={22} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Bina Dış Giriş Kapısı</div>
                  <div className="text-xs text-slate-300 mt-0.5">Daire 12 tuşlandı · Kurye Kapıda</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-colors cursor-pointer"
                >
                  ✓ Kapıyı Aç
                </button>
                <button
                  type="button"
                  className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold text-center transition-colors cursor-pointer border border-slate-700"
                >
                  Görüntülü Konuş
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <strong className="font-bold text-slate-900 block mb-1">Kargonuz Asla Geri Dönmez:</strong>
                İşteyken veya evde yokken zil çaldığında telefonunuza arama gelir; kuryeyle konuşup "Paketi kapıya bırakın" diyerek dış kapıyı cepten açabilirsiniz.
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <strong className="font-bold text-slate-900 block mb-1">Daire Başına Tamir Masrafı Yoktur:</strong>
                Eski diyafon arızalarında daire başına binlerce liralık ekran tamir parası toplanmaz; mevcut akıllı telefonlar kullanılır.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODÜL 4: SOSYAL TESİS REZERVASYON ÇİZELGESİ */}
      {moduleDef.code === 'FACILITY_RESERVATION' && (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Tenis Kortu &amp; Sosyal Tesis · Günlük Rezervasyon Çizelgesi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Daire başı haftalık kota kuralıyla yönetilen canlı randevu takvimi
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
              Kota: Haftalık 2 Saat / Daire
            </span>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
              <div className="font-mono text-slate-500 font-semibold">16:00 - 17:00</div>
              <div className="font-semibold text-slate-700 mt-1">Dolu (Daire 8)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ahmet Y.</div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
              <div className="font-mono text-slate-500 font-semibold">17:00 - 18:00</div>
              <div className="font-semibold text-slate-700 mt-1">Dolu (Daire 4)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Selin K.</div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50/60 text-center shadow-2xs">
              <div className="font-mono text-emerald-800 font-bold">18:00 - 19:00</div>
              <div className="font-bold text-emerald-800 mt-1">MÜSAİT</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Tek tıkla rezerve et</div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50/60 text-center shadow-2xs">
              <div className="font-mono text-emerald-800 font-bold">19:00 - 20:00</div>
              <div className="font-bold text-emerald-800 mt-1">MÜSAİT</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Tek tıkla rezerve et</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Bir dairenin tüm gün alanı kapatıp diğer sakinleri mağdur etmesini önler.</span>
            <span className="font-semibold text-slate-700">Adil Kota Yönetimi</span>
          </div>
        </div>
      )}

      {/* MODÜL 5: OTOPARK DOLULUK TAKİBİ */}
      {moduleDef.code === 'VALET_PARKING' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Kapalı Otopark · Canlı Doluluk &amp; Kapasite Paneli
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Sakinlerin eve dönmeden içeride boş yer olup olmadığını gördüğü sayaç ekranı
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
              Sensör Takibi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs text-slate-500 font-semibold uppercase">Toplam Kapasite</div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">50 Araç</div>
              <div className="text-xs text-slate-400 mt-0.5">40 Sakin + 10 Misafir</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs text-slate-500 font-semibold uppercase">Şu An Park Eden</div>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">42 Araç</div>
              <div className="text-xs text-amber-700 font-semibold mt-0.5">%84 Doluluk Oranı</div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <div className="text-xs text-emerald-800 font-semibold uppercase">Kalan Boş Sakin Yeri</div>
              <div className="text-2xl font-bold text-emerald-900 font-mono mt-1">8 Boş Yer</div>
              <div className="text-xs text-emerald-700 mt-0.5">Girişe Uygun</div>
            </div>
          </div>
        </div>
      )}

      {/* YÖNETİCİ KURALLARI KUTUSU */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 mb-3 flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-slate-700" />
          <span>Site Yöneticisi İçin Esnek Kurallar &amp; Kontroller</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          {rules.map((rule, idx) => (
            <div key={idx} className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-lg space-y-1">
              <strong className="font-bold text-slate-900 block">{rule.title}:</strong>
              {rule.desc}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
