import { useState, useEffect, useCallback } from 'react';
import { IssueTicket, CreateTicketDto, UpdateTicketStatusDto } from '@sitera/shared';
import { ticketsApi } from './tickets.api';

export function triggerTicketsUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sitera_tickets_updated'));
  }
}

export function useTickets(params?: { groupId?: string; unit?: string; userId?: string; isStaff?: boolean }) {
  const [tickets, setTickets] = useState<IssueTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ticketsApi.getTickets(params);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Talepler yüklenirken hata:', err);
      setError(err.message || 'Talepler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [params?.groupId, params?.unit, params?.userId, params?.isStaff]);

  useEffect(() => {
    fetchTickets();

    const handleUpdate = () => {
      fetchTickets();
    };

    window.addEventListener('sitera_tickets_updated', handleUpdate);
    const interval = setInterval(fetchTickets, 8000);
    return () => {
      window.removeEventListener('sitera_tickets_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchTickets]);

  const createTicket = async (dto: CreateTicketDto) => {
    try {
      const created = await ticketsApi.createTicket(dto, params?.groupId);
      setTickets((prev) => [created, ...prev]);
      triggerTicketsUpdate();
      return created;
    } catch (err: any) {
      throw new Error(err.message || 'Talep oluşturulamadı.');
    }
  };

  const updateStatus = async (id: string, dto: UpdateTicketStatusDto) => {
    try {
      const updated = await ticketsApi.updateStatus(id, dto, params?.groupId);
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      triggerTicketsUpdate();
      return updated;
    } catch (err: any) {
      throw new Error(err.message || 'Talep güncellenemedi.');
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      await ticketsApi.deleteTicket(id, params?.groupId);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      triggerTicketsUpdate();
    } catch (err: any) {
      throw new Error(err.message || 'Talep silinemedi.');
    }
  };

  const openTicketsCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
    createTicket,
    updateStatus,
    deleteTicket,
    openTicketsCount,
    inProgressCount,
    resolvedCount,
  };
}
