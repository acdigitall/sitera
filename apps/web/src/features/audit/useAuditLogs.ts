import { useState, useEffect, useCallback } from 'react';
import { AuditLog } from '@sitera/shared';
import { auditApi } from './audit.api';

export function useAuditLogs(params?: { groupId?: string; category?: string; search?: string; limit?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditApi.getLogs(params);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Audit logları yüklenirken hata:', err);
      setError(err.message || 'Audit logları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [params?.groupId, params?.category, params?.search, params?.limit]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 6000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  };
}
