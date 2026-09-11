import { useState, useEffect, useCallback } from 'react';
import { AuditLog } from '@sitera/shared';
import { auditApi } from './audit.api';

export function useAuditLogs(params?: { groupId?: string | null; category?: string; search?: string; limit?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        setError(null);
        const data = await auditApi.getLogs(params);
        const nextLogs = Array.isArray(data) ? data : [];
        setLogs((prev) => {
          if (
            prev.length === nextLogs.length &&
            prev.every((p, idx) => p.id === nextLogs[idx]?.id)
          ) {
            return prev;
          }
          return nextLogs;
        });
      } catch (err: any) {
        console.error('Audit logları yüklenirken hata:', err);
        setError(err.message || 'Audit logları yüklenemedi.');
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [params?.groupId, params?.category, params?.search, params?.limit],
  );

  useEffect(() => {
    fetchLogs(false);
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  };
}
