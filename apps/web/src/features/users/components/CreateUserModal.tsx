import React, { useState, useEffect } from 'react';
import { CreateUserDto, Group, ResidentType } from '@sitera/shared';
import { UserPlus, Shield, Lock, Building2, Home, Plus, X, Phone, Mail, User as UserIcon } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { useAuth } from '../../auth';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateUserDto) => Promise<any>;
  groups: Group[];
  defaultGroupId?: string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  groups,
  defaultGroupId,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(isSuperAdmin ? 'Admin123!' : 'User123!');
  const [residentType, setResidentType] = useState<ResidentType>('owner');
  const [groupId, setGroupId] = useState(defaultGroupId || user?.groupId || (groups[0]?.id ?? ''));

  // Multi-unit management: Owner can have multiple apartments
  const [units, setUnits] = useState<string[]>(['Daire 1']);
  const [newUnitInput, setNewUnitInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      if (defaultGroupId) {
        setGroupId(defaultGroupId);
      } else if (groups.length > 0 && !groupId) {
        setGroupId(groups[0].id);
      }
    } else {
      setGroupId(user?.groupId || '');
    }
  }, [defaultGroupId, groups, groupId, isSuperAdmin, user?.groupId]);

  const handleAddUnit = () => {
    const trimmed = newUnitInput.trim();
    if (!trimmed) return;
    if (!units.includes(trimmed)) {
      setUnits((prev) => [...prev, trimmed]);
    }
    setNewUnitInput('');
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    if (units.length <= 1) {
      setError('En az bir daire tanımlanmalıdır.');
      return;
    }
    setError(null);
    setUnits((prev) => prev.filter((u) => u !== unitToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Lütfen Ad Soyad ve E-posta alanlarını eksiksiz doldurunuz.');
      return;
    }
    if (!isSuperAdmin && units.length === 0) {
      setError('Lütfen en az bir daire numarası ekleyiniz.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        email,
        phone: phone.trim() || undefined,
        role: isSuperAdmin ? 'admin' : 'member',
        groupId: isSuperAdmin ? groupId : user?.groupId,
        password,
        units: isSuperAdmin ? undefined : units,
        residentType: isSuperAdmin ? undefined : residentType,
      });

      // Reset
      setName('');
      setEmail('');
      setPhone('');
      setUnits(['Daire 1']);
      setPassword(isSuperAdmin ? 'Admin123!' : 'User123!');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kayıt oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuperAdmin ? 'Yeni Yönetici (Admin) Tanımla' : 'Yeni Daire & Sakin Tanımla'}
      icon={
        isSuperAdmin ? (
          <Shield size={18} className="text-indigo-600" />
        ) : (
          <Home size={18} className="text-indigo-600" />
        )
      }
    >
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded text-xs font-medium mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* If Super Admin, show target organization picker */}
        {isSuperAdmin ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">
              Yöneticinin Bağlı Olacağı Organizasyon (Bina / Site)
            </label>
            <select
              className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  🏢 {g.name} ({g.slug})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Bina / Site:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 size={13} className="text-indigo-600" />
              {user?.group?.name || 'Sitera Rezidans'}
            </span>
          </div>
        )}

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">
            {isSuperAdmin ? 'Yönetici Adı Soyadı' : 'Ev Sahibi / Sakin Adı Soyadı'}
          </label>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 placeholder-slate-400"
            placeholder={isSuperAdmin ? 'örn. Kemal Yılmaz' : 'örn. Ahmet Yılmaz'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Multi-Apartment Assignment (Only for regular Admins) */}
        {!isSuperAdmin && (
          <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Home size={13} className="text-indigo-600" />
                <span>Sahip Olduğu Daire(ler)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                1 ev sahibinin birden fazla dairesi olabilir
              </span>
            </div>

            {/* Current Units Chips */}
            <div className="flex flex-wrap gap-1.5 my-1">
              {units.map((unit) => (
                <span
                  key={unit}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-700 font-mono font-bold text-xs shadow-2xs"
                >
                  <span>{unit}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUnit(unit)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                    title="Daireyi Kaldır"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Quick Add Apartment Input */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUnit();
                  }
                }}
                placeholder="Yeni Daire Ekle (örn: Daire 5, B Blok D.2)"
                className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleAddUnit}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus size={13} />
                <span>Ekle</span>
              </button>
            </div>
          </div>
        )}

        {/* Resident Type (Owner vs Tenant) */}
        {!isSuperAdmin && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">Mülkiyet & İkamet Durumu</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setResidentType('owner')}
                className={`py-1.5 px-2 rounded border text-center font-semibold transition-colors ${
                  residentType === 'owner'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Ev Sahibi (Malik)
              </button>
              <button
                type="button"
                onClick={() => setResidentType('both')}
                className={`py-1.5 px-2 rounded border text-center font-semibold transition-colors ${
                  residentType === 'both'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Malik & İkamet
              </button>
              <button
                type="button"
                onClick={() => setResidentType('tenant')}
                className={`py-1.5 px-2 rounded border text-center font-semibold transition-colors ${
                  residentType === 'tenant'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Kiracı
              </button>
            </div>
          </div>
        )}

        {/* Email & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">E-Posta Adresi</label>
            <input
              type="email"
              className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 placeholder-slate-400 font-mono"
              placeholder="ornek@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">Telefon Numarası</label>
            <input
              type="tel"
              className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 placeholder-slate-400 font-mono"
              placeholder="+90 555 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Initial Password */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Giriş Şifresi</label>
            <span className="text-[10px] text-slate-400">Portal ilk giriş şifresi</span>
          </div>
          <div className="relative flex items-center">
            <Lock size={13} className="text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded pl-7 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
              placeholder={isSuperAdmin ? 'Admin123!' : 'User123!'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-2xs transition-colors"
          >
            {submitting
              ? 'Kaydediliyor...'
              : isSuperAdmin
              ? 'Yöneticiyi Tanımla'
              : 'Daire & Sakini Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
