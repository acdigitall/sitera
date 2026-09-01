import React, { useState, useEffect } from 'react';
import { CreateUserDto, Group, ResidentType } from '@sitera/shared';
import { X, Check, Layers, UserPlus, Home, Users } from 'lucide-react';
import { useAuth } from '../../auth';

interface BulkGeneratorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dtos: CreateUserDto[]) => Promise<any>;
  groups: Group[];
  defaultGroupId?: string;
}

interface UnitRowData {
  unitNo: number;
  displayName: string;
  residentName: string;
  phone: string;
  email: string;
  residentType: ResidentType;
}

export const BulkGeneratorDrawer: React.FC<BulkGeneratorDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  groups,
  defaultGroupId,
}) => {
  const { user } = useAuth();
  const [blockName, setBlockName] = useState('A Blok');
  const [startUnit, setStartUnit] = useState(1);
  const [totalUnits, setTotalUnits] = useState(10);
  const [namingFormat, setNamingFormat] = useState<'block_unit' | 'unit_only'>('block_unit');
  const [mode, setMode] = useState<'vacant_only' | 'with_residents'>('vacant_only');

  // Interactive inline table data for residents
  const [unitRows, setUnitRows] = useState<UnitRowData[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync unit rows whenever parameters change
  useEffect(() => {
    const count = Math.min(50, Math.max(1, totalUnits));
    const newRows: UnitRowData[] = Array.from({ length: count }, (_, i) => {
      const unitNo = startUnit + i;
      const displayName =
        namingFormat === 'block_unit' && blockName.trim()
          ? `${blockName.trim()} D.${unitNo}`
          : `Daire ${unitNo}`;

      // Check if previous data exists to keep user input
      const existing = unitRows.find((r) => r.unitNo === unitNo);

      return {
        unitNo,
        displayName,
        residentName: existing?.residentName || '',
        phone: existing?.phone || '',
        email: existing?.email || `daire${unitNo}@sitera.dev`,
        residentType: existing?.residentType || 'owner',
      };
    });

    setUnitRows(newRows);
  }, [blockName, startUnit, totalUnits, namingFormat]);

  const handleUpdateRow = (index: number, field: keyof UnitRowData, value: string) => {
    setUnitRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalUnits <= 0) {
      setError('Lütfen geçerli bir daire sayısı giriniz.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const dtos: CreateUserDto[] = unitRows.map((item) => {
        const hasResident = Boolean(item.residentName.trim());
        const finalName = hasResident ? item.residentName.trim() : item.displayName;
        const finalEmail = hasResident && item.email.includes('@')
          ? item.email.trim().toLowerCase()
          : `daire${item.unitNo}@sitera.dev`;

        return {
          name: finalName,
          email: finalEmail,
          phone: item.phone.trim() || undefined,
          groupId: defaultGroupId || user?.groupId,
          units: [item.displayName],
          residentType: item.residentType,
          password: 'User123!',
        };
      });

      await onSubmit(dtos);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Toplu oluşturma sırasında hata meydana geldi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] md:w-[620px] bg-white border-l border-slate-200 shadow-xl flex flex-col justify-between transform transition-transform duration-200 ease-out select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-slate-900" />
            <h2 className="font-bold text-slate-900 text-sm">
              Blok & Daire Sihirbazı
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
        <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-xs">
              {error}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Kurulum Yöntemi</label>
            <div className="p-0.5 bg-slate-100 rounded flex gap-0.5 border border-slate-200/60 text-xs">
              <button
                type="button"
                onClick={() => setMode('vacant_only')}
                className={`flex-1 py-1.5 px-2 rounded transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'vacant_only'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Home size={13} />
                <span>Boş Daireler (Sakin Sonra Atanacak)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('with_residents')}
                className={`flex-1 py-1.5 px-2 rounded transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'with_residents'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users size={13} />
                <span>Sakin İsimleriyle Birlikte Doldur</span>
              </button>
            </div>
          </div>

          {/* Block Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Blok Adı</label>
            <div className="flex gap-2">
              {['A Blok', 'B Blok', 'C Blok', 'Tek Blok'].map((blk) => (
                <button
                  key={blk}
                  type="button"
                  onClick={() => setBlockName(blk === 'Tek Blok' ? '' : blk)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    (blk === 'Tek Blok' && !blockName) || blockName === blk
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {blk}
                </button>
              ))}
            </div>
          </div>

          {/* Range: Start & Total */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Başlangıç Kapı No</label>
              <input
                type="number"
                min={1}
                value={startUnit}
                onChange={(e) => setStartUnit(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none font-mono focus:bg-white focus:border-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Toplam Daire Sayısı</label>
              <input
                type="number"
                min={1}
                max={50}
                value={totalUnits}
                onChange={(e) => setTotalUnits(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 outline-none font-mono focus:bg-white focus:border-slate-400"
              />
            </div>
          </div>

          {/* MODE 1: Vacant Units Live Chips */}
          {mode === 'vacant_only' && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Oluşturulacak Daireler ({unitRows.length})
                </span>
                <span className="text-[11px] text-slate-400">Boş / Sakin bekliyor olarak açılır</span>
              </div>

              <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded flex flex-wrap gap-1.5">
                {unitRows.map((item) => (
                  <span
                    key={item.unitNo}
                    className="font-mono text-xs font-semibold bg-white border border-slate-200 px-2 py-1 rounded text-slate-800 shadow-2xs"
                  >
                    {item.displayName}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                💡 Daireler açıldıktan sonra sakinleri listeden tek tıkla <strong>"+ Sakin Tanımla"</strong> butonuyla atayabilirsiniz.
              </p>
            </div>
          )}

          {/* MODE 2: Spreadsheet Quick Table */}
          {mode === 'with_residents' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">
                  Hızlı Sakin Bilgileri Giriş Tablosu
                </span>
                <span className="text-[11px] text-slate-400">İsteğe bağlı doldurabilirsiniz</span>
              </div>

              <div className="border border-slate-200 rounded max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-28">Daire</th>
                      <th className="py-2 px-3">Malik / Sakin Adı</th>
                      <th className="py-2 px-3 w-32">Telefon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {unitRows.map((row, idx) => (
                      <tr key={row.unitNo} className="hover:bg-slate-50/60">
                        <td className="py-1.5 px-3 font-mono font-bold text-slate-900 text-xs">
                          {row.displayName}
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            placeholder="örn. Ahmet Yılmaz"
                            value={row.residentName}
                            onChange={(e) => handleUpdateRow(idx, 'residentName', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            placeholder="05XX XXX XX XX"
                            value={row.phone}
                            onChange={(e) => handleUpdateRow(idx, 'phone', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 font-mono outline-none focus:bg-white focus:border-slate-400"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="h-14 px-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-slate-500">
            {unitRows.length} Daire Üretilecek
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Oluşturuluyor...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>{unitRows.length} Daireyi Oluştur</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
