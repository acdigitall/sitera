import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  CheckCircle2,
  Bell,
  Smartphone,
  Save,
  KeyRound,
  Shield,
  Home,
  Landmark,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Wallet,
  Coins,
  PiggyBank,
  Banknote,
  ArrowRight,
  Info,
} from '../../../components/common/fontawesome-icons';
import { useAuth } from '../../auth';
import { usersApi } from '../../users/services/users.api';
import { useFinance } from '../../finance/useFinance';
import { CreateAccountModal } from '../../dashboard/components/CreateAccountModal';

export const PortalProfileView: React.FC = () => {
  const { user, selectedUnit, updateUser } = useAuth();
  const navigate = useNavigate();
  const userUnits = user?.units && user.units.length > 0 ? user.units : (user?.name ? [user.name] : []);
  const hasMultipleUnits = userUnits.length > 1;
  const isResident = user?.role !== 'admin' && user?.role !== 'superadmin';

  const [activeTab, setActiveTab] = useState<'general' | 'accounts' | 'security' | 'notifications'>('general');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedIbanId, setCopiedIbanId] = useState<string | null>(null);

  const { accounts, refetch } = useFinance(user?.groupId || undefined);

  const tenantSlug =
    user?.group?.slug ||
    (user?.group?.name
      ? user.group.name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      : 'gencosman-apartmani');

  const getTenantPath = (path: string) => `/${tenantSlug}${path}`;

  const handleCopyIban = (iban: string, accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
    setCopiedIbanId(accountId);
    setTimeout(() => setCopiedIbanId(null), 2000);
  };

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [residentType, setResidentType] = useState<string>(user?.residentType || 'owner');
  const [phone, setPhone] = useState((user as any)?.phone || '0555 123 45 67');
  const [tcNo] = useState('342*****812');
  const [address, setAddress] = useState('Gencosman Apartmanı No: 12, Kadıköy / İstanbul');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification states
  const [notifyEmailDues, setNotifyEmailDues] = useState(true);
  const [notifyEmailReceipt, setNotifyEmailReceipt] = useState(true);
  const [notifySmsAnnouncements, setNotifySmsAnnouncements] = useState(true);
  const [notifySmsReminders, setNotifySmsReminders] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user?.id) {
        await usersApi.update(
          user.id,
          {
            name,
            phone,
            residentType: residentType as any,
          },
          user.groupId || undefined,
        );
      }
      updateUser({
        name,
        residentType: residentType as any,
      });
      setSavedSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Kaydedilirken hata oluştu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Profil & Hesap Ayarları
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kişisel iletişim bilgilerinizi, güvenlik ayarlarınızı ve bildirim tercihlerinizi yönetin.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Değişiklikler kaydedildi</span>
          </div>
        )}
      </div>

      {/* Kullanıcı Özet Kartı */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold ring-4 ring-slate-100 shrink-0">
          {user?.name?.charAt(0).toUpperCase() || 'S'}
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{user?.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{user?.email}</p>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-2 sm:mt-0">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200/80">
                {isResident
                  ? residentType === 'tenant'
                    ? 'Kiracı Sakin'
                    : residentType === 'both'
                    ? 'Ev Sahibi (İkamet Eden)'
                    : 'Kat Maliki'
                  : 'Site Yöneticisi'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {user?.group?.name || 'Gencosman Apartmanı'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-600 flex-wrap">
            <div className="flex items-center gap-2">
              <Home size={14} className="text-teal-700 shrink-0" />
              <span className="font-medium">Kayıtlı Daireler:</span>
              <div className="flex items-center gap-1.5 flex-wrap font-bold text-slate-900">
                {userUnits.map((u) => (
                  <span key={u} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                    {u}
                  </span>
                ))}
              </div>
            </div>

            {!isResident && (
              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold border border-teal-200 transition-colors cursor-pointer"
              >
                <Landmark size={13} className="text-teal-700" />
                <span>Banka / IBAN: {accounts.length} Hesap Tanımlı</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sekmeler (Tabs) */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User size={16} />
          <span>Kişisel Bilgiler</span>
        </button>

        {!isResident && (
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Landmark size={16} />
            <span>Site Banka & Kasa Bilgileri</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold leading-none">
              {accounts.length}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock size={16} />
          <span>Şifre & Güvenlik</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell size={16} />
          <span>Bildirim Tercihleri</span>
        </button>
      </div>

      {/* Form Gövdesi */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-6">
        {/* SEKME 1: KİŞİSEL BİLGİLER */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">İletişim ve Kimlik Bilgileri</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Site yönetimi kayıtlarında yer alan resmi sakin bilgileriniz.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Ad Soyad</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">T.C. Kimlik Numarası</label>
                <input
                  type="text"
                  value={tcNo}
                  disabled
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">KVKK gereği maskelenmiştir</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">E-Posta Adresi</label>
                <div className="relative">
                  <Mail size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Giriş için kullanılan ana e-posta</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Cep Telefonu</label>
                <div className="relative">
                  <Phone size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-medium text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none transition-all shadow-2xs"
                  />
                </div>
                <span className="text-[10px] text-slate-400">SMS ve acil durum bildirimleri için</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">İkamet & Mülkiyet Durumu</label>
                <select
                  value={residentType}
                  onChange={(e) => setResidentType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none transition-all shadow-2xs bg-white cursor-pointer"
                >
                  <option value="owner">Kat Maliki (Ev Sahibi)</option>
                  <option value="tenant">Kiracı Sakin</option>
                  <option value="both">Ev Sahibi (İkamet Eden)</option>
                </select>
                <span className="text-[10px] text-slate-400">Apartman sakin kütüğündeki resmi statünüz</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">Tebligat & Yazışma Adresi</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none transition-all shadow-2xs resize-none"
              />
            </div>
          </div>
        )}

        {/* SEKME: SİTE BANKA & KASA BİLGİLERİ (YÖNETİCİ) */}
        {activeTab === 'accounts' && !isResident && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Landmark size={18} className="text-teal-700" />
                  Site / Apartman Banka ve Kasa Bilgileri
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sakinlerin aidat ve demirbaş ödemelerini yapabilmesi için tanımlanan resmi IBAN ve kasa hesapları.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Yeni Hesap Ekle</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(getTenantPath('/admin/accounts'))}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Gelişmiş Kasa Yönetimi</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Hesaplar Listesi */}
            {accounts.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70">
                <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-3">
                  <Landmark size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Henüz Tanımlı Banka veya Kasa Hesabı Yok
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Sakinlerin aidatlarını IBAN ile ödeyebilmesi ve bina muhasebesini tutabilmek için sitenize ait ilk vadesiz banka veya kasa hesabını ekleyin.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>İlk Hesabı Tanımla (IBAN Ekle)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => {
                  const isCopied = copiedIbanId === acc.id;
                  const isCash = acc.type === 'cash';
                  const isReserve = acc.type === 'reserve';

                  return (
                    <div
                      key={acc.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-200 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base shadow-2xs ${
                            isCash
                              ? 'bg-amber-100 text-amber-700'
                              : isReserve
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {isCash ? (
                            <Wallet size={18} />
                          ) : isReserve ? (
                            <PiggyBank size={18} />
                          ) : (
                            <Landmark size={18} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{acc.name}</span>
                            <span className="text-xs text-slate-500 font-medium">({acc.bankName})</span>
                            {acc.isPrimary && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                Birincil Hesap
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                isCash
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : isReserve
                                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                    : 'bg-teal-50 text-teal-800 border border-teal-200'
                              }`}
                            >
                              {isCash
                                ? 'Nakit Kasa'
                                : isReserve
                                  ? 'Demirbaş Fonu'
                                  : 'Vadesiz Banka'}
                            </span>
                          </div>

                          {acc.iban ? (
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="font-mono text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {acc.iban}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyIban(acc.iban!, acc.id, e)}
                                className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                                  isCopied
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                              >
                                {isCopied ? <Check size={11} /> : <Copy size={11} />}
                                <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                              </button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Fiziksel / Elden Tahsilat Kasası (IBAN Bulunmuyor)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Güncel Bakiye</span>
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {Number(acc.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 flex items-start gap-2.5">
              <Info size={16} className="text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Bilgilendirme: </span>
                Sakinler portaldan ödeme bildirimi yaparken veya dekont yüklerken burada tanımladığınız birincil banka hesabı otomatik olarak ödeme talimatında gösterilir. Detaylı ekstreler, virman transferleri ve banka mutabakatları için sol menüdeki <b>Tahsilat & Finans &gt; Kasa & Banka Hesapları</b> sayfasını kullanabilirsiniz.
              </div>
            </div>
          </div>
        )}

        {/* SEKME 2: GÜVENLİK & ŞİFRE */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Şifre Değiştir</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hesap güvenliğiniz için düzenli aralıklarla şifrenizi güncel tutun.
              </p>
            </div>

            <div className="space-y-3 max-w-md pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mevcut Şifreniz</label>
                <div className="relative">
                  <KeyRound size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Yeni Şifre</label>
                <div className="relative">
                  <Lock size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="En az 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Yeni Şifre (Tekrar)</label>
                <div className="relative">
                  <Lock size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="Yeni şifrenizi tekrar yazın"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEKME 3: BİLDİRİM TERCİHLERİ */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bildirim Kanalları</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Apartman yönetimi tarafından gönderilen iletileri nasıl almak istediğinizi belirleyin.
              </p>
            </div>

            <div className="divide-y divide-slate-100 pt-2">
              <label className="py-3 flex items-center justify-between cursor-pointer group">
                <div className="pr-4">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                    Aidat Tahakkuk E-Postası
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Her ay başında dairenize yeni aidat yansıtıldığında e-posta ile bildirim alın.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmailDues}
                  onChange={(e) => setNotifyEmailDues(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </label>

              <label className="py-3 flex items-center justify-between cursor-pointer group">
                <div className="pr-4">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                    Ödeme Makbuzu E-Postası
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Aidat ödemeniz onaylandığında resmi tahsilat makbuzu e-postanıza gelsin.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmailReceipt}
                  onChange={(e) => setNotifyEmailReceipt(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </label>

              <label className="py-3 flex items-center justify-between cursor-pointer group">
                <div className="pr-4">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                    Bina Duyuruları SMS Bilgilendirmesi
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Yönetici tarafından yayınlanan önemli ve acil duyurular cep telefonunuza SMS olarak gelsin.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifySmsAnnouncements}
                  onChange={(e) => setNotifySmsAnnouncements(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </label>

              <label className="py-3 flex items-center justify-between cursor-pointer group">
                <div className="pr-4">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                    Vade Hatırlatma SMS'i
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Son ödeme günü yaklaşan faturalar için son 3 gün kala SMS hatırlatması yapılsın.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifySmsReminders}
                  onChange={(e) => setNotifySmsReminders(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Kaydetme Butonu (Kişisel, Güvenlik ve Bildirim sekmeleri için) */}
        {activeTab !== 'accounts' && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Save size={14} />
              <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Yeni Banka / Kasa Hesabı Oluşturma Modalı */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        groupId={user?.groupId || undefined}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
