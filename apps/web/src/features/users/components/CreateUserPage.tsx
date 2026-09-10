import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User as UserIcon,
  Building2,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  KeyRound,
  ShieldCheck,
  Home,
  Plus,
  X,
  Shuffle,
  AlertCircle,
  Briefcase,
  Wrench,
  Users,
} from 'lucide-react';
import { CreateUserDto, Group, ResidentType, UserRole, User } from '@sitera/shared';

interface CreateUserPageProps {
  onCreateUser: (dto: CreateUserDto) => Promise<any>;
  groups: Group[];
  activeGroup?: Group;
  existingUsers?: User[];
  isSuperAdmin?: boolean;
  tenantSlug?: string;
  onRefresh?: () => void;
}

export const CreateUserPage: React.FC<CreateUserPageProps> = ({
  onCreateUser,
  groups,
  activeGroup,
  existingUsers = [],
  isSuperAdmin = false,
  tenantSlug = 'gencosman-apartmani',
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role') as UserRole | null;

  const [groupId, setGroupId] = useState(activeGroup?.id || groups[0]?.id || '');
  const [role, setRole] = useState<UserRole>(
    initialRoleParam || (isSuperAdmin ? 'admin' : 'member')
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(isSuperAdmin ? 'Admin123!' : 'User123!');
  const [residentType, setResidentType] = useState<ResidentType>('owner');

  // Daire / Bağımsız Bölüm Yönetimi
  const [units, setUnits] = useState<string[]>(['Daire 1']);
  const [newUnitInput, setNewUnitInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeGroup?.id) {
      setGroupId(activeGroup.id);
    } else if (groups.length > 0 && !groupId) {
      setGroupId(groups[0].id);
    }
  }, [activeGroup, groups, groupId]);

  const handleAddUnit = () => {
    const trimmed = newUnitInput.trim();
    if (trimmed && !units.includes(trimmed)) {
      setUnits([...units, trimmed]);
      setNewUnitInput('');
    }
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    setUnits(units.filter((u) => u !== unitToRemove));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Lütfen ad soyad ve e-posta adresini giriniz.');
      return;
    }

    if (!groupId) {
      setError('Lütfen bir site / apartman seçiniz.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateUser({
        groupId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        role,
        password,
        units: role === 'member' ? units : role === 'staff' ? [newUnitInput || 'Teknik Personel'] : undefined,
        residentType: role === 'member' ? residentType : 'owner',
      });

      if (onRefresh) {
        onRefresh();
      }

      // Başarılı olduğunda geri yönlendir
      if (role === 'admin' || isSuperAdmin) {
        navigate(`/${tenantSlug}/admin/overview`);
      } else {
        navigate(`/${tenantSlug}/admin/users`);
      }
    } catch (err: any) {
      setError(err.message || 'Kullanıcı kaydedilirken bir hata oluştu.');
      setSubmitting(false);
    }
  };

  const selectedGroupName = groups.find((g) => g.id === groupId)?.name || activeGroup?.name;

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in pb-16 font-sans">
      {/* 1. Üst Navigasyon & Başlık */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(`/${tenantSlug}/admin/users`)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-3 cursor-pointer p-1 -ml-1 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          <span>Daireler ve Sakinler Listesine Dön</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-md">
            {role === 'admin' ? (
              <ShieldCheck size={24} className="text-teal-400" />
            ) : role === 'staff' ? (
              <Wrench size={24} className="text-amber-400" />
            ) : (
              <UserIcon size={24} className="text-indigo-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {role === 'admin'
                  ? 'Yeni Site Yöneticisi Ekle'
                  : role === 'staff'
                  ? 'Yeni Teknik Personel / Görevli Ekle'
                  : 'Yeni Daire & Kat Maliki Kaydı'}
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {selectedGroupName || 'Apartman'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Sisteme yeni bir kullanıcı hesabı ve daire bağımsız bölümü kaydedin
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
          {/* Site / Apartman Seçimi (Eğer birden fazla site varsa veya Super Admin ise) */}
          {groups.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Site / Apartman <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors cursor-pointer"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (/{g.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Rol Seçici */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kullanıcı Rolü & Yetkisi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  role === 'member'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Kat Maliki / Sakin</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Daire sakini veya ev sahibi</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  role === 'admin'
                    ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Site Yöneticisi</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Tam yönetim & tahakkuk yetkisi</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('accountant')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  role === 'accountant'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Muhasebeci / Denetçi</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Mali kayıt ve rapor yetkisi</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  role === 'staff'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Tekniker / Görevli</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Saha bakım & servis personeli</div>
              </button>
            </div>
          </div>

          {/* Temel Bilgiler: Ad Soyad, E-posta, Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Adı Soyadı <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Örn: Mehmet Özkan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                E-Posta Adresi (Giriş İçin) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="mehmet@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
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
                  placeholder="+905321112233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Giriş Şifresi <span className="text-rose-500">*</span>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Daire ve Mülkiyet Bilgileri (Sakin ise) */}
          {role === 'member' && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mülkiyet & İkamet Durumu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResidentType('owner')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      residentType === 'owner'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Kat Maliki (Ev Sahibi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResidentType('tenant')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      residentType === 'tenant'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Kiracı Sakin
                  </button>
                  <button
                    type="button"
                    onClick={() => setResidentType('both')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      residentType === 'both'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Ev Sahibi (İkamet Eden)
                  </button>
                </div>
              </div>

              {/* Daireler */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bağlı Bağımsız Bölümler (Daireler)
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  {units.map((u) => (
                    <span
                      key={u}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold font-mono"
                    >
                      <Home size={12} className="text-teal-600" />
                      <span>{u}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUnit(u)}
                        className="text-teal-400 hover:text-rose-600 cursor-pointer p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Örn: Daire 7 veya B Blok D.12"
                    value={newUnitInput}
                    onChange={(e) => setNewUnitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUnit();
                      }
                    }}
                    className="flex-1 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Daire Ekle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Branş Bilgisi (Tekniker ise) */}
          {role === 'staff' && (
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Görev / Branş
              </label>
              <div className="relative">
                <Wrench size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Örn: Asansör & Elektrik veya Genel Tesisat"
                  value={newUnitInput}
                  onChange={(e) => setNewUnitInput(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 shadow-2xs transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/admin/users`)}
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
            <span>{submitting ? 'Kaydediliyor...' : 'Kullanıcıyı Sisteme Kaydet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
