export type PeriodStatus = 'draft' | 'active' | 'closed';

export type CalculationMode = 'per_unit' | 'equal_split' | 'share' | 'unit_type' | 'equal';
export type TargetRole = 'resident' | 'owner';

export interface Period {
  id: string;
  groupId: string;
  name: string; // e.g. "Ağustos 2026"
  amount: number;
  dueDate: string;
  status: PeriodStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePeriodDto {
  name: string;
  amount: number;
  totalAmount?: number;
  calculationMode?: CalculationMode;
  targetRole?: TargetRole;
  category?: DebtCategory;
  dueDate: string;
  status?: PeriodStatus;
  generateDebtsForUnits?: boolean;
}

export type DebtCategory = 'dues' | 'fixture' | 'penalty' | 'other';
export type DebtStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export interface Debt {
  id: string;
  groupId: string;
  userId?: string | null;
  periodId?: string | null;
  unit: string;
  residentName?: string | null;
  title: string;
  category: DebtCategory;
  targetRole?: TargetRole;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: DebtStatus;
  paidDate?: string | null;
  lateFee?: number;
  overdueDays?: number;
  totalWithLateFee?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtDto {
  userId?: string;
  periodId?: string;
  unit: string;
  residentName?: string;
  title: string;
  category?: DebtCategory;
  targetRole?: TargetRole;
  amount: number;
  dueDate: string;
}

export type PaymentChannel = 'bank_transfer' | 'credit_card' | 'cash';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  id: string;
  groupId: string;
  userId?: string | null;
  debtId?: string | null;
  unit: string;
  residentName?: string | null;
  amount: number;
  channel: PaymentChannel;
  referenceNo?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  status: PaymentStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  debtId?: string;
  unit: string;
  amount: number;
  channel: PaymentChannel;
  referenceNo?: string;
  receiptUrl?: string;
  notes?: string;
}

export type AccountType = 'bank' | 'cash' | 'reserve';

export interface FinanceAccount {
  id: string;
  groupId: string;
  name: string;
  bankName: string;
  iban?: string | null;
  balance: number;
  type: AccountType;
  isPrimary: boolean;
  lastActivity?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer_in' | 'transfer_out';

export interface AccountTransaction {
  id: string;
  groupId: string;
  accountId: string;
  accountName?: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  title: string;
  category?: string;
  counterparty?: string | null;
  referenceType?: 'payment' | 'expense' | 'transfer' | 'initial_balance';
  referenceId?: string | null;
  transactionDate: string;
  createdAt: string;
}

export interface CreateFinanceAccountDto {
  name: string;
  bankName: string;
  iban?: string;
  initialBalance?: number;
  type: AccountType;
  isPrimary?: boolean;
}

export interface TransferFundsDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export interface PlatformPosFee {
  id: string;
  paymentId: string;
  groupId: string;
  siteName?: string;
  unit: string;
  residentName?: string;
  grossAmount: number;
  netAmount: number;
  totalCommission: number;
  gatewayFee: number;
  siteraRevenue: number;
  status: 'completed' | 'refunded';
  createdAt: string;
}

export interface PosRevenueSummary {
  totalGrossVolume: number;
  totalSiteraRevenue: number;
  totalGatewayFees: number;
  totalNetToSites: number;
  totalTransactionsCount: number;
  recentTransactions: PlatformPosFee[];
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  vendor: string;
  category: string;
  amount: number;
  dueDate: string;
  dueDay: string;
  dueMonth: string;
  status: 'unpaid' | 'paid' | 'auto';
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSettings {
  id: string;
  groupId: string;
  defaultDuesAmount: number;
  duesDueDay: number;
  autoGenerateMonthlyDues: boolean;
  calculationMode: 'equal' | 'share' | 'unit_type';
  lateFeeEnabled: boolean;
  lateFeeRate: number; // KMK %5
  annualBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFinanceSettingsDto {
  defaultDuesAmount?: number;
  duesDueDay?: number;
  autoGenerateMonthlyDues?: boolean;
  calculationMode?: 'equal' | 'share' | 'unit_type';
  lateFeeEnabled?: boolean;
  lateFeeRate?: number;
  annualBudget?: number;
}

export interface CashCollectionDto {
  debtId?: string;
  unit: string;
  amount: number;
  residentName?: string;
  notes?: string;
}

export interface DischargeResidentDto {
  userId: string;
  unit: string;
  dischargeDate?: string;
  notes?: string;
}

export interface FinanceSummary {
  totalLiquidity: number;
  totalReceivable: number;
  totalCollected: number;
  collectionRate: number;
  pendingApprovalsCount: number;
  activePeriodName: string;
  annualBudget?: number;
  totalExpenses?: number;
  budgetSpentRate?: number;
  overdueDebtsCount?: number;
  totalLateFees?: number;
}

// --- YÖNETİM KURULU FİNANSAL RAPORLAMA TİPLERİ ---

export interface IncomeItem {
  category: string;
  title: string;
  accruedAmount: number; // Tahakkuk eden
  collectedAmount: number; // Fiilen tahsil edilen
  pendingAmount: number; // Kalan alacak
  collectionRate: number; // % Tahsilat oranı
}

export interface ExpenseReportItem {
  id: string;
  category: string;
  title: string;
  vendor: string;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid' | 'auto';
}

export interface IncomeExpenseStatement {
  periodName: string;
  totalAccruedIncome: number;
  totalCollectedIncome: number;
  totalExpense: number;
  netCashSurplus: number; // Net Nakit Fazlası / Kar (Tahsil Edilen Gelir - Gider)
  accrualSurplus: number; // Tahakkuk Fazlası (Tahakkuk Eden Gelir - Gider)
  budgetSpentRate: number;
  collectionRate: number;
  incomes: IncomeItem[];
  expenses: ExpenseReportItem[];
}

export interface TrialBalanceAccount {
  code: string; // Örn: "100.01", "102.01", "120.01", "320.01", "600.01", "770.01"
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debit: number; // Borç Toplamı
  credit: number; // Alacak Toplamı
  debitBalance: number; // Borç Bakiyesi
  creditBalance: number; // Alacak Bakiyesi
}

export interface TrialBalance {
  periodName: string;
  asOfDate: string;
  accounts: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
  totalDebitBalance: number;
  totalCreditBalance: number;
  isBalanced: boolean;
}

export interface BalanceSheetItem {
  title: string;
  code?: string;
  amount: number;
}

export interface BalanceSheet {
  periodName: string;
  asOfDate: string;
  currentAssets: BalanceSheetItem[]; // Dönen Varlıklar (Kasa, Banka, Alacaklar)
  totalCurrentAssets: number;
  totalAssets: number; // Aktif Toplamı

  shortTermLiabilities: BalanceSheetItem[]; // Kısa Vadeli Yabancı Kaynaklar (Tedarikçi Borçları vb.)
  totalShortTermLiabilities: number;

  equity: BalanceSheetItem[]; // Özkaynaklar & Fonlar (Demirbaş Fonu, Dönem Karı vb.)
  totalEquity: number;
  totalLiabilitiesAndEquity: number; // Pasif Toplamı
  isBalanced: boolean;
}

export interface FinancialReportPackage {
  siteName: string;
  periodName: string;
  asOfDate: string;
  generatedAt: string;
  kpis: {
    totalLiquidity: number;
    totalReceivable: number;
    totalCollected: number;
    totalExpenses: number;
    netSurplus: number;
    collectionRate: number;
    budgetSpentRate: number;
    annualBudget: number;
  };
  incomeExpense: IncomeExpenseStatement;
  trialBalance: TrialBalance;
  balanceSheet: BalanceSheet;
}
