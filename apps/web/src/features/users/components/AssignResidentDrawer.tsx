import React, { useState, useEffect } from 'react';
import { User, UpdateUserDto, ResidentType } from '@sitera/shared';
import { X, UserCheck, Home, Check } from 'lucide-react';

interface AssignResidentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (id: string, dto: UpdateUserDto) => Promise<any>;
}

export const AssignResidentDrawer: React.FC<AssignResidentDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [residentType, setResidentType] = useState<ResidentType>('owner');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const isPlaceholderName =
        user.name.toLowerCase().startsWith('daire') ||
        user.name.toLowerCase().includes('blok') ||
        user.name === user.group?.name;

      setName(isPlaceholderName ? '' : user.name);
      setEmail(user.email.endsWith('@sitera.dev') ? '' : user.email);
      setPhone(user.phone || '');
      setResidentType(user.residentType || 'owner');
    }
  }, [user]);

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

      await onUpdate(user.id, {
        name: name.trim(),
        email: targetEmail,
        phone: phone.trim() || undefined,
        residentType,
      });

      onClose();
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-xs">
              {error}
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

          {/* Resident Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Malik / Sakin Adı Soyadı
            </label>
            <input
              type="text"
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors"
              placeholder="örn. Ahmet Yılmaz"
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
            <label className="text-xs font-semibold text-slate-700">E-Posta (İsteğe Bağlı)</label>
            <input
              type="email"
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 font-mono transition-colors"
              placeholder="ahmet@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
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
      </aside>
    </>
  );
};
