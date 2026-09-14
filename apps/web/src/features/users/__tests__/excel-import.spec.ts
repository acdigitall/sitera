import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';

describe('ExcelImportDrawer (Excel Daire & Sakin Aktarım Motoru)', () => {
  // Simüle edilen Excel Şablon Verisi
  const mockTemplateData = [
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
      Daire_No: 'B Blok D.1',
      Malik_Adi: 'Can Yıldız',
      E_Posta: 'can@gmail.com',
      Telefon: '+905555556677',
      Mulkiyet_Tipi: 'Malik & İkamet',
    },
  ];

  it('XLSX çalışma sayfasını ikili dosyaya yazıp geri hatasız okuyabilmelidir', () => {
    const ws = XLSX.utils.json_to_sheet(mockTemplateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daireler');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    expect(buffer).toBeDefined();

    // Okuma doğrulaması
    const readWb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = readWb.Sheets['Daireler'];
    const parsedData: any[] = XLSX.utils.sheet_to_json(sheet);

    expect(parsedData.length).toBe(3);
    expect(parsedData[0].Daire_No).toBe('A Blok D.1');
    expect(parsedData[0].Malik_Adi).toBe('Ahmet Yılmaz');
    expect(parsedData[0].E_Posta).toBe('ahmet@gmail.com');
  });

  it('Geçersiz satırları (eksik e-posta veya daire no) filtrelemelidir', () => {
    const rawRows = [
      { Daire_No: 'A Blok D.1', Malik_Adi: 'Geçerli Kullanıcı', E_Posta: 'gecerli@site.com' },
      { Daire_No: '', Malik_Adi: 'Dairesiz', E_Posta: 'eksik1@site.com' },
      { Daire_No: 'B Blok D.2', Malik_Adi: 'E-postasız', E_Posta: '' },
    ];

    const validated = rawRows.map((row) => {
      const isValid = Boolean(row.Daire_No?.trim() && row.E_Posta?.trim());
      return { ...row, isValid };
    });

    const validRows = validated.filter((r) => r.isValid);
    expect(validRows.length).toBe(1);
    expect(validRows[0].Malik_Adi).toBe('Geçerli Kullanıcı');
  });

  it('Mülkiyet tipi etiketlerini sistemdeki ResidentType enumuna (owner/tenant) dönüştürmelidir', () => {
    const parseResidentType = (typeStr: string) => {
      const lower = (typeStr || '').toLowerCase();
      if (lower.includes('kiracı') || lower.includes('tenant')) return 'tenant';
      return 'owner';
    };

    expect(parseResidentType('Ev Sahibi')).toBe('owner');
    expect(parseResidentType('Malik & İkamet')).toBe('owner');
    expect(parseResidentType('Kiracı')).toBe('tenant');
    expect(parseResidentType('')).toBe('owner');
  });
});
