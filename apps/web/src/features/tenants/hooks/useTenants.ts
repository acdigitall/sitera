import { useState, useCallback, useEffect } from 'react';
import { Group, CreateGroupDto } from '@sitera/shared';
import { tenantsApi } from '../services/tenants.api';

export function useTenants() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await tenantsApi.getAll();
      if (Array.isArray(data)) {
        setGroups(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch groups:', err);
      setError(err.message || 'Tenant grupları alınamadı');
      if (retryCount < 2) {
        setTimeout(() => fetchGroups(retryCount + 1), 800);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroupId && groups.length > 0 && !groups.some((g) => g.id === selectedGroupId)) {
      setSelectedGroupId('');
    }
  }, [groups, selectedGroupId]);

  const createGroup = async (dto: CreateGroupDto) => {
    const newGroup = await tenantsApi.create(dto);
    setGroups((prev) => [newGroup, ...prev]);
    setSelectedGroupId(newGroup.id);
    return newGroup;
  };

  const selectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const activeGroup = groups.find((g) => g.id === selectedGroupId);

  return {
    groups,
    selectedGroupId,
    activeGroup,
    loading,
    error,
    selectGroup,
    createGroup,
    refetch: fetchGroups,
  };
}
