import { useState, useEffect, useCallback } from 'react';
import {
  Period,
  Debt,
  Payment,
  FinanceAccount,
  Expense,
  FinanceSummary,
  FinanceSettings,
  UpdateFinanceSettingsDto,
  CreatePeriodDto,
  CreatePaymentDto,
  CashCollectionDto,
  DischargeResidentDto,
} from '@sitera/shared';
import { financeApi } from './finance.api';

export const FINANCE_UPDATED_EVENT = 'sitera:finance-updated';

export const triggerFinanceUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FINANCE_UPDATED_EVENT));
  }
};

export function useFinance(groupId?: string, userId?: string, unit?: string) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, d, pay, acc, exp, sum, set] = await Promise.all([
        financeApi.getPeriods(groupId).catch(() => []),
        financeApi.getDebts({ groupId, userId, unit }).catch(() => []),
        financeApi.getPendingPayments(groupId).catch(() => []),
        financeApi.getAccounts(groupId).catch(() => []),
        financeApi.getExpenses(groupId).catch(() => []),
        financeApi.getSummary(groupId).catch(() => null),
        financeApi.getSettings(groupId).catch(() => null),
      ]);

      setPeriods(p);
      setDebts(d);
      setPendingPayments(pay);
      setAccounts(acc);
      setExpenses(exp);
      setSummary(sum);
      setSettings(set);
    } catch (err: any) {
      setError(err.message || 'Finans verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [groupId, userId, unit]);

  useEffect(() => {
    fetchAll();

    const handleGlobalUpdate = () => {
      fetchAll();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(FINANCE_UPDATED_EVENT, handleGlobalUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(FINANCE_UPDATED_EVENT, handleGlobalUpdate);
      }
    };
  }, [fetchAll]);

  const updateSettings = async (dto: UpdateFinanceSettingsDto) => {
    const updated = await financeApi.updateSettings(dto, groupId);
    setSettings(updated);
    await fetchAll();
    triggerFinanceUpdate();
    return updated;
  };

  const autoGenerateMonthlyDues = async (force = false) => {
    const result = await financeApi.autoGenerateMonthlyDues(force, groupId);
    await fetchAll();
    triggerFinanceUpdate();
    return result;
  };

  const recordCashCollection = async (dto: CashCollectionDto, approvedBy?: string) => {
    const result = await financeApi.recordCashCollection(dto, approvedBy, groupId);
    await fetchAll();
    triggerFinanceUpdate();
    return result;
  };

  const dischargeResident = async (dto: DischargeResidentDto) => {
    const result = await financeApi.dischargeResident(dto, groupId);
    await fetchAll();
    triggerFinanceUpdate();
    return result;
  };

  const approvePayment = async (id: string, approvedBy?: string) => {
    await financeApi.approvePayment(id, approvedBy, groupId);
    await fetchAll();
    triggerFinanceUpdate();
  };

  const rejectPayment = async (id: string) => {
    await financeApi.rejectPayment(id, groupId);
    await fetchAll();
    triggerFinanceUpdate();
  };

  const createPeriod = async (dto: CreatePeriodDto) => {
    const created = await financeApi.createPeriod(dto, groupId);
    await fetchAll();
    triggerFinanceUpdate();
    return created;
  };

  const deletePeriod = async (id: string) => {
    const success = await financeApi.deletePeriod(id, groupId);
    await fetchAll();
    triggerFinanceUpdate();
    return success;
  };

  const submitPayment = async (dto: CreatePaymentDto) => {
    const created = await financeApi.createPayment(dto, userId, groupId);
    await fetchAll();
    triggerFinanceUpdate();
    return created;
  };

  return {
    periods,
    debts,
    pendingPayments,
    accounts,
    expenses,
    summary,
    settings,
    loading,
    error,
    refetch: fetchAll,
    triggerFinanceUpdate,
    updateSettings,
    autoGenerateMonthlyDues,
    recordCashCollection,
    dischargeResident,
    approvePayment,
    rejectPayment,
    createPeriod,
    deletePeriod,
    submitPayment,
  };
}
