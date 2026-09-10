import { describe, it, expect } from 'vitest';
import {
  FinanceCalculationEngine,
  roundToPennies,
} from '../finance-engine';

describe('FinanceCalculationEngine (Pure Domain Finans Motoru)', () => {
  // ==========================================
  // 1. KURUŞ VE YUVARLAMA HASSASİYETİ TESTLERİ
  // ==========================================
  describe('roundToPennies', () => {
    it('kuruş hassasiyetini (2 ondalık basamak) kuruş kaybetmeden yuvarlamalıdır', () => {
      expect(roundToPennies(10.555)).toBe(10.56);
      expect(roundToPennies(10.554)).toBe(10.55);
      expect(roundToPennies(0.1 + 0.2)).toBe(0.3); // IEEE 754 float koruması
      expect(roundToPennies(1250)).toBe(1250);
      expect(roundToPennies(0)).toBe(0);
    });
  });

  // ==========================================
  // 2. KMK MADDE 20 GECİKME TAZMİNATI TESTLERİ
  // ==========================================
  describe('calculateKmkLateFee (Kat Mülkiyeti Kanunu Madde 20)', () => {
    it('vadesi henüz dolmamış borç için 0 faiz ve unpaid statüsü dönmelidir', () => {
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 2000,
        paidAmount: 0,
        dueDate: '2026-09-30',
        asOfDate: '2026-09-15',
        lateFeeRate: 5,
        lateFeeEnabled: true,
      });

      expect(result.isOverdue).toBe(false);
      expect(result.overdueDays).toBe(0);
      expect(result.lateFee).toBe(0);
      expect(result.unpaidPrincipal).toBe(2000);
      expect(result.totalWithLateFee).toBe(2000);
      expect(result.status).toBe('unpaid');
    });

    it('vade günü bugün olan borç için henüz faiz işletilmemelidir', () => {
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 1500,
        paidAmount: 0,
        dueDate: '2026-09-15',
        asOfDate: '2026-09-15',
        lateFeeRate: 5,
      });

      expect(result.isOverdue).toBe(false);
      expect(result.lateFee).toBe(0);
      expect(result.totalWithLateFee).toBe(1500);
    });
    

    it('vadesi 1 gün geçmiş borç için KMK gereği 1 aylık tam faiz (%5) işletmelidir', () => {
      // 2000 TL borç * %5 = 100 TL gecikme zammı
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 2000,
        paidAmount: 0,
        dueDate: '2026-08-31',
        asOfDate: '2026-09-01', // 1 gün geçmiş
        lateFeeRate: 5,
        lateFeeEnabled: true,
      });

      expect(result.isOverdue).toBe(true);
      expect(result.overdueDays).toBe(1);
      expect(result.monthsLate).toBe(1);
      expect(result.lateFee).toBe(100);
      expect(result.totalWithLateFee).toBe(2100);
      expect(result.status).toBe('overdue');
    });

    it('vadesi 30 gün geçmiş borç için 1 aylık faiz işletmelidir', () => {
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 1000,
        paidAmount: 0,
        dueDate: '2026-08-01',
        asOfDate: '2026-08-31', // 30 gün
        lateFeeRate: 5,
      });

      expect(result.monthsLate).toBe(1);
      expect(result.lateFee).toBe(50);
      expect(result.totalWithLateFee).toBe(1050);
    });

    it('vadesi 31 gün geçmiş borç için 2 aylık faiz (%10) işletmelidir', () => {
      // 1000 TL * %5 * 2 ay = 100 TL
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 1000,
        paidAmount: 0,
        dueDate: '2026-07-31',
        asOfDate: '2026-08-31', // 31 gün
        lateFeeRate: 5,
      });

      expect(result.monthsLate).toBe(2);
      expect(result.lateFee).toBe(100);
      expect(result.totalWithLateFee).toBe(1100);
    });

    it('vadesi 75 gün geçmiş borç için 3 aylık faiz (%15) işletmelidir', () => {
      // 4000 TL * %5 * 3 ay = 600 TL
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 4000,
        paidAmount: 0,
        dueDate: '2026-06-01',
        asOfDate: '2026-08-15', // 75 gün
        lateFeeRate: 5,
      });

      expect(result.monthsLate).toBe(3);
      expect(result.lateFee).toBe(600);
      expect(result.totalWithLateFee).toBe(4600);
    });

    it('kısmi ödeme yapılmışsa faiz SADECE ödenmemiş anapara üzerinden işletilmelidir', () => {
      // Toplam borç: 5.000 TL, Ödenen: 3.000 TL, Kalan: 2.000 TL
      // 1 ay gecikme * %5 = 2.000 * 0.05 = 100 TL faiz (asla 5000 üzerinden 250 TL hesaplanmamalı!)
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 5000,
        paidAmount: 3000,
        dueDate: '2026-08-15',
        asOfDate: '2026-09-01', // 17 gün gecikme -> 1 ay
        lateFeeRate: 5,
      });

      expect(result.unpaidPrincipal).toBe(2000);
      expect(result.lateFee).toBe(100);
      expect(result.totalWithLateFee).toBe(2100);
      expect(result.status).toBe('overdue');
    });

    it('borç tamamen ödenmişse (paidAmount >= amount) faiz 0 olmalı ve status paid kalmalıdır', () => {
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 2500,
        paidAmount: 2500,
        dueDate: '2026-05-01',
        asOfDate: '2026-09-01', // Vadesi 4 ay geçmiş olsa dahi ödenmiştir
        lateFeeRate: 5,
      });

      expect(result.isOverdue).toBe(false);
      expect(result.lateFee).toBe(0);
      expect(result.unpaidPrincipal).toBe(0);
      expect(result.totalWithLateFee).toBe(0);
      expect(result.status).toBe('paid');
    });

    it('ayarlarda gecikme faizi kapalı ise (lateFeeEnabled: false) faiz 0 olmalıdır', () => {
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 3000,
        paidAmount: 0,
        dueDate: '2026-07-01',
        asOfDate: '2026-09-01', // 62 gün gecikme
        lateFeeRate: 5,
        lateFeeEnabled: false,
      });

      expect(result.isOverdue).toBe(true);
      expect(result.lateFee).toBe(0);
      expect(result.totalWithLateFee).toBe(3000);
      expect(result.status).toBe('overdue');
    });

    it('özel gecikme faiz oranını (%8) doğru hesaplamalıdır', () => {
      // 10.000 TL * %8 * 1 ay = 800 TL faiz
      const result = FinanceCalculationEngine.calculateKmkLateFee({
        amount: 10000,
        paidAmount: 0,
        dueDate: '2026-08-15',
        asOfDate: '2026-08-25',
        lateFeeRate: 8,
      });

      expect(result.lateFee).toBe(800);
      expect(result.totalWithLateFee).toBe(10800);
    });
  });

  // ==========================================
  // 3. AİDAT & ORTAK GİDER PAYLAŞTIRMA TESTLERİ
  // ==========================================
  describe('calculateExpenseSplit (Gider Dağıtım Algoritmaları)', () => {
    it('equal_split: tam bölünen tutarı dairelere eşit dağıtmalıdır', () => {
      const units = [
        { unit: 'Daire 1' },
        { unit: 'Daire 2' },
        { unit: 'Daire 3' },
        { unit: 'Daire 4' },
      ];
      const result = FinanceCalculationEngine.calculateExpenseSplit({
        calculationMode: 'equal_split',
        totalAmount: 10000,
        units,
      });

      expect(result).toHaveLength(4);
      expect(result.every((r) => r.amount === 2500)).toBe(true);
      const sum = result.reduce((s, r) => s + r.amount, 0);
      expect(roundToPennies(sum)).toBe(10000);
    });

    it('equal_split: KURUŞ DENGELEME - 1.000 TL 3 daireye bölündüğünde toplam kuruşu kuruşuna 1.000,00 TL olmalıdır', () => {
      const units = [
        { unit: 'Daire 1' },
        { unit: 'Daire 2' },
        { unit: 'Daire 3' },
      ];
      const result = FinanceCalculationEngine.calculateExpenseSplit({
        calculationMode: 'equal_split',
        totalAmount: 1000,
        units,
      });

      expect(result).toHaveLength(3);
      // 1000 / 3 = 333.3333...
      // Kuruş dengeleme: 333.34 + 333.33 + 333.33 = 1000.00 TL
      expect(result[0].amount).toBe(333.34);
      expect(result[1].amount).toBe(333.33);
      expect(result[2].amount).toBe(333.33);

      const sum = result.reduce((s, r) => s + r.amount, 0);
      expect(roundToPennies(sum)).toBe(1000);
    });

    it('equal_split: 7 daireye 50.000 TL asansör tamiri bölündüğünde kuruş sızmamalıdır', () => {
      const units = Array.from({ length: 7 }, (_, i) => ({ unit: `Daire ${i + 1}` }));
      const result = FinanceCalculationEngine.calculateExpenseSplit({
        calculationMode: 'equal_split',
        totalAmount: 50000,
        units,
        isFixture: true,
      });

      expect(result).toHaveLength(7);
      // Hepsi kat malikine (owner) atanmalı
      expect(result.every((r) => r.targetRole === 'owner')).toBe(true);

      const sum = result.reduce((s, r) => s + r.amount, 0);
      expect(roundToPennies(sum)).toBe(50000);
    });

    it('share: Tapu arsa payı veya m² bazlı ağırlıklı dağıtımda toplam tutar kuruşu kuruşuna denk gelmelidir', () => {
      const units = [
        { unit: 'A-1', m2: 80 },
        { unit: 'A-2', m2: 120 },
        { unit: 'A-3', m2: 100 },
      ];
      // Toplam m2: 300
      // Paylar: 80/300 (%26.67), 120/300 (%40), 100/300 (%33.33)
      const result = FinanceCalculationEngine.calculateExpenseSplit({
        calculationMode: 'share',
        totalAmount: 30000,
        units,
      });

      expect(result[0].amount).toBe(8000);
      expect(result[1].amount).toBe(12000);
      expect(result[2].amount).toBe(10000);

      const sum = result.reduce((s, r) => s + r.amount, 0);
      expect(roundToPennies(sum)).toBe(30000);
    });

    it('unit_type: 1+1, 2+1 ve 3+1 daire tiplerine göre katsayıları uygulamalıdır', () => {
      const units = [
        { unit: 'Daire 1 (1+1)', unitType: '1+1' },
        { unit: 'Daire 2 (2+1)', unitType: '2+1' },
        { unit: 'Daire 3 (3+1)', unitType: '3+1' },
      ];
      const result = FinanceCalculationEngine.calculateExpenseSplit({
        calculationMode: 'unit_type',
        baseAmount: 1000,
        units,
      });

      expect(result[0].amount).toBe(800);  // 1+1: 0.8x
      expect(result[1].amount).toBe(1000); // 2+1: 1.0x
      expect(result[2].amount).toBe(1200); // 3+1: 1.2x
    });

    it('demirbaş harcamalarında (isFixture: true) hedef rol kat maliki (owner) olmalıdır', () => {
      const units = [{ unit: 'Daire 1' }, { unit: 'Daire 2' }];
      const result = FinanceCalculationEngine.calculateExpenseSplit({
        calculationMode: 'equal_split',
        totalAmount: 20000,
        units,
        isFixture: true,
      });

      expect(result[0].targetRole).toBe('owner');
      expect(result[1].targetRole).toBe('owner');
    });

    it('boş daire dizisinde boş sonuç dönmelidir', () => {
      const result = FinanceCalculationEngine.calculateExpenseSplit({
        calculationMode: 'equal_split',
        totalAmount: 5000,
        units: [],
      });
      expect(result).toEqual([]);
    });
  });

  // ==========================================
  // 4. TAHSİLAT & ÖDEME MUTABAKATI TESTLERİ
  // ==========================================
  describe('calculatePaymentAllocation (Tahsilat Mutabakatı)', () => {
    it('tam ödeme yapıldığında borç sıfırlanmalı ve paid statüsü almalıdır', () => {
      const result = FinanceCalculationEngine.calculatePaymentAllocation({
        debtAmount: 1250,
        currentPaidAmount: 0,
        paymentAmount: 1250,
      });

      expect(result.newPaidAmount).toBe(1250);
      expect(result.remainingBalance).toBe(0);
      expect(result.newStatus).toBe('paid');
      expect(result.isFullyPaid).toBe(true);
      expect(result.excessAmount).toBe(0);
    });

    it('kısmi ödeme yapıldığında bakiye düşmeli ve partial statüsü almalıdır', () => {
      const result = FinanceCalculationEngine.calculatePaymentAllocation({
        debtAmount: 2000,
        currentPaidAmount: 0,
        paymentAmount: 800,
      });

      expect(result.newPaidAmount).toBe(800);
      expect(result.remainingBalance).toBe(1200);
      expect(result.newStatus).toBe('partial');
      expect(result.isFullyPaid).toBe(false);
      expect(result.excessAmount).toBe(0);
    });

    it('önceden kısmi ödenmiş borca ikinci bir ödeme eklenip borç kapanabilmelidir', () => {
      const result = FinanceCalculationEngine.calculatePaymentAllocation({
        debtAmount: 2000,
        currentPaidAmount: 800,
        paymentAmount: 1200,
      });

      expect(result.newPaidAmount).toBe(2000);
      expect(result.remainingBalance).toBe(0);
      expect(result.newStatus).toBe('paid');
      expect(result.isFullyPaid).toBe(true);
    });

    it('fazla ödeme durumunda excessAmount doğru tespit edilmelidir', () => {
      const result = FinanceCalculationEngine.calculatePaymentAllocation({
        debtAmount: 1000,
        currentPaidAmount: 0,
        paymentAmount: 1500,
      });

      expect(result.newPaidAmount).toBe(1000);
      expect(result.remainingBalance).toBe(0);
      expect(result.newStatus).toBe('paid');
      expect(result.excessAmount).toBe(500);
    });
  });

  // ==========================================
  // 5. FİNANSAL ÖZET METRİKLERİ TESTLERİ
  // ==========================================
  describe('calculateFinancialSummaryMetrics', () => {
    it('likidite, alacaklar, tahsilat oranı ve gecikme faizlerini eksiksiz konsolide etmelidir', () => {
      const accounts = [
        { balance: 50000 }, // Banka
        { balance: 5000 },  // Nakit Kasa
        { balance: 25000 }, // Fon
      ];

      const debts = [
        { amount: 2000, paidAmount: 2000, dueDate: '2026-08-31', status: 'paid' },
        { amount: 2000, paidAmount: 1000, dueDate: '2026-08-31', status: 'partial' },
        { amount: 2000, paidAmount: 0, dueDate: '2026-08-01', status: 'unpaid' }, // 1 ay gecikmede
      ];

      const expenses = [
        { amount: 8000 },
        { amount: 12000 },
      ];

      const summary = FinanceCalculationEngine.calculateFinancialSummaryMetrics({
        accounts,
        debts,
        expenses,
        annualBudget: 200000,
        asOfDate: '2026-09-01',
        lateFeeRate: 5,
        lateFeeEnabled: true,
        pendingApprovalsCount: 2,
        activePeriodName: 'Ağustos 2026',
      });

      expect(summary.totalLiquidity).toBe(80000);
      expect(summary.totalCollected).toBe(3000);
      expect(summary.totalReceivable).toBe(3000); // 1000 (partial) + 2000 (unpaid)
      // Toplam borç: 6000, Tahsil edilen: 3000 -> %50
      expect(summary.collectionRate).toBe(50);
      expect(summary.totalExpenses).toBe(20000);
      // 20.000 / 200.000 -> %10 bütçe harcanmış
      expect(summary.budgetSpentRate).toBe(10);
      expect(summary.pendingApprovalsCount).toBe(2);
      expect(summary.activePeriodName).toBe('Ağustos 2026');
      // Vadesi geçen borçlar:
      // 2. borç (2026-08-31 -> 2026-09-01: 1 gün, 1 ay gecikme: kalan 1000 TL * %5 = 50 TL)
      // 3. borç (2026-08-01 -> 2026-09-01: 31 gün, Ağustos 31 gün çektiğinden 2 ay gecikme: 2000 TL * %5 * 2 = 200 TL)
      // Toplam: 50 + 200 = 250 TL
      expect(summary.overdueDebtsCount).toBe(2);
      expect(summary.totalLateFees).toBe(250);
    });

    it('0 borç veya 0 bütçe durumunda bölme hatası (NaN) vermemelidir', () => {
      const summary = FinanceCalculationEngine.calculateFinancialSummaryMetrics({
        accounts: [],
        debts: [],
        expenses: [],
        annualBudget: 0,
      });

      expect(summary.totalLiquidity).toBe(0);
      expect(summary.collectionRate).toBe(0);
      expect(summary.budgetSpentRate).toBe(0);
      expect(summary.totalLateFees).toBe(0);
    });
  });

  // ==========================================
  // 6. SAKİN İLİŞİK KESME TESTLERİ
  // ==========================================
  describe('calculateResidentDischargeBalance', () => {
    it('sakinin ödenmemiş borçlarının kalan anaparasını doğru toplamalıdır', () => {
      const debts = [
        { amount: 1500, paidAmount: 1500, status: 'paid' },
        { amount: 1500, paidAmount: 500, status: 'partial' },
        { amount: 2000, paidAmount: 0, status: 'unpaid' },
      ];

      const balance = FinanceCalculationEngine.calculateResidentDischargeBalance(debts);
      // 1000 + 2000 = 3000 TL
      expect(balance.unpaidDebtsTotal).toBe(3000);
      expect(balance.unpaidDebtsCount).toBe(2);
    });

    it('tüm borçları ödenmiş sakinde 0 bakiye dönmelidir', () => {
      const debts = [
        { amount: 1250, paidAmount: 1250, status: 'paid' },
      ];

      const balance = FinanceCalculationEngine.calculateResidentDischargeBalance(debts);
      expect(balance.unpaidDebtsTotal).toBe(0);
      expect(balance.unpaidDebtsCount).toBe(0);
    });
  });
});
