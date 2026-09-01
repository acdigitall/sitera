import React, { useState, useEffect } from 'react';
import { CreateUserDto, Group, ResidentType } from '@sitera/shared';
import { X, Plus, Shuffle } from 'lucide-react';
import { useAuth } from '../../auth';

interface CreateUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateUserDto) => Promise<any>;
  groups: Group[];
  defaultGroupId?: string;
}

export const CreateUserDrawer: React.FC<CreateUserDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  groups,
  defaultGroupId,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  // Super Admin: Direct site name input
  const [groupName, setGroupName] = useState('');
  const [isSelectingExistingGroup, setIsSelectingExistingGroup] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(isSuperAdmin ? 'Admin123!' : 'User123!');
  const [residentType, setResidentType] = useState<ResidentType>('owner');
  const [groupId, setGroupId] = useState(defaultGroupId || user?.groupId || (groups[0]?.id ?? ''));

  // Multi-unit management
  const [units, setUnits] = useState<string[]>(['Daire 1']);
  const [newUnitInput, setNewUnitInput] = useState('');
  const [isAddingUnit, setIsAddingUnit] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAddUnit = () => {
    const trimmed = newUnitInput.trim();
    if (!trimmed) {
      setIsAddingUnit(false);
      return;
    }
    const formatted = trimmed.toLowerCase().startsWith('daire')
      ? trimmed
      : `Daire ${trimmed}`;

    if (!units.includes(formatted)) {
      setUnits((prev) => [...prev, formatted]);
    }
    setNewUnitInput('');
    setIsAddingUnit(false);
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    if (units.length <= 1) {
      setError('En az bir daire numarası bulunmalıdır.');
      return;
    }
    setError(null);
    setUnits((prev) => prev.filter((u) => u !== unitToRemove));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuperAdmin && !isSelectingExistingGroup && !groupName.trim()) {
      setError('Lütfen Site / Bina Adını giriniz.');
      return;
    }
    if (!name.trim() || !email.trim()) {
      setError('Lütfen Ad Soyad ve E-posta alanlarını doldurunuz.');
      return;
    }
    if (!isSuperAdmin && units.length === 0) {
      setError('Lütfen en az bir daire numarası belirleyiniz.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        role: isSuperAdmin ? 'admin' : 'member',
        groupId: isSuperAdmin ? (isSelectingExistingGroup ? groupId : undefined) : user?.groupId,
        groupName: isSuperAdmin && !isSelectingExistingGroup ? groupName.trim() : undefined,
        password,
        units: isSuperAdmin ? undefined : units,
        residentType: isSuperAdmin ? undefined : residentType,
      });

      // Reset form
      setGroupName('');
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
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] md:w-[480px] bg-white border-l border-slate-200 shadow-xl flex flex-col justify-between transform transition-transform duration-200 ease-out select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              {isSuperAdmin ? 'Yeni Yönetici & Site Tanımla' : 'Yeni Daire Ekle'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-xs">
              {error}
            </div>
          )}

          {/* SuperAdmin: Direct Site / Organization Name Input */}
          {isSuperAdmin && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Site / Bina Adı</label>
                {groups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsSelectingExistingGroup(!isSelectingExistingGroup)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {isSelectingExistingGroup ? 'Yeni Site Adı Yaz' : 'Mevcut Sitelerden Seç'}
                  </button>
                )}
              </div>

              {isSelectingExistingGroup && groups.length > 0 ? (
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 font-medium"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  required
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.slug})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors font-medium placeholder-slate-400"
                  placeholder="örn. Akasya Konutları, Gül Rezidans"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              )}
            </div>
          )}

          {/* 1. Daire(ler) Tag Section (Regular Admin only) */}
          {!isSuperAdmin && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Daire / Kapı No
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {units.length > 1 ? `${units.length} Daire Maliki` : ''}
                </span>
              </div>

              {/* Clean Tag Input Bar */}
              <div className="min-h-[40px] p-1.5 bg-slate-50 border border-slate-200 rounded flex flex-wrap items-center gap-1.5 focus-within:bg-white focus-within:border-slate-400 transition-colors">
                {units.map((unit) => (
                  <span
                    key={unit}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded bg-white border border-slate-200 text-slate-900 font-mono font-semibold text-xs shadow-2xs"
                  >
                    <span>{unit}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUnit(unit)}
                      className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}

                {isAddingUnit ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={newUnitInput}
                      onChange={(e) => setNewUnitInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUnit();
                        } else if (e.key === 'Escape') {
                          setIsAddingUnit(false);
                          setNewUnitInput('');
                        }
                      }}
                      onBlur={handleAddUnit}
                      placeholder="Daire No (örn: 5)"
                      className="w-28 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-900 outline-none font-mono"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingUnit(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 text-xs transition-colors"
                  >
                    <Plus size={11} />
                    <span>Daire Ekle</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. Resident / Admin Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {isSuperAdmin ? 'Yönetici Adı Soyadı' : 'Malik / Sakin Adı Soyadı'}
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors"
              placeholder="Ad ve Soyad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* 3. Mülkiyet Tipi: Sleek Linear/iOS-style Segmented Switch */}
          {!isSuperAdmin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Mülkiyet Durumu</label>
              <div className="p-0.5 bg-slate-100 rounded flex gap-0.5 border border-slate-200/60 text-xs">
                <button
                  type="button"
                  onClick={() => setResidentType('owner')}
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all ${
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
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all ${
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
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all ${
                    residentType === 'tenant'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Kiracı
                </button>
              </div>
            </div>
          )}

          {/* 4. Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">E-Posta</label>
              <input
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 font-mono transition-colors"
                placeholder="ornek@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Telefon</label>
              <input
                type="tel"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 font-mono transition-colors"
                placeholder="+90 5XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* 5. Password */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Portal Giriş Şifresi</label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <Shuffle size={11} />
                <span>Rastgele Üret</span>
              </button>
            </div>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 font-mono transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </form>

        {/* Footer */}
        <div className="h-14 px-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs disabled:opacity-50"
          >
            {submitting ? 'Kaydediliyor...' : isSuperAdmin ? 'Yöneticiyi Kaydet' : 'Daireyi Kaydet'}
          </button>
        </div>
      </aside>
    </>
  );
};
