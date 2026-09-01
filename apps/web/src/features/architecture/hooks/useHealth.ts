import { useState, useCallback, useEffect } from 'react';
import { healthApi, ExtendedHealthStatus } from '../services/health.api';

export function useHealth() {
  const [health, setHealth] = useState<ExtendedHealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await healthApi.check();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'API sağlık durumu kontrol edilemedi');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    health,
    loading,
    error,
    refetch: checkHealth,
  };
}
