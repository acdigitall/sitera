import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupportService } from '../support.service';

describe('SupportService (Müşteri & Teknik Destek Testleri)', () => {
  let service: SupportService;
  let ticketRepo: any;
  let groupRepo: any;
  let auditLogsService: any;

  const mockTicket: any = {
    id: 'TKT-1050',
    groupId: 'grp-1',
    groupName: 'Gencosman Apartmanı',
    groupSlug: 'gencosman',
    subject: 'Gecikme Zammı Parametresi',
    status: 'open',
    priority: 'high',
    allowSiteAccess: true,
    messages: [],
  };

  beforeEach(() => {
    ticketRepo = {
      find: vi.fn().mockResolvedValue([mockTicket]),
      findOne: vi.fn().mockResolvedValue({ ...mockTicket }),
      create: vi.fn((dto) => ({ id: `TKT-${Date.now()}`, ...dto })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      count: vi.fn().mockResolvedValue(3),
    };

    groupRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 'grp-1', name: 'Gencosman Apartmanı', slug: 'gencosman' }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };

    auditLogsService = {
      log: vi.fn().mockResolvedValue({ id: 'log-1' }),
      recordLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
    };

    service = new SupportService(ticketRepo, groupRepo, auditLogsService);
  });

  describe('createTicket (Yeni Destek Talebi Açma)', () => {
    it('Site yöneticisi yeni bir destek talebi açtığında açık (open) durumunda kaydetmelidir', async () => {
      ticketRepo.create.mockImplementation((dto: any) => dto);
      ticketRepo.save.mockImplementation((entity: any) => Promise.resolve({ id: 'TKT-999', ...entity }));

      const ticket = await service.createTicket({
        groupId: 'grp-1',
        creatorUserId: 'usr-admin-1',
        creatorName: 'Ahmet Yönetici',
        creatorEmail: 'admin@gencosman.com',
        subject: 'Aidat Dağıtım Hatası',
        category: 'finance_error',
        priority: 'high',
        initialMessage: 'Daire 3 için faiz yanlış hesaplandı.',
        allowSiteAccess: true,
      });

      expect(ticket).toBeDefined();
      expect(ticket.subject).toBe('Aidat Dağıtım Hatası');
      expect(ticket.status).toBe('open');
      expect(ticket.messages.length).toBe(1);
      expect(auditLogsService.log).toHaveBeenCalled();
    });
  });

  describe('addMessage (Bilete Mesaj Ekleme)', () => {
    it('Mevcut bir bilete destek veya yönetici mesajı ekleyebilmeli ve son etkileşim zamanını güncellemelidir', async () => {
      const ticket = await service.addMessage(
        'TKT-1050',
        {
          content: 'Sorunu çözdük, parametreler güncellendi.',
          senderRole: 'superadmin',
          senderName: 'Süper Yönetici',
          senderUserId: 'usr-super-1',
        },
      );

      expect(ticket.messages.length).toBe(1);
      expect(ticket.messages[0].content).toBe('Sorunu çözdük, parametreler güncellendi.');
      expect(ticket.lastInteractedAt).toBeDefined();
    });
  });

  describe('updateStatus (Bilet Durumunu Güncelleme)', () => {
    it('Bilet çözüldüğünde (resolved) durumunu güncellemeli ve site erişimini kapatmalıdır', async () => {
      const ticket = await service.updateStatus('TKT-1050', 'resolved', 'Süper Admin');

      expect(ticket.status).toBe('resolved');
      expect(ticket.resolvedAt).toBeDefined();
      expect(groupRepo.update).toHaveBeenCalledWith('grp-1', {
        supportAccessActive: false,
        activeSupportTicketId: null,
      });
    });
  });
});
