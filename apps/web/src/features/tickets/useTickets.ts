import { useState, useEffect, useCallback } from 'react';
import { IssueTicket, CreateTicketDto, UpdateTicketStatusDto } from '@sitera/shared';
import { ticketsApi } from './tickets.api';

export function triggerTicketsUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sitera_tickets_updated'));
  }
}

export function useTickets(params?: {
  groupId?: string | null;
  unit?: string | null;
  userId?: string | null;
  isStaff?: boolean;
  autoPollIntervalMs?: number;
}) {
  const [tickets, setTickets] = useState<IssueTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        setError(null);
        const data = await ticketsApi.getTickets(params);
        const nextTickets = Array.isArray(data) ? data : [];
        setTickets((prev) => {
          if (
            prev.length === nextTickets.length &&
            prev.every(
              (p, idx) =>
                p.id === nextTickets[idx]?.id &&
                p.status === nextTickets[idx]?.status &&
                p.updatedAt === nextTickets[idx]?.updatedAt &&
                p.adminNotes === nextTickets[idx]?.adminNotes &&
                p.urgency === nextTickets[idx]?.urgency
            )
          ) {
            return prev;
          }
          return nextTickets;
        });
      } catch (err: any) {
        console.error('Talepler yüklenirken hata:', err);
        setError(err.message || 'Talepler yüklenemedi.');
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [params?.groupId, params?.unit, params?.userId, params?.isStaff],
  );

  useEffect(() => {
    // İlk yükleme görünür loading ile
    fetchTickets(false);

    // Başka bir bileşen talep güncellediğinde sessizce senkronize ol
    const handleUpdate = () => {
      fetchTickets(true);
    };

    window.addEventListener('sitera_tickets_updated', handleUpdate);

    // Arka plan sessiz polling: 8 saniyelik agresif render yerine 30 saniyelik sessiz kontrol
    const pollInterval = params?.autoPollIntervalMs !== undefined ? params.autoPollIntervalMs : 30000;
    let interval: NodeJS.Timeout | null = null;
    if (pollInterval > 0) {
      interval = setInterval(() => {
        fetchTickets(true);
      }, pollInterval);
    }

    return () => {
      window.removeEventListener('sitera_tickets_updated', handleUpdate);
      if (interval) clearInterval(interval);
    };
  }, [fetchTickets, params?.autoPollIntervalMs]);

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
