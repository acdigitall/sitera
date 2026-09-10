import { useState, useCallback, useEffect } from 'react';
import { User, CreateUserDto } from '@sitera/shared';
import { usersApi } from '../services/users.api';

export function useUsers(activeGroupId?: string | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAll(activeGroupId || undefined);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Kullanıcı listesi alınamadı');
    } finally {
      setLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (dto: CreateUserDto) => {
    const newUser = await usersApi.create(dto, activeGroupId || undefined);
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const createBulkUsers = async (dtos: CreateUserDto[]) => {
    const newUsers = await usersApi.createBulk(dtos, activeGroupId || undefined);
    setUsers((prev) => [...newUsers, ...prev]);
    return newUsers;
  };

  const updateUser = async (id: string, dto: any) => {
    const updated = await usersApi.update(id, dto, activeGroupId || undefined);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    return updated;
  };

  const deleteUser = async (id: string) => {
    await usersApi.delete(id, activeGroupId || undefined);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    createBulkUsers,
    updateUser,
    deleteUser,
  };
}
