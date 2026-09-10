import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TicketsService } from '../tickets.service';
import { TicketEntity } from '../ticket.entity';
import { GroupEntity } from '../../groups/group.entity';
import { UserEntity } from '../../users/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('File Security & Image Validation in Backend API', () => {
  let ticketsService: TicketsService;
  let ticketsRepo: any;
  let groupsRepo: any;
  let usersRepo: any;
  let dataSource: any;
  let auditLogsService: any;
  let notificationsService: any;

  const mockGroupId = 'test-group-id-1';

  beforeEach(() => {
    const createMockRepo = () => ({
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((dto) => ({
        id: 'ticket-1',
        ...dto,
      })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      createQueryBuilder: vi.fn(),
    });

    ticketsRepo = createMockRepo();
    groupsRepo = createMockRepo();
    usersRepo = createMockRepo();

    auditLogsService = {
      recordLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
    };

    notificationsService = {
      createNotification: vi.fn().mockResolvedValue({ id: 'n-1' }),
    };

    const repoMap = new Map<any, any>([
      [TicketEntity, ticketsRepo],
      [GroupEntity, groupsRepo],
      [UserEntity, usersRepo],
    ]);

    const mockQueryRunner = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      release: vi.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: vi.fn((entity) => repoMap.get(entity) || createMockRepo()),
      },
    };

    dataSource = {
      createQueryRunner: vi.fn().mockReturnValue(mockQueryRunner),
    };

    ticketsService = new TicketsService(
      ticketsRepo,
      groupsRepo,
      usersRepo,
      dataSource,
      auditLogsService,
      notificationsService,
    );
  });

  it('1. Geçerli PNG fotoğrafı içeren talebi onaylamalıdır', async () => {
    const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString(
      'base64',
    );
    const validPngUri = `data:image/png;base64,${pngBase64}`;

    const res = await ticketsService.createTicket(
      {
        unit: 'Daire 3',
        residentName: 'Ahmet Yılmaz',
        title: 'Boru Patlağı',
        description: 'Mutfak borusu sızdırıyor.',
        category: 'Sıhhi Tesisat',
        photos: [validPngUri],
      },
      { id: 'user-1', groupId: mockGroupId },
      mockGroupId,
    );

    expect(res).toBeDefined();
    expect(res.photos.length).toBe(1);
    expect(ticketsRepo.save).toHaveBeenCalled();
  });

  it('2. Sahte veya zararlı script içeren fotoğrafı (XSS / Polyglot) reddetmelidir', async () => {
    // Malicious payload pretending to be a JPG with <script> tag
    const maliciousBytes = new TextEncoder().encode('\xFF\xD8\xFF\xE0<script>alert(1)</script>');
    const maliciousBase64 = Buffer.from(maliciousBytes).toString('base64');
    const maliciousDataUri = `data:image/jpeg;base64,${maliciousBase64}`;

    await expect(
      ticketsService.createTicket(
        {
          unit: 'Daire 3',
          residentName: 'Ahmet Yılmaz',
          title: 'Güvenlik Testi',
          description: 'Zararlı içerik testi',
          category: 'Diğer',
          photos: [maliciousDataUri],
        },
        { id: 'user-1', groupId: mockGroupId },
        mockGroupId,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('3. İzin verilmeyen dosya türü yüklendiğinde (örn. fotoğrafa PDF yükleme) reddetmelidir', async () => {
    const pdfBase64 = Buffer.from('%PDF-1.4 mock pdf').toString('base64');
    const pdfDataUri = `data:application/pdf;base64,${pdfBase64}`;

    await expect(
      ticketsService.createTicket(
        {
          unit: 'Daire 3',
          residentName: 'Ahmet Yılmaz',
          title: 'Yanlış Dosya Türü',
          description: 'Fotoğraf yerine PDF yüklendi',
          category: 'Diğer',
          photos: [pdfDataUri],
        },
        { id: 'user-1', groupId: mockGroupId },
        mockGroupId,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('4. Talep başına 5 fotoğraf sınırını aştığında BadRequestException fırlatmalıdır', async () => {
    const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString(
      'base64',
    );
    const validPngUri = `data:image/png;base64,${pngBase64}`;

    // 6 photos (exceeds max 5)
    const sixPhotos = Array(6).fill(validPngUri);

    await expect(
      ticketsService.createTicket(
        {
          unit: 'Daire 3',
          residentName: 'Ahmet Yılmaz',
          title: 'Aşırı Fotoğraf',
          description: '6 adet fotoğraf yükleme denemesi',
          category: 'Diğer',
          photos: sixPhotos,
        },
        { id: 'user-1', groupId: mockGroupId },
        mockGroupId,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
