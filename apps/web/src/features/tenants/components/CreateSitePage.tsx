import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  User,
  Phone,
  Mail,
  KeyRound,
  Wrench,
  Layers,
  MapPin,
  Sparkles,
  AlertCircle,
  Shuffle,
  Gift,
  CreditCard,
} from 'lucide-react';
import { CreateGroupDto, CreateUserDto, GroupPlan } from '@sitera/shared';

interface CreateSitePageProps {
  onCreateGroup: (dto: CreateGroupDto) => Promise<any>;
  onCreateUser: (dto: CreateUserDto) => Promise<any>;
  onRefresh?: () => void;
  tenantSlug?: string;
}

export const CreateSitePage: React.FC<CreateSitePageProps> = ({
  onCreateGroup,
  onCreateUser,
  onRefresh,
  tenantSlug = 'gencosman-apartmani',
}) => {
  const navigate = useNavigate();

  // 1. Site / Bina Bilgileri
  const [siteName, setSiteName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Kadıköy');
  const [totalUnits, setTotalUnits] = useState('24');
  const [plan, setPlan] = useState<GroupPlan>('pro');

  // SaaS Lisans & Lansman Promosyonu
  const [licenseType, setLicenseType] = useState<'trial_3' | 'trial_5' | 'standard'>('trial_3');
  const [unitFee, setUnitFee] = useState<string>('20');
  const [customMonthlyFee, setCustomMonthlyFee] = useState<string>('480');

  // 2. Site Yöneticisi Bilgileri
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin123!');

  // 3. Teknik Personel (Opsiyonel)
  const [hasTech, setHasTech] = useState(false);
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techRole, setTechRole] = useState('Asansör & Elektrik');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Otomatik slug türetme (Türkçe karakter temizliği ile)
  useEffect(() => {
    if (!isSlugManuallyEdited && siteName.trim()) {
      const generated = siteName
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generated);
    }
  }, [siteName, isSlugManuallyEdited]);

  // Otomatik yönetici e-posta önerisi
  useEffect(() => {
    if (slug && !adminEmail) {
      setAdminEmail(`yonetim@${slug}.com`);
    }
  }, [slug, adminEmail]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(res);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!siteName.trim() || !slug.trim()) {
      setError('Lütfen site / apartman adını ve URL yolunu giriniz.');
      return;
    }

    if (!adminName.trim() || !adminEmail.trim()) {
      setError('Lütfen site yöneticisinin adını ve e-posta adresini giriniz.');
      return;
    }

    setSubmitting(true);
    try {
      const units = parseInt(totalUnits, 10) || 24;
      const uFee = parseFloat(unitFee) || 20;
      const fee = parseFloat(customMonthlyFee) || units * uFee;
      const now = Date.now();
      let trialEndsAt: string | null = null;
      let subscriptionStatus: 'trial' | 'active' = 'trial';
      let paymentStatus: 'free_trial' | 'paid' = 'free_trial';

      if (licenseType === 'trial_3') {
        trialEndsAt = new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString();
        subscriptionStatus = 'trial';
        paymentStatus = 'free_trial';
      } else if (licenseType === 'trial_5') {
        trialEndsAt = new Date(now + 150 * 24 * 60 * 60 * 1000).toISOString();
        subscriptionStatus = 'trial';
        paymentStatus = 'free_trial';
      } else {
        subscriptionStatus = 'active';
        paymentStatus = 'paid';
      }

      // 1. Yeni Site / Grubu Oluştur
      const newGroup = await onCreateGroup({
        name: siteName.trim(),
        slug: slug.trim().toLowerCase(),
        plan,
        totalUnits: units,
        city: city.trim() || 'İstanbul',
        district: district.trim() || 'Kadıköy',
        subscriptionStatus,
        unitFee: uFee,
        monthlyFee: fee,
        trialEndsAt,
        licenseExpiresAt: new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString(),
        paymentStatus,
      });

      const targetGroupId = newGroup?.id;

      // 2. Site Yöneticisini Kaydet
      if (targetGroupId) {
        await onCreateUser({
          groupId: targetGroupId,
          name: adminName.trim(),
          email: adminEmail.trim().toLowerCase(),
          phone: adminPhone.trim() || undefined,
          password: adminPassword,
          role: 'admin',
          residentType: 'owner',
        });

        // 3. Tekniker varsa kaydet
        if (hasTech && techName.trim()) {
          await onCreateUser({
            groupId: targetGroupId,
            name: techName.trim(),
            email: `teknik@${slug}.com`,
            phone: techPhone.trim() || undefined,
            password: 'User123!',
            role: 'staff',
            units: [techRole || 'Tekniker'],
            residentType: 'owner',
          });
        }
      }

      if (onRefresh) {
        onRefresh();
      }

      // Başarılı yönlendirme: doğrudan yeni sitenin yönetim paneline git
      navigate(`/${slug}/admin/overview`);
    } catch (err: any) {
      setError(err.message || 'Site ve yönetici kaydedilirken bir hata oluştu.');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-16 font-sans">
      {/* 1. Üst Navigasyon & Başlık */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(`/${tenantSlug}/admin/overview`)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-3 cursor-pointer p-1 -ml-1 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          <span>Platform Yönetim Merkezine Dön</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-md">
            <Building2 size={24} className="text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Yeni Site & Apartman Kurulumu
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                Süper Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Sisteme yeni bir apartman veya site kaydedin, yönetici kadrosunu ve kapasitesini tanımlayın
            </p>
          </div>
        </div>
      </div>

      {/* Hata Bildirimi */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="font-semibold">{error}</div>
        </div>
      )}

      {/* Form Alanı */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* KART 1: SİTE / APARTMAN BİLGİLERİ                                         */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Site & Apartman Temel Bilgileri</h2>
              <p className="text-xs text-slate-500 font-medium">
                Bina adı, sistem içi benzersiz URL yolu ve bağımsız bölüm kapasitesi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Site Adı */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Site / Apartman Adı <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Örn: Kardelen Sitesi veya Gencosman Apartmanı"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>

            {/* URL Slug Yolu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sistem URL Yolu (Slug) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-mono font-bold text-teal-700 pointer-events-none">
                  /
                </span>
                <input
                  type="text"
                  required
                  placeholder="kardelen-sitesi"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugManuallyEdited(true);
                  }}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-mono font-bold text-teal-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Örnek: sitera.app/<strong>{slug || 'site-adi'}</strong>/admin
              </p>
            </div>

            {/* Bağımsız Bölüm (Daire) Sayısı */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bağımsız Bölüm Kapasitesi (Daire / Dükkan)
              </label>
              <div className="relative">
                <Layers size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="24"
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>

            {/* Lisans Planı */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lisans & Hizmet Paketi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'pro', 'enterprise'] as GroupPlan[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                      plan === p
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Şehir */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Şehir</label>
              <div className="relative">
                <MapPin size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="İstanbul"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>

            {/* İlçe */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">İlçe</label>
              <div className="relative">
                <MapPin size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Kadıköy"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KART 2: SAAS LİSANS & LANSMAN PROMOSYONU                                 */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Gift size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">SaaS Lisansı & Lansman Promosyonu</h2>
              <p className="text-xs text-slate-500 font-medium">
                Bu sitenin Sitera platform abonelik modeli, ücretsiz lansman süresi ve aylık SaaS aidatı
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setLicenseType('trial_3')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                licenseType === 'trial_3'
                  ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">3 Ay Ücretsiz Lansman</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                  Önerilen
                </span>
              </div>
              <div className="text-lg font-extrabold text-slate-900 mt-2">
                0 ₺ <span className="text-xs font-normal text-slate-500">/ 90 gün</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Lansman hediyesi olarak ilk 3 ay boyunca ücretsiz tam erişim.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setLicenseType('trial_5')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                licenseType === 'trial_5'
                  ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">5 Ay Ücretsiz Lansman</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                  Özel Kampanya
                </span>
              </div>
              <div className="text-lg font-extrabold text-slate-900 mt-2">
                0 ₺ <span className="text-xs font-normal text-slate-500">/ 150 gün</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Büyük ölçekli veya pilot binalar için 5 ay risksiz deneme.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setLicenseType('standard')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                licenseType === 'standard'
                  ? 'border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Standart Ücretli Lisans</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                  Doğrudan
                </span>
              </div>
              <div className="text-lg font-extrabold text-slate-900 mt-2">
                ₺{customMonthlyFee} <span className="text-xs font-normal text-slate-500">/ ay</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Lansman süresi olmadan doğrudan standart faturalama.
              </p>
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-600">
              <span className="font-bold text-slate-900">Hesaplanan Normal SaaS Aidatı:</span>{' '}
              {totalUnits} daire × ₺{unitFee} = <span className="font-bold font-mono text-slate-900">₺{(parseInt(totalUnits, 10) || 24) * (parseFloat(unitFee) || 20)} / ay</span>
              {licenseType !== 'standard' && (
                <span className="block text-[11px] text-slate-500 mt-0.5 font-medium">
                  * Lansman süresi tamamlandıktan sonra bu aylık tutar üzerinden faturalandırılacaktır.
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Daire Başı:</span>
                <div className="relative w-20">
                  <input
                    type="number"
                    min="0"
                    value={unitFee}
                    onChange={(e) => {
                      const uFee = e.target.value;
                      setUnitFee(uFee);
                      const u = parseInt(totalUnits, 10) || 24;
                      setCustomMonthlyFee((u * (parseFloat(uFee) || 0)).toString());
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-2.5 pr-6 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₺</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Toplam Aylık:</span>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="0"
                    value={customMonthlyFee}
                    onChange={(e) => {
                      const mFee = e.target.value;
                      setCustomMonthlyFee(mFee);
                      const u = parseInt(totalUnits, 10) || 24;
                      setUnitFee(u > 0 ? (parseFloat(mFee) / u).toFixed(1) : '20');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-2.5 pr-6 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-slate-400"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KART 3: SİTE YÖNETİCİSİ (İLK ADMİN) BİLGİLERİ                              */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Site Yöneticisi (İlk Admin)</h2>
              <p className="text-xs text-slate-500 font-medium">
                Bu apartmanın yönetiminden ve mali operasyonlarından sorumlu ilk yönetici hesabı
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Yönetici Ad Soyad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yönetici Adı Soyadı <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>

            {/* Yönetici E-Posta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Giriş E-Posta Adresi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="yonetim@kardelen.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>

            {/* Yönetici Telefon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                İletişim Telefonu
              </label>
              <div className="relative">
                <Phone size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="+905321234567"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>

            {/* Giriş Şifresi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  İlk Giriş Şifresi <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                >
                  <Shuffle size={12} />
                  <span>Rastgele Üret</span>
                </button>
              </div>
              <div className="relative">
                <KeyRound size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KART 4: TEKNİKER & SAHA PERSONELİ (OPSİYONEL)                              */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Tekniker & Personel Kadrosu</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Elektrik, asansör, tesisat veya bina görevlisi tanımlayın (opsiyonel)
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasTech}
                onChange={(e) => setHasTech(e.target.checked)}
                className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">Personel Ekle</span>
            </label>
          </div>

          {hasTech ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Personel / Tekniker Adı
                </label>
                <div className="relative">
                  <User size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Örn: Hasan Usta"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Telefon Numarası
                </label>
                <div className="relative">
                  <Phone size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="+905441234567"
                    value={techPhone}
                    onChange={(e) => setTechPhone(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Görevi / Branşı
                </label>
                <div className="relative">
                  <Wrench size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Asansör & Elektrik"
                    value={techRole}
                    onChange={(e) => setTechRole(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs border border-dashed border-slate-200 text-center">
              Teknik personel veya bina görevlisi daha sonra da atanabilir.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* AKSİYON BUTONLARI                                                         */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/overview`)}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={17} />
            <span>{submitting ? 'Kurulum Yapılıyor...' : 'Site & Apartmanı Sisteme Ekle'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
