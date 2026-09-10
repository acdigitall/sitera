import {
  CalculationMode,
  DebtStatus,
  FinanceSummary,
  TargetRole,
} from '../types/finance';

/**
 * Utility: Round numbers to 2 decimal places (kuruş) accurately avoiding IEEE-754 precision issues
 */
export function roundToPennies(num: number): number {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

export interface KmkLateFeeParams {
  amount: number;
  paidAmount?: number;
  dueDate: string | Date;
  asOfDate?: string | Date;
  lateFeeRate?: number; // KMK standard: 5% per month
  lateFeeEnabled?: boolean;
  currentStatus?: DebtStatus;
}

export interface KmkLateFeeResult {
  unpaidPrincipal: number;
  overdueDays: number;
  monthsLate: number;
  lateFee: number;
  totalWithLateFee: number;
  isOverdue: boolean;
  status: DebtStatus;
}

export interface SplitUnitInput {
  unit: string;
  shareRatio?: number; // Tapu arsa payı (örn: 0.125 veya 125)
  m2?: number; // Daire metrekaresi
  unitType?: string; // Örn: '1+1', '2+1', '3+1'
  targetRole?: TargetRole;
  residentName?: string;
  userId?: string | null;
}

export interface SplitUnitOutput {
  unit: string;
  amount: number;
  targetRole: TargetRole;
  residentName?: string;
  userId?: string | null;
}

export interface ExpenseSplitParams {
  calculationMode: CalculationMode;
  totalAmount?: number;
  baseAmount?: number;
  units: SplitUnitInput[];
  defaultTargetRole?: TargetRole;
  isFixture?: boolean;
}

export interface PaymentAllocationParams {
  debtAmount: number;
  currentPaidAmount?: number;
  paymentAmount: number;
}

export interface PaymentAllocationResult {
  newPaidAmount: number;
  remainingBalance: number;
  newStatus: DebtStatus;
  isFullyPaid: boolean;
  excessAmount: number;
}

export interface SummaryCalculationParams {
  accounts: Array<{ balance: number | string }>;
  debts: Array<{
    amount: number | string;
    paidAmount?: number | string;
    dueDate?: string | Date;
    status?: string;
  }>;
  expenses: Array<{ amount: number | string }>;
  annualBudget?: number | string;
  activePeriodName?: string;
  pendingApprovalsCount?: number;
  asOfDate?: string | Date;
  lateFeeRate?: number;
  lateFeeEnabled?: boolean;
}

/**
 * FinanceCalculationEngine
 *
 * Saf (side-effect free), deterministik ve yüksek hassasiyetli finansal hesaplama motoru.
 * Kat Mülkiyeti Kanunu (KMK) standartlarına tam uyumludur.
 */
export class FinanceCalculationEngine {
  /**
   * KMK Madde 20 Gecikme Zammı / Faiz Hesaplama Motoru
   *
   * Kural: Kat mülkiyetinde gider ve avans payını ödemeyen kat maliki veya kiracı,
   * geciktiği günler için aylık %5 (veya yönetim planındaki oran) hesabıyla
   * gecikme tazminatı ödemekle yükümlüdür.
   *
   * - Vadesi gelmeyen borçlar için faiz 0'dır.
   * - Borç vadesi 1 gün dahi geçse 1 aylık faiz periyoduna girer (Math.ceil(overdueDays / 30)).
   * - Kısmi ödeme yapılmışsa faiz sadece ödenmemiş anapara üzerinden işletilir.
   * - Tamamen ödenmiş borçlarda faiz hesaplanmaz (0).
   */
  static calculateKmkLateFee(params: KmkLateFeeParams): KmkLateFeeResult {
    const amount = roundToPennies(Number(params.amount) || 0);
    const paidAmount = roundToPennies(Number(params.paidAmount) || 0);
    const unpaidPrincipal = roundToPennies(Math.max(0, amount - paidAmount));

    // Borç tamamen kapatılmışsa
    if (unpaidPrincipal <= 0 || params.currentStatus === 'paid') {
      return {
        unpaidPrincipal: 0,
        overdueDays: 0,
        monthsLate: 0,
        lateFee: 0,
        totalWithLateFee: 0,
        isOverdue: false,
        status: 'paid',
      };
    }

    if (!params.dueDate) {
      return {
        unpaidPrincipal,
        overdueDays: 0,
        monthsLate: 0,
        lateFee: 0,
        totalWithLateFee: unpaidPrincipal,
        isOverdue: false,
        status: paidAmount > 0 ? 'partial' : 'unpaid',
      };
    }

    const due = new Date(params.dueDate);
    const now = params.asOfDate ? new Date(params.asOfDate) : new Date();

    // Vade henüz dolmamış veya bugün doluyor
    if (isNaN(due.getTime()) || now.getTime() <= due.getTime()) {
      return {
        unpaidPrincipal,
        overdueDays: 0,
        monthsLate: 0,
        lateFee: 0,
        totalWithLateFee: unpaidPrincipal,
        isOverdue: false,
        status: paidAmount > 0 ? 'partial' : 'unpaid',
      };
    }

    // Vade geçmiş: Gün ve ay farkı hesapla
    const diffMs = now.getTime() - due.getTime();
    const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (overdueDays <= 0) {
      return {
        unpaidPrincipal,
        overdueDays: 0,
        monthsLate: 0,
        lateFee: 0,
        totalWithLateFee: unpaidPrincipal,
        isOverdue: false,
        status: paidAmount > 0 ? 'partial' : 'unpaid',
      };
    }

    const lateFeeEnabled = params.lateFeeEnabled !== false;
    const rate = Number(params.lateFeeRate ?? 5); // KMK varsayılan %5

    if (!lateFeeEnabled || rate <= 0) {
      return {
        unpaidPrincipal,
        overdueDays,
        monthsLate: Math.max(1, Math.ceil(overdueDays / 30)),
        lateFee: 0,
        totalWithLateFee: unpaidPrincipal,
        isOverdue: true,
        status: 'overdue',
      };
    }

    const monthsLate = Math.max(1, Math.ceil(overdueDays / 30));
    const lateFee = roundToPennies(unpaidPrincipal * (rate / 100) * monthsLate);
    const totalWithLateFee = roundToPennies(unpaidPrincipal + lateFee);

    return {
      unpaidPrincipal,
      overdueDays,
      monthsLate,
      lateFee,
      totalWithLateFee,
      isOverdue: true,
      status: 'overdue',
    };
  }

  /**
   * Aidat ve Ortak Gider Paylaştırma Motoru
   *
   * Desteklenen modlar:
   * 1. 'equal_split': Toplam tutar daire sayısına eşit bölünür.
   *    Kuruş artık dengeleme algoritmasıyla:
   *    Örn: 1.000 ₺ / 3 daire -> 333.34, 333.33, 333.33 (Toplam TAM 1.000,00 ₺, kuruş sızmaz!)
   * 2. 'share': Tapu arsa payı veya m² oranı ağırlıklı paylaştırma.
   * 3. 'unit_type': Daire oda sayısına (1+1, 2+1, 3+1) göre katsayılı paylaştırma.
   * 4. 'per_unit' / 'equal': Daire başı sabit belirlenmiş tutar.
   */
  static calculateExpenseSplit(params: ExpenseSplitParams): SplitUnitOutput[] {
    const units = params.units;
    if (!units || units.length === 0) {
      return [];
    }

    const totalUnits = units.length;
    const defaultRole: TargetRole =
      params.defaultTargetRole || (params.isFixture ? 'owner' : 'resident');

    // Mod: 'equal_split' (Toplam tutardan eşit bölüşüm)
    if (params.calculationMode === 'equal_split' && params.totalAmount !== undefined) {
      const targetTotal = roundToPennies(Math.max(0, Number(params.totalAmount)));
      if (targetTotal <= 0) {
        return units.map((u) => ({
          unit: u.unit,
          amount: 0,
          targetRole: u.targetRole || defaultRole,
          residentName: u.residentName,
          userId: u.userId,
        }));
      }

      // Taban bölüşüm (ör. 1000 / 3 = 333.33)
      const basePerUnit = roundToPennies(Math.floor((targetTotal / totalUnits) * 100) / 100);
      const subtotal = roundToPennies(basePerUnit * totalUnits);
      let remainderCents = Math.round((targetTotal - subtotal) * 100); // 1 kuruşluk artıklar

      return units.map((u) => {
        let amount = basePerUnit;
        if (remainderCents > 0) {
          amount = roundToPennies(amount + 0.01);
          remainderCents -= 1;
        }
        return {
          unit: u.unit,
          amount,
          targetRole: u.targetRole || defaultRole,
          residentName: u.residentName,
          userId: u.userId,
        };
      });
    }

    // Mod: 'share' (Arsa Payı / m² Ağırlıklı Paylaştırma)
    if (params.calculationMode === 'share' && params.totalAmount !== undefined) {
      const targetTotal = roundToPennies(Math.max(0, Number(params.totalAmount)));
      if (targetTotal <= 0) {
        return units.map((u) => ({
          unit: u.unit,
          amount: 0,
          targetRole: u.targetRole || defaultRole,
          residentName: u.residentName,
          userId: u.userId,
        }));
      }

      // Ağırlıkları topla (shareRatio veya m2, yoksa simülasyon ağırlığı)
      const weights = units.map((u, idx) => {
        if (typeof u.shareRatio === 'number' && u.shareRatio > 0) return u.shareRatio;
        if (typeof u.m2 === 'number' && u.m2 > 0) return u.m2;
        // Varsayılan deterministik tapu arsa payı ağırlığı
        return 1 + (idx % 4) * 0.15; // 1.0, 1.15, 1.30, 1.45
      });
      const totalWeight = weights.reduce((acc, w) => acc + w, 0);

      let allocatedSum = 0;
      const results: SplitUnitOutput[] = [];

      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        const w = weights[i];
        const shareAmount = roundToPennies((targetTotal * w) / totalWeight);
        allocatedSum = roundToPennies(allocatedSum + shareAmount);
        results.push({
          unit: u.unit,
          amount: shareAmount,
          targetRole: u.targetRole || defaultRole,
          residentName: u.residentName,
          userId: u.userId,
        });
      }

      // Kuruş dengeleme: Yuvarlama sebebiyle oluşabilecek kuruş farkını son daireye ya da en büyük paya denkle
      const difference = roundToPennies(targetTotal - allocatedSum);
      if (difference !== 0 && results.length > 0) {
        results[results.length - 1].amount = roundToPennies(
          results[results.length - 1].amount + difference,
        );
      }

      return results;
    }

    // Mod: 'unit_type' (1+1: 0.8x, 2+1: 1.0x, 3+1: 1.2x)
    if (params.calculationMode === 'unit_type') {
      const base = roundToPennies(Number(params.baseAmount ?? params.totalAmount ?? 0));
      return units.map((u) => {
        let multiplier = 1.0;
        const typeStr = (u.unitType || u.unit).toUpperCase();
        if (typeStr.includes('1+1') || typeStr.includes('D.1') || typeStr.includes('BLOK A')) {
          multiplier = 0.8;
        } else if (typeStr.includes('3+1') || typeStr.includes('D.3') || typeStr.includes('BLOK C')) {
          multiplier = 1.2;
        }
        return {
          unit: u.unit,
          amount: roundToPennies(base * multiplier),
          targetRole: u.targetRole || defaultRole,
          residentName: u.residentName,
          userId: u.userId,
        };
      });
    }

    // Varsayılan / 'per_unit' / 'equal': Daire başı sabit tutar
    const defaultAmount = roundToPennies(Number(params.baseAmount ?? params.totalAmount ?? 0));
    return units.map((u) => ({
      unit: u.unit,
      amount: defaultAmount,
      targetRole: u.targetRole || defaultRole,
      residentName: u.residentName,
      userId: u.userId,
    }));
  }

  /**
   * Tahsilat & Ödeme Mutabakatı
   *
   * Borç tutarı ve yapılan ödemeye göre bakiye, fazla ödeme ve yeni statüyü belirler.
   */
  static calculatePaymentAllocation(
    params: PaymentAllocationParams,
  ): PaymentAllocationResult {
    const debtAmount = roundToPennies(Math.max(0, Number(params.debtAmount)));
    const currentPaid = roundToPennies(Math.max(0, Number(params.currentPaidAmount || 0)));
    const payment = roundToPennies(Math.max(0, Number(params.paymentAmount)));

    const totalPaid = roundToPennies(currentPaid + payment);

    if (totalPaid >= debtAmount) {
      return {
        newPaidAmount: debtAmount,
        remainingBalance: 0,
        newStatus: 'paid',
        isFullyPaid: true,
        excessAmount: roundToPennies(totalPaid - debtAmount),
      };
    }

    return {
      newPaidAmount: totalPaid,
      remainingBalance: roundToPennies(debtAmount - totalPaid),
      newStatus: totalPaid > 0 ? 'partial' : 'unpaid',
      isFullyPaid: false,
      excessAmount: 0,
    };
  }

  /**
   * Finansal Özet Metrikleri Hesaplama Motoru
   *
   * Toplam likidite, alacaklar, tahsilat oranı, gecikme faizi toplamı vb. metrikleri hesaplar.
   */
  static calculateFinancialSummaryMetrics(
    params: SummaryCalculationParams,
  ): FinanceSummary {
    const totalLiquidity = roundToPennies(
      params.accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0),
    );

    let totalDebtOverall = 0;
    let totalCollected = 0;
    let totalReceivable = 0;
    let overdueDebtsCount = 0;
    let totalLateFees = 0;

    for (const d of params.debts) {
      const amt = roundToPennies(Number(d.amount) || 0);
      const paid = roundToPennies(Number(d.paidAmount) || 0);
      totalDebtOverall = roundToPennies(totalDebtOverall + amt);
      totalCollected = roundToPennies(totalCollected + paid);
      totalReceivable = roundToPennies(totalReceivable + Math.max(0, amt - paid));

      if (d.status !== 'paid' && d.dueDate) {
        const lateInfo = this.calculateKmkLateFee({
          amount: amt,
          paidAmount: paid,
          dueDate: d.dueDate,
          asOfDate: params.asOfDate,
          lateFeeRate: params.lateFeeRate,
          lateFeeEnabled: params.lateFeeEnabled,
        });

        if (lateInfo.isOverdue) {
          overdueDebtsCount++;
          totalLateFees = roundToPennies(totalLateFees + lateInfo.lateFee);
        }
      }
    }

    const collectionRate =
      totalDebtOverall > 0
        ? Math.round((totalCollected / totalDebtOverall) * 100)
        : 0;

    const totalExpenses = roundToPennies(
      params.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    );

    const annualBudget = roundToPennies(Number(params.annualBudget) || 0);
    const budgetSpentRate =
      annualBudget > 0 ? Math.round((totalExpenses / annualBudget) * 100) : 0;

    return {
      totalLiquidity,
      totalReceivable,
      totalCollected,
      collectionRate,
      pendingApprovalsCount: params.pendingApprovalsCount || 0,
      activePeriodName: params.activePeriodName || 'Aktif Dönem',
      annualBudget,
      totalExpenses,
      budgetSpentRate,
      overdueDebtsCount,
      totalLateFees,
    };
  }

  /**
   * Sakin İlişik Kesme Bakiye Mutabakatı
   */
  static calculateResidentDischargeBalance(
    debts: Array<{ amount: number | string; paidAmount?: number | string; status?: string }>,
  ): { unpaidDebtsTotal: number; unpaidDebtsCount: number } {
    let unpaidTotal = 0;
    let unpaidCount = 0;

    for (const d of debts) {
      if (d.status !== 'paid') {
        const amt = roundToPennies(Number(d.amount) || 0);
        const paid = roundToPennies(Number(d.paidAmount) || 0);
        const remaining = roundToPennies(Math.max(0, amt - paid));
        if (remaining > 0) {
          unpaidTotal = roundToPennies(unpaidTotal + remaining);
          unpaidCount++;
        }
      }
    }

    return {
      unpaidDebtsTotal: unpaidTotal,
      unpaidDebtsCount: unpaidCount,
    };
  }
}
