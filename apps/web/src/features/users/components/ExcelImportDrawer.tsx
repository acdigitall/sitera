import React, { useState, useEffect } from 'react';
import { CreateUserDto, Group, ResidentType } from '@sitera/shared';
import { X, Download, UploadCloud, CheckCircle2, AlertCircle, FileText, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../auth';

interface ExcelImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dtos: CreateUserDto[]) => Promise<any>;
  groups: Group[];
  defaultGroupId?: string;
}

interface ParsedRow {
  unit: string;
  name: string;
  email: string;
  phone: string;
  residentType: ResidentType;
  isValid: boolean;
  error?: string;
}

export const ExcelImportDrawer: React.FC<ExcelImportDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  groups,
  defaultGroupId,
}) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ParsedRow[]>([]);
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

  // Download Sample Template as genuine .xlsx Excel file
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        Daire_No: 'A Blok D.1',
        Malik_Adi: 'Ahmet Yılmaz',
        E_Posta: 'ahmet@gmail.com',
        Telefon: '+905551112233',
        Mulkiyet_Tipi: 'Ev Sahibi',
      },
      {
        Daire_No: 'A Blok D.2',
        Malik_Adi: 'Mehmet Demir',
        E_Posta: 'mehmet@gmail.com',
        Telefon: '+905552223344',
        Mulkiyet_Tipi: 'Kiracı',
      },
      {
        Daire_No: 'A Blok D.3',
        Malik_Adi: 'Ayşe Kaya',
        E_Posta: 'ayse@gmail.com',
        Telefon: '+905553334455',
        Mulkiyet_Tipi: 'Malik & İkamet',
      },
      {
        Daire_No: 'A Blok D.4',
        Malik_Adi: 'Fatma Şahin',
        E_Posta: 'fatma@gmail.com',
        Telefon: '+905554445566',
        Mulkiyet_Tipi: 'Ev Sahibi',
      },
      {
        Daire_No: 'B Blok D.1',
        Malik_Adi: 'Can Yıldız',
        E_Posta: 'can@gmail.com',
        Telefon: '+905555556677',
        Mulkiyet_Tipi: 'Ev Sahibi',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 16 }, // Daire_No
      { wch: 22 }, // Malik_Adi
      { wch: 26 }, // E_Posta
      { wch: 18 }, // Telefon
      { wch: 18 }, // Mulkiyet_Tipi
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daireler');
    XLSX.writeFile(workbook, 'sitera_daire_sakin_sablonu.xlsx');
  };

  // Parse Uploaded File (.xlsx, .xls, .csv, .txt)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      // XLSX can read both binary Excel (.xlsx, .xls) and text (.csv, .tsv) files directly
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        setError('Excel dosyasında herhangi bir çalışma sayfası bulunamadı.');
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawRows.length <= 1) {
        setError('Yüklenen dosya boş veya yalnızca başlık satırı içeriyor.');
        return;
      }

      // 1. Satır: Başlıklar
      const headerCols = rawRows[0].map((c: any) =>
        String(c || '')
          .trim()
          .toLowerCase()
          .replace(/^"|"$/g, '')
      );

      let unitIdx = headerCols.findIndex((c) => c.includes('daire') || c.includes('unit') || c.includes('kapı') || c.includes('blok'));
      let nameIdx = headerCols.findIndex((c) => c.includes('ad') || c.includes('isim') || c.includes('name') || c.includes('malik') || c.includes('sakin'));
      let emailIdx = headerCols.findIndex((c) => c.includes('posta') || c.includes('mail') || c.includes('email'));
      let phoneIdx = headerCols.findIndex((c) => c.includes('tel') || c.includes('phone') || c.includes('gsm'));
      let typeIdx = headerCols.findIndex((c) => c.includes('mülkiyet') || c.includes('mulkiyet') || c.includes('tip') || c.includes('type') || c.includes('durum'));

      // Başlıklar bulunamazsa varsayılan sıra: [0: Daire, 1: İsim, 2: E-Posta, 3: Telefon, 4: Tip]
      if (unitIdx === -1) unitIdx = 0;
      if (nameIdx === -1) nameIdx = 1;
      if (emailIdx === -1) emailIdx = 2;
      if (phoneIdx === -1) phoneIdx = 3;
      if (typeIdx === -1) typeIdx = 4;

      const parsed: ParsedRow[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || row.every((c: any) => !c || String(c).trim() === '')) {
          continue;
        }

        const unit = String(row[unitIdx] || '').trim() || `Daire ${i}`;
        const name = String(row[nameIdx] || '').trim() || `Sakin ${i}`;
        let email = String(row[emailIdx] || '').trim();
        const phone = String(row[phoneIdx] || '').trim() || '+90 555 123 4567';
        const rawType = String(row[typeIdx] || '').trim().toLowerCase();

        // E-posta girilmemişse sakine otomatik geçerli daire e-postası ata
        if (!email) {
          const cleanUnit = unit.toLowerCase().replace(/[^a-z0-9]/g, '');
          email = `sakin.${cleanUnit || i}@sitera.local`;
        }

        const residentType: ResidentType = rawType.includes('kirac')
          ? 'tenant'
          : rawType.includes('ikamet')
          ? 'both'
          : 'owner';

        const isValid = Boolean(name && email && email.includes('@'));

        parsed.push({
          unit,
          name,
          email,
          phone,
          residentType,
          isValid,
          error: !isValid ? 'Geçersiz e-posta veya eksik isim' : undefined,
        });
      }

      if (parsed.length === 0) {
        setError('Dosyada geçerli satır bulunamadı. Lütfen indirilen örnek şablona uygun Excel (.xlsx) veya CSV yükleyiniz.');
        return;
      }

      setRows(parsed);
    } catch (err: any) {
      setError('Dosya okunurken bir hata oluştu: ' + (err.message || 'Lütfen geçerli bir .xlsx veya .csv dosyası yükleyiniz.'));
    }
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setError('İçe aktarılacak geçerli kayıt bulunamadı.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const dtos: CreateUserDto[] = validRows.map((r) => ({
        name: r.name,
        email: r.email,
        phone: r.phone,
        units: [r.unit],
        residentType: r.residentType,
        groupId: defaultGroupId || user?.groupId,
        password: 'User123!',
      }));

      await onSubmit(dtos);
      onClose();
    } catch (err: any) {
      setError(err.message || 'İçe aktarma sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] md:w-[600px] bg-white border-l border-slate-200 shadow-xl flex flex-col justify-between transform transition-transform duration-200 ease-out select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-900" />
            <h2 className="font-bold text-slate-900 text-sm">
              Excel / CSV ile Toplu Daire & Sakin İçe Aktar
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
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-xs">
              {error}
            </div>
          )}

          {/* Step 1: Download template */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900">1. Örnek Excel (.xlsx) Şablonu</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Daire No, Sakin Adı, Telefon, E-Posta sütunlarını içeren hazır Excel şablonu.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
            >
              <Download size={13} />
              <span>Excel Şablonunu İndir (.xlsx)</span>
            </button>
          </div>

          {/* Step 2: Upload Zone */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">2. Doldurulan Dosyayı Yükleyin</div>
            <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition-colors text-center">
              <UploadCloud size={24} className="text-slate-400 mb-1.5" />
              <span className="text-xs font-semibold text-slate-900">
                Excel (.xlsx, .xls) veya CSV dosyasını buraya sürükleyin
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">veya bilgisayarınızdan seçmek için tıklayın</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Step 3: Data Preview Table */}
          {rows.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">Dosya Doğrulama Önizlemesi</span>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-emerald-700 font-semibold">{validCount} Geçerli</span>
                  {invalidCount > 0 && <span className="text-rose-600 font-semibold">{invalidCount} Hatalı</span>}
                </div>
              </div>

              <div className="border border-slate-200 rounded max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Daire</th>
                      <th className="py-2 px-3">Malik / Sakin</th>
                      <th className="py-2 px-3">E-Posta</th>
                      <th className="py-2 px-3 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {rows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.unit}</td>
                        <td className="py-2 px-3 font-sans font-medium">{row.name}</td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[130px]">{row.email}</td>
                        <td className="py-2 px-3 text-right">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-sans font-semibold">
                              <CheckCircle2 size={12} /> Hazır
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-sans font-semibold" title={row.error}>
                              <AlertCircle size={12} /> Hatalı
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-slate-500">
            {rows.length > 0 ? `${validCount} Daire İçe Aktarılacak` : 'Dosya bekleniyor'}
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
              onClick={handleImport}
              disabled={submitting || validCount === 0}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Aktarılıyor...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>{validCount > 0 ? `${validCount} Daireyi İçe Aktar` : 'İçe Aktar'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
