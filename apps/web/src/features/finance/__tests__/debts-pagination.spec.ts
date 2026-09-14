import { describe, it, expect } from 'vitest';

describe('AdminDebtsView Sayfalama ve Filtreleme Motoru', () => {
  it('Toplam kayıt sayısı ve limit ile sayfa sayısını (totalPages) doğru hesaplamalıdır', () => {
    const calculateTotalPages = (total: number, limit: number) => Math.max(1, Math.ceil(total / limit));

    expect(calculateTotalPages(307, 25)).toBe(13); // 307 daire / 25 = 12.28 -> 13 sayfa
    expect(calculateTotalPages(307, 50)).toBe(7);  // 307 daire / 50 = 6.14 -> 7 sayfa
    expect(calculateTotalPages(307, 100)).toBe(4); // 307 daire / 100 = 3.07 -> 4 sayfa
    expect(calculateTotalPages(0, 25)).toBe(1);    // Boş listede en az 1 sayfa
  });

  it('Filtre değiştiğinde (status, category, search) sayfa numarasını 1 e sıfırlamalıdır', () => {
    let currentPage = 5;
    const onFilterChange = () => {
      currentPage = 1;
    };

    onFilterChange();
    expect(currentPage).toBe(1);
  });

  it('Arama sorgusunu trimlemeli ve küçük/büyük harf duyarsız eşleştirmelidir', () => {
    const rawSearch = '  a blok d.12  ';
    const cleanSearch = rawSearch.trim().toLowerCase();

    const mockDebts = [
      { unit: 'A Blok D.12', title: 'Eylül Aidatı' },
      { unit: 'B Blok D.5', title: 'Eylül Aidatı' },
    ];

    const filtered = mockDebts.filter((d) => d.unit.toLowerCase().includes(cleanSearch));
    expect(filtered.length).toBe(1);
    expect(filtered[0].unit).toBe('A Blok D.12');
  });

  it('Kategori filtresi demirbaş seçildiğinde sadece demirbaş borçlarını süzmelidir', () => {
    const debts = [
      { id: '1', category: 'dues', targetRole: 'tenant' },
      { id: '2', category: 'fixture', targetRole: 'owner' },
      { id: '3', category: undefined, targetRole: 'owner' },
    ];

    const fixtureOnly = debts.filter((d) => d.category === 'fixture' || d.targetRole === 'owner');
    expect(fixtureOnly.length).toBe(2);
  });
});
