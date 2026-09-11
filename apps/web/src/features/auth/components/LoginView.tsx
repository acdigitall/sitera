import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faCity,
  faHouse,
  faKey,
  faShieldHalved,
  faCreditCard,
  faCar,
  faBell,
  faBolt,
  faWater,
  faQrcode,
  faUsers,
  faBoxesStacked,
  faVideo,
  faFileInvoiceDollar,
  faWrench,
  faTree,
  faElevator,
  faPhone,
  faLock,
  faReceipt,
  faDoorOpen,
  faCamera,
  faWifi,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../../../components/common/Spinner';
import { LegalModal } from '../../legal';
import { LegalDocumentType } from '@sitera/shared';

// Kullanıcının paylaştığı doodle wallpaper desenine uygun, site yönetim ikonları kümesi
const SITE_ICONS = [
  faBuilding,
  faCity,
  faHouse,
  faKey,
  faShieldHalved,
  faCreditCard,
  faCar,
  faBell,
  faBolt,
  faWater,
  faQrcode,
  faUsers,
  faBoxesStacked,
  faVideo,
  faFileInvoiceDollar,
  faWrench,
  faTree,
  faElevator,
  faPhone,
  faLock,
  faReceipt,
  faDoorOpen,
  faCamera,
  faWifi,
];

// Kullanıcının görselindeki gibi farklı boyut, açı ve saydamlıklarda 120 adet dağıtılmış vektör ikon
const WALLPAPER_ITEMS = Array.from({ length: 120 }, (_, index) => {
  const icon = SITE_ICONS[index % SITE_ICONS.length];
  const size = 18 + ((index * 7) % 22); // 18px - 39px
  const rotate = -42 + ((index * 23) % 85); // -42deg - +42deg
  const opacity = 0.16 + (((index * 13) % 25) / 100); // 0.16 - 0.40
  const dx = -6 + ((index * 11) % 13); // -6px - +6px
  const dy = -6 + ((index * 17) % 13); // -6px - +6px
  return { icon, size, rotate, opacity, dx, dy };
});

