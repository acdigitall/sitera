import React, { useState, useEffect } from 'react';
import { User, UpdateUserDto, ResidentType } from '@sitera/shared';
import { X, UserCheck, Home, Check, AlertTriangle, Sparkles, UserPlus, KeyRound, Shuffle, Eye, EyeOff, Copy, CheckCircle2 } from 'lucide-react';

interface AssignResidentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  existingUsers?: User[];
  onUpdate: (id: string, dto: UpdateUserDto) => Promise<any>;
}

export const AssignResidentDrawer: React.FC<AssignResidentDrawerProps> = ({
  isOpen,
  onClose,
  user,
  existingUsers = [],
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('User123!');
  const [showPassword, setShowPassword] = useState(false);
  const [residentType, setResidentType] = useState<ResidentType>('owner');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    unit: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  // Filter distinct active residents in this site
  const existingResidents = existingUsers.filter(
    (u) =>
      u.role === 'member' &&
      !u.email.endsWith('@sitera.dev') &&
      u.id !== user?.id
  );

  const normalizedEmail = email.trim().toLowerCase();

  // KURAL 1: Bu e-posta bir site yöneticisi veya süper admine mi ait?
  const isAdminEmail = Boolean(
    normalizedEmail &&
      existingUsers.some(
        (u) =>
          (u.role === 'admin' || u.role === 'superadmin') &&
          u.email.toLowerCase() === normalizedEmail
      )
  );

  // KURAL 2: Bu e-posta sitede kayıtlı başka bir sakine mi ait?
  const matchedResident = normalizedEmail
    ? existingResidents.find((u) => u.email.toLowerCase() === normalizedEmail)
    : null;

  useEffect(() => {
    if (user && isOpen) {
      const isPlaceholderName =
        user.name.toLowerCase().startsWith('daire') ||
        user.name.toLowerCase().includes('blok') ||
        user.name === user.group?.name;

      setName(isPlaceholderName ? '' : user.name);
      setEmail(user.email.endsWith('@sitera.dev') ? '' : user.email);
      setPhone(user.phone || '');
      setResidentType(user.residentType || 'owner');
      setPassword('User123!');
      setSelectedExistingId('');
      setCreatedCredentials(null);
      setCopied(false);
      setError(null);
    }
  }, [user, isOpen]);

  // When admin selects an existing resident from the dropdown
  const handleSelectExistingResident = (residentId: string) => {
    setSelectedExistingId(residentId);
    if (!residentId) return;

    const chosen = existingResidents.find((r) => r.id === residentId);
    if (chosen) {
      setName(chosen.name);
      setEmail(chosen.email);
      setPhone(chosen.phone || '');
      setResidentType(chosen.residentType || 'owner');
      setError(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAdminEmail) {
      setError('Bu e-posta adresi site yöneticisine aittir. Yönetici hesabı daire sakini olarak atanamaz.');
      return;
    }

    if (!name.trim()) {
      setError('Lütfen sakin/malik ad ve soyadını giriniz.');
      return;
    }
    if (!user) return;

    setError(null);
    setSubmitting(true);

    try {
      const targetEmail = email.trim()
        ? email.trim().toLowerCase()
        : user.email.endsWith('@sitera.dev')
        ? user.email
        : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sitera.dev`;

      const finalPassword = password.trim() || 'User123!';

      await onUpdate(user.id, {
        name: name.trim(),
        email: targetEmail,
        phone: phone.trim() || undefined,
        residentType,
        password: finalPassword,
      });

      setCreatedCredentials({
        name: name.trim(),
        email: targetEmail,
        password: finalPassword,
        unit: unitName,
      });
    } catch (err: any) {
      setError(err.message || 'Sakin atanırken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const unitName = user?.units?.[0] || user?.name || 'Daire';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] md:w-[450px] bg-white border-l border-slate-200 shadow-xl flex flex-col justify-between transform transition-transform duration-200 ease-out select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-slate-900" />
            <h2 className="font-bold text-slate-900 text-sm">
              Sakin Tanımla • {unitName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              ESC
            </span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {/* Body */}
        {createdCredentials ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5 animate-scale-up flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={32} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">
                  Sakin Başarıyla Tanımlandı!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Daire sakininin portala giriş yapabilmesi için aşağıdaki bilgileri sakinle paylaşabilirsiniz.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Daire / Birim:</span>
                  <span className="font-bold text-slate-900">{createdCredentials.unit}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Sakin Adı:</span>
                  <span className="font-bold text-slate-900">{createdCredentials.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Giriş E-Postası:</span>
                  <span className="font-mono font-bold text-slate-900">{createdCredentials.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Portal Şifresi:</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 text-sm">
                    {createdCredentials.password}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4">
              <button
                type="button"
                onClick={() => {
                  const shareText = `Sayın ${createdCredentials.name},\n${user?.group?.name || 'Sitera'} Sakin Portalı hesabınız tanımlanmıştır.\n\n🔗 Giriş: ${window.location.origin}/login\n📧 E-Posta: ${createdCredentials.email}\n🔑 Giriş Şifreniz: ${createdCredentials.password}\n\nGiriş yaptıktan sonra aidat durumunuzu ve bina duyurularını takip edebilirsiniz.`;
                  navigator.clipboard.writeText(shareText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 3000);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Bilgiler Panoya Kopyalandı!' : 'Giriş Bilgilerini Kopyala (WhatsApp / SMS)'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tamamla ve Kapat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-xs flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Daire Bilgisi Kartı */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home size={16} className="text-indigo-600" />
                  <span className="font-mono font-bold text-slate-900 text-xs">{unitName}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Bağımsız Bölüm</span>
              </div>

              {/* Mevcut Sakinlerden Hızlı Seçim Dropdown */}
              {existingResidents.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                    <UserCheck size={13} />
                    <span>Sitedeki Mevcut Sakinlerden Birini Ata (Opsiyonel)</span>
                  </label>
                  <select
                    value={selectedExistingId}
                    onChange={(e) => handleSelectExistingResident(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-400 transition-colors cursor-pointer"
                  >
                    <option value="">-- Yeni Sakin Bilgisi Gir VEYA Mevcut Sakin Seç --</option>
                    {existingResidents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.units?.join(', ') || 'Daire'}) — {r.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Birden fazla dairesi olan sakinler için buradan mevcut sakini seçebilirsiniz.
                  </p>
                </div>
              )}

              {/* KURAL 1 UYARISI: Admin E-Postası Engelleme */}
              {isAdminEmail && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2 animate-fade-in">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <strong className="block font-bold">Yönetici E-Postası Engellendi!</strong>
                    Bu e-posta adresi sistemde <strong>Site Yöneticisi</strong> olarak kayıtlıdır. Yönetici e-posta adresi daire sakini olarak kaydedilemez.
                  </div>
                </div>
              )}

              {/* KURAL 2 BİLGİSİ: Çoklu Daire Eşleme (Merge) */}
              {matchedResident && !isAdminEmail && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 text-xs flex items-start gap-2 animate-fade-in">
                  <Sparkles size={16} className="shrink-0 mt-0.5 text-indigo-600" />
                  <div>
                    <strong className="block font-bold">Çoklu Daire Eşleme:</strong>
                    Bu e-posta adresiyle kayıtlı bir sakin bulundu: <strong>{matchedResident.name}</strong> (Mevcut Daireleri: {matchedResident.units?.join(', ') || 'Belirtilmedi'}).
                    <div className="mt-1 text-[11px] text-indigo-700">
                      <strong>{unitName}</strong> bu sakinin mevcut daire listesine eklenecek ve tek hesap altında birleştirilecektir.
                    </div>
                  </div>
                </div>
              )}

              {/* Ad Soyad */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Malik / Sakin Adı Soyadı *</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors"
                  placeholder="Ahmet Yılmaz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Mülkiyet Tipi Segmented Switch */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mülkiyet Durumu</label>
                <div className="p-0.5 bg-slate-100 rounded flex gap-0.5 border border-slate-200/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setResidentType('owner')}
                    className={`flex-1 py-1 px-2 rounded transition-all ${
                      residentType === 'owner'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Ev Sahibi (Malik)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResidentType('both')}
                    className={`flex-1 py-1 px-2 rounded transition-all ${
                      residentType === 'both'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Malik & İkamet
                  </button>
                  <button
                    type="button"
                    onClick={() => setResidentType('tenant')}
                    className={`flex-1 py-1 px-2 rounded transition-all ${
                      residentType === 'tenant'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Kiracı
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Telefon Numarası</label>
                <input
                  type="tel"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 font-mono transition-colors"
                  placeholder="+90 5XX XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">E-Posta (Portal Girişi İçin)</label>
                <input
                  type="email"
                  className={`w-full bg-slate-50 border rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white font-mono transition-colors ${
                    isAdminEmail ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
                  }`}
                  placeholder="ornek@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* 5. Portal Giriş Şifresi */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <KeyRound size={13} className="text-indigo-600" />
                    <span>Portal Giriş Şifresi *</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Shuffle size={11} />
                    <span>Rastgele Üret</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 font-mono transition-colors pr-8"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Örn: User123!"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Gizle' : 'Göster'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Daire sakini bu e-posta ve şifre ile portala giriş yapacaktır. Varsayılan: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-bold">User123!</code>
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="h-14 px-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || isAdminEmail}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <span>Kaydediliyor...</span>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Sakini Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
