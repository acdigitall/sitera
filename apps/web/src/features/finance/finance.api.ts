import { apiClient } from '../../services/api-client';
import {
  Period,
  CreatePeriodDto,
  Debt,
  CreateDebtDto,
  Payment,
  CreatePaymentDto,
  FinanceAccount,
  CreateFinanceAccountDto,
  TransferFundsDto,
  AccountTransaction,
  PosRevenueSummary,
  Expense,
  FinanceSummary,
  FinanceSettings,
  UpdateFinanceSettingsDto,
  CashCollectionDto,
  DischargeResidentDto,
  FinancialReportPackage,
  CreateExpenseDto,
} from '@sitera/shared';

export const financeApi = {
  getSettings: (groupId?: string | null): Promise<FinanceSettings> => {
    return apiClient<FinanceSettings>('/finance/settings', { groupId });
  },

  updateSettings: (dto: UpdateFinanceSettingsDto, groupId?: string | null): Promise<FinanceSettings> => {
    return apiClient<FinanceSettings>('/finance/settings', {
      method: 'PATCH',
      body: JSON.stringify(dto),
      groupId,
    });
  },

  autoGenerateMonthlyDues: (force = false, groupId?: string | null): Promise<{ period: Period; createdDebtsCount: number }> => {
    return apiClient<{ period: Period; createdDebtsCount: number }>('/finance/auto-generate', {
      method: 'POST',
      body: JSON.stringify({ force }),
      groupId,
    });
  },

  getPeriods: (groupId?: string | null): Promise<Period[]> => {
    return apiClient<Period[]>('/finance/periods', { groupId });
  },

  createPeriod: (dto: CreatePeriodDto, groupId?: string | null): Promise<Period> => {
    return apiClient<Period>('/finance/periods', {
      method: 'POST',
      body: JSON.stringify(dto),
      groupId,
    });
  },

  deletePeriod: (id: string, groupId?: string | null): Promise<boolean> => {
    return apiClient<boolean>(`/finance/periods/${id}`, {
      method: 'DELETE',
      groupId,
    });
  },

  getDebts: (options: { userId?: string | null; unit?: string | null; groupId?: string | null } = {}): Promise<Debt[]> => {
    const params = new URLSearchParams();
    if (options.userId) params.append('userId', options.userId);
    if (options.unit) params.append('unit', options.unit);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Debt[]>(`/finance/debts${query}`, { groupId: options.groupId });
  },

  getDebtsPaginated: (options: {
    groupId?: string | null;
    page?: number;
    limit?: number;
    status?: 'all' | 'unpaid' | 'paid';
    category?: 'all' | 'dues' | 'fixture';
    periodId?: string;
    search?: string;
  } = {}): Promise<{ data: Debt[]; total: number; page: number; limit: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', String(options.page));
    if (options.limit) params.append('limit', String(options.limit));
    if (options.status && options.status !== 'all') params.append('status', options.status);
    if (options.category && options.category !== 'all') params.append('category', options.category);
    if (options.periodId && options.periodId !== 'all') params.append('periodId', options.periodId);
    if (options.search && options.search.trim()) params.append('search', options.search.trim());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<{ data: Debt[]; total: number; page: number; limit: number; totalPages: number }>(
      `/finance/debts/paginated${query}`,
      { groupId: options.groupId },
    );
  },

  createDebt: (dto: CreateDebtDto, groupId?: string | null): Promise<Debt> => {
    return apiClient<Debt>('/finance/debts', {
      method: 'POST',
      body: JSON.stringify(dto),
      groupId,
    });
  },

  recordCashCollection: (dto: CashCollectionDto, approvedBy?: string, groupId?: string | null): Promise<Payment> => {
    return apiClient<Payment>('/finance/cash-collection', {
      method: 'POST',
      body: JSON.stringify({ ...dto, approvedBy }),
      groupId,
    });
  },

  dischargeResident: (dto: DischargeResidentDto, groupId?: string | null): Promise<{ success: boolean; unpaidDebtsTotal: number; message: string }> => {
    return apiClient<{ success: boolean; unpaidDebtsTotal: number; message: string }>('/finance/discharge', {
      method: 'POST',
      body: JSON.stringify(dto),
      groupId,
    });
  },

  getPendingPayments: (groupId?: string | null): Promise<Payment[]> => {
    return apiClient<Payment[]>('/finance/payments/pending', { groupId });
  },

  approvePayment: (id: string, approvedBy?: string, groupId?: string | null): Promise<Payment> => {
    return apiClient<Payment>(`/finance/payments/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
      groupId,
    });
  },

  rejectPayment: (id: string, groupId?: string | null): Promise<Payment> => {
    return apiClient<Payment>(`/finance/payments/${id}/reject`, {
      method: 'POST',
      groupId,
    });
  },

  createPayment: (dto: CreatePaymentDto, userId?: string | null, groupId?: string | null): Promise<Payment> => {
    return apiClient<Payment>('/finance/payments', {
      method: 'POST',
      body: JSON.stringify({ ...dto, userId }),
      groupId,
    });
  },

  getAccounts: (groupId?: string | null): Promise<FinanceAccount[]> => {
    return apiClient<FinanceAccount[]>('/finance/accounts', { groupId });
  },

  getExpenses: (groupId?: string | null): Promise<Expense[]> => {
    return apiClient<Expense[]>('/finance/expenses', { groupId });
  },

  createExpense: (dto: CreateExpenseDto, groupId?: string | null): Promise<Expense> => {
    return apiClient<Expense>('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(dto),
      groupId,
    });
  },

  getSummary: (groupId?: string | null): Promise<FinanceSummary> => {
    return apiClient<FinanceSummary>('/finance/summary', { groupId });
  },

  getReports: (
    groupId?: string | null,
    periodId?: string,
    year?: number,
  ): Promise<FinancialReportPackage> => {
    const params = new URLSearchParams();
    if (periodId) params.set('periodId', periodId);
    if (year) params.set('year', year.toString());
    const query = params.toString();
    const endpoint = query ? `/finance/reports?${query}` : '/finance/reports';
    return apiClient<FinancialReportPackage>(endpoint, { groupId });
  },

  createAccount: (dto: CreateFinanceAccountDto, groupId?: string | null): Promise<FinanceAccount> => {
    return apiClient<FinanceAccount>('/finance/accounts', {
      method: 'POST',
      body: JSON.stringify(dto),
      groupId,
    });
  },

  transferFunds: (dto: TransferFundsDto, groupId?: string | null): Promise<{ success: boolean; fromBalance: number; toBalance: number }> => {
    return apiClient<{ success: boolean; fromBalance: number; toBalance: number }>('/finance/accounts/transfer', {
      method: 'POST',
      body: JSON.stringify(dto),
      groupId,
    });
  },

  getAccountTransactions: (accountId?: string | null, groupId?: string | null): Promise<AccountTransaction[]> => {
    const endpoint = accountId ? `/finance/accounts/${accountId}/transactions` : '/finance/transactions';
    return apiClient<AccountTransaction[]>(endpoint, { groupId });
  },

  getPosRevenue: (): Promise<PosRevenueSummary> => {
    return apiClient<PosRevenueSummary>('/finance/pos-revenue');
  },
};

/**
 * Opens a receipt (PDF data URI, image data URI, or regular URL) directly in a new browser tab.
 * Uses Blob Object URL for base64 data to ensure Google Chrome renders the native PDF engine without blank iframe blocks.
 */
export function openReceiptInNewTab(receiptUrl?: string | null) {
  if (!receiptUrl) {
    alert('Bu ödemeye ait yüklenmiş bir dekont belgesi bulunamadı.');
    return;
  }

  try {
    if (receiptUrl.startsWith('data:')) {
      const parts = receiptUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const b64Data = parts[1];
      const byteCharacters = atob(b64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, '_blank');
      if (!newWin) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return;
    }

    const newWin = window.open(receiptUrl, '_blank');
    if (!newWin) {
      const link = document.createElement('a');
      link.href = receiptUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Dekont açılırken hata:', err);
    window.open(receiptUrl, '_blank');
  }
}