export const LoginView: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalDocumentType | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Lütfen e-posta adresinizi giriniz.');
      return;
    }
    if (!password) {
      setLocalError('Lütfen şifrenizi giriniz.');
      return;
    }

    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      setLocalError(err.message || 'Giriş yapılamadı. E-posta veya şifrenizi kontrol ediniz.');
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLocalError(null);
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-slate-900 selection:bg-[#507F9F] selection:text-white relative overflow-x-hidden">

      {/* ========================================================================= */}
      {/* SOL BÖLÜM: Tam Ekran Beyaz Zeminli Giriş Formu & Marka Alanı             */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white z-10 relative">

        {/* Sol Üst: Sitera Marka Logosu (IdeaSoft referansındaki sol üst logo gibi) */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Sitera"
            className="w-9 h-9 rounded-xl object-contain shadow-xs border border-slate-100"
          />
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
              Sitera
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              Akıllı Yaşam ERP
            </span>
          </div>
        </div>

        {/* Orta Alan: Dikeyde ve Yatayda Tam Ortalanmış Form */}
        <div className="max-w-[420px] w-full mx-auto my-auto py-8">

          {/* Başlık & Açıklama */}
          <div className="mb-7">

            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Site yönetim paneline veya sakin portalına güvenle erişin.
            </p>
          </div>

          {/* Hata Bildirimi */}
          {activeError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 mb-5 flex items-start gap-2.5 text-xs sm:text-sm animate-fade-in">
              <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium leading-tight">{activeError}</span>
            </div>
          )}

          {/* Giriş Formu */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-Posta / Kullanıcı Adı */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 tracking-tight"
              >
                Kullanıcı Adı veya E-Posta
              </label>
              <div className="relative flex items-center group">
                <div className="absolute left-3.5 text-slate-400 group-focus-within:text-[#507F9F] transition-colors pointer-events-none">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sitera.com"
                  autoComplete="email"
                  required
                  className="w-full h-11 pl-10 pr-3.5 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#507F9F] focus:ring-4 focus:ring-[#507F9F]/15 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Şifre Kutusu (Yapay Zeka Switch'i Yerine Gerçek Göz İkonlu Doğal Input) */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 tracking-tight"
              >
                Şifre
              </label>
              <div className="relative flex items-center group">
                <div className="absolute left-3.5 text-slate-400 group-focus-within:text-[#507F9F] transition-colors pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full h-11 pl-10 pr-11 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#507F9F] focus:ring-4 focus:ring-[#507F9F]/15 focus:outline-none transition-all shadow-xs tracking-normal"
                />
                {/* Doğal ve erişilebilir şifre göster/gizle ikonu */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-2.5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Beni Hatırla Seçeneği */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-[#507F9F] focus:ring-[#507F9F]/20 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Beni hatırla</span>
              </label>
            </div>

            {/* Ana Giriş Butonu (Sign In - Görseldeki Uyumlu Mavi Tonu) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-1 bg-[#507F9F] hover:bg-[#436E8C] active:bg-[#385D76] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer select-none active:scale-[0.99]"
            >
              {isLoading ? (
                <Spinner size={16} className="text-white" text="Giriş yapılıyor..." />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Şifremi Unuttum (Görseldeki Gibi Giriş Butonunun Tam Altında) */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  alert('Şifrenizi sıfırlamak için lütfen bağlı bulunduğunuz bina veya site yönetimiyle iletişime geçiniz.');
                }}
                className="text-xs font-medium text-slate-500 hover:text-[#507F9F] hover:underline transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Bölücü Çizgi */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              veya
            </span>
          </div>

          {/* SSO / Google ile Giriş Butonu */}
          <button
            type="button"
            onClick={() => {
              alert('Kurumsal SSO / Google Workspace doğrulaması şirket içi Active Directory üzerinden aktifleşecektir.');
            }}
            className="w-full h-11 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer active:scale-[0.99]"
          >
            {/* Google Resmi SVG Logosu */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign in with SSO</span>
          </button>

          {/* Hukuki Bilgilendirme ve Sözleşmeler */}
          <p className="mt-4 text-center text-xs text-slate-500 leading-relaxed">
            Giriş yaparak{' '}
            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="text-[#507F9F] hover:text-[#385B73] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Kullanıcı Sözleşmesi
            </button>
            {' '}ve{' '}
            <button
              type="button"
              onClick={() => setLegalModalType('kvkk')}
              className="text-[#507F9F] hover:text-[#385B73] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              KVKK Aydınlatma Metni
            </button>
            'ni kabul etmiş olursunuz.
          </p>

        </div>

        {/* Sol Alt: Güvenlik Rozeti (IdeaSoft referansındaki alt güvenlik notu) */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
            <span>256-bit SSL ve KVKK güvencesi</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="hover:text-slate-800 transition-colors cursor-pointer underline underline-offset-2"
            >
              Sözleşme
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setLegalModalType('kvkk')}
              className="hover:text-slate-800 transition-colors cursor-pointer underline underline-offset-2"
            >
              KVKK
            </button>
            <span>•</span>
            <span>© {new Date().getFullYear()} Sitera</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ORTA AYIRICI: IdeaSoft Referansındaki Kayan Orta Daire Rozeti              */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#507F9F] text-white shadow-xl shadow-sky-950/20 border-4 border-white items-center justify-center transition-transform hover:scale-110">
        <Building2 size={20} className="text-white" />
      </div>

      {/* ========================================================================= */}
      {/* SAĞ BÖLÜM: Mavi Zemin Üzerinde Dağıtılmış Doodle İkon Deseni (Wallpaper)  */}
      {/* Mobilde tamamen gizlenir, yalnızca masaüstünde (lg ve üzeri) gösterilir  */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen relative bg-gradient-to-br from-[#091F38] via-[#0E2C52] to-[#164377] overflow-hidden flex-col justify-between p-8 lg:p-12">

        {/* Lüks Mavi Ortam Işıkları (Ambient Lighting) */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-sky-400/15 blur-[110px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-teal-400/15 blur-[110px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

        {/* ======================================================================= */}
        {/* DOODLE PATTERN KATMANI (Kullanıcının ilettiği desen görselinin birebiri) */}
        {/* ======================================================================= */}
        <div className="absolute inset-0 overflow-hidden pointer-events-auto p-4 sm:p-6 select-none flex items-center justify-center">
          <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-8 xl:grid-cols-10 gap-x-5 gap-y-6 sm:gap-x-7 sm:gap-y-7 w-full h-full place-content-center place-items-center opacity-90">
            {WALLPAPER_ITEMS.map((item, idx) => (
              <div
                key={idx}
                style={{
                  transform: `rotate(${item.rotate}deg) translate(${item.dx}px, ${item.dy}px)`,
                  fontSize: `${item.size}px`,
                  opacity: item.opacity,
                }}
                className="text-white hover:text-white hover:opacity-100 hover:scale-135 transition-all duration-300 cursor-pointer flex items-center justify-center p-1"
                title="Sitera Akıllı Modül"
              >
                <FontAwesomeIcon icon={item.icon} />
              </div>
            ))}
          </div>
        </div>

        {/* Üst Kısım: Sol üstte border/background olmadan BÜYÜK Sitera markası, sağda minik sürüm */}
        <div className="relative z-10 flex items-center justify-between w-full">
          {/* Sol Üst Köşe: Büyütülmüş logo ve yazılar, border ve background olmadan doğrudan zemin üzerinde */}
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Sitera"
              className="w-13 h-13 sm:w-16 sm:h-16 object-contain drop-shadow-xl transition-transform hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-none drop-shadow-sm">
                  Sitera
                </span>

              </div>
              <span className="text-sm sm:text-base font-semibold text-sky-100/90 tracking-wide mt-1.5 leading-none drop-shadow-xs">
                Akıllı Yaşam Platformu
              </span>
            </div>
          </div>

          {/* Sağ Üst: Minik canlı sürüm göstergesi */}

        </div>

        {/* Alt Kısım: Sade ve ince alt bilgi */}
        <div className="relative z-10 flex items-center justify-between w-full text-[11px] text-sky-200/60 font-medium px-1 mt-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="hover:text-white transition-colors cursor-pointer underline underline-offset-2"
            >
              Kullanıcı Sözleşmesi
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setLegalModalType('kvkk')}
              className="hover:text-white transition-colors cursor-pointer underline underline-offset-2"
            >
              KVKK Aydınlatma Metni
            </button>
          </div>
          <span>© {new Date().getFullYear()} Sitera</span>
        </div>

      </div>

      {/* Sözleşme & KVKK Modal */}
      {legalModalType && (
        <LegalModal
          isOpen={Boolean(legalModalType)}
          type={legalModalType}
          onClose={() => setLegalModalType(null)}
        />
      )}

    </div>
  );
};
