import { Group } from '@sitera/shared';

export interface MessageLog {
  id: string;
  channel: 'SMS' | 'WhatsApp';
  recipientCount: number;
  title: string;
  sentAt: string;
  status: 'delivered' | 'failed';
}

export interface SiteCommunicationQuota {
  groupId: string;
  groupName: string;
  groupSlug: string;
  totalUnits: number;

  // SMS
  smsProvider: 'Netgsm' | 'İletiMerkezi' | 'Mutlucell';
  smsHeader: string;
  smsTotalQuota: number;
  smsUsed: number;
  smsRemaining: number;
  smsUsagePercent: number;
  smsStatus: 'healthy' | 'warning' | 'critical';

  // WhatsApp
  whatsappProvider: 'Meta Cloud API' | 'Netgsm WABA' | 'Twilio';
  whatsappSenderPhone: string;
  whatsappTotalQuota: number;
  whatsappUsed: number;
  whatsappRemaining: number;
  whatsappUsagePercent: number;
  whatsappStatus: 'healthy' | 'warning' | 'critical';

  // Meta & Paket Bilgisi
  packageTier: string;
  monthlyCost: number;
  renewalDate: string;
  isMock: true;
  mockDisclaimer: string;

  // Son Gönderimler
  recentMessages: MessageLog[];
}

export const MOCK_DISCLAIMER_TEXT =
  'Bu veriler demo/simülasyon amaçlı dummy verilerdir. Gerçek SMS ve WhatsApp servis sağlayıcı API entegrasyonları henüz sisteme bağlanmamıştır.';

export function getSiteCommunicationQuota(group: Group): SiteCommunicationQuota {
  const units = group.totalUnits || 24;
  const slug = group.slug || group.name.toLowerCase();

  // Sabit veya deterministik veriler
  if (slug.includes('palmiye')) {
    return {
      groupId: group.id,
      groupName: group.name,
      groupSlug: group.slug,
      totalUnits: units,
      smsProvider: 'Netgsm',
      smsHeader: 'PALMIYE',
      smsTotalQuota: 5000,
      smsUsed: 1840,
      smsRemaining: 3160,
      smsUsagePercent: 37,
      smsStatus: 'healthy',
      whatsappProvider: 'Meta Cloud API',
      whatsappSenderPhone: '+90 850 885 12 34',
      whatsappTotalQuota: 1000,
      whatsappUsed: 410,
      whatsappRemaining: 590,
      whatsappUsagePercent: 41,
      whatsappStatus: 'healthy',
      packageTier: 'Site Standart İletişim Paketi',
      monthlyCost: 350,
      renewalDate: '2026-10-15',
      isMock: true,
      mockDisclaimer: MOCK_DISCLAIMER_TEXT,
      recentMessages: [
        {
          id: 'msg-1',
          channel: 'WhatsApp',
          recipientCount: units,
          title: 'Eylül Ayı Aidat Bildirimi & Dekont Linki',
          sentAt: '2026-09-01 10:15',
          status: 'delivered',
        },
        {
          id: 'msg-2',
          channel: 'SMS',
          recipientCount: units,
          title: 'Asansör Periyodik Bakım Bilgilendirmesi',
          sentAt: '2026-08-28 14:30',
          status: 'delivered',
        },
        {
          id: 'msg-3',
          channel: 'SMS',
          recipientCount: 18,
          title: 'Site Bahçe İlaçlama Duyurusu',
          sentAt: '2026-08-15 09:00',
          status: 'delivered',
        },
      ],
    };
  }

  if (slug.includes('zumrut')) {
    return {
      groupId: group.id,
      groupName: group.name,
      groupSlug: group.slug,
      totalUnits: units,
      smsProvider: 'İletiMerkezi',
      smsHeader: 'ZUMRUT-ST',
      smsTotalQuota: 5000,
      smsUsed: 4650,
      smsRemaining: 350,
      smsUsagePercent: 93,
      smsStatus: 'critical',
      whatsappProvider: 'Meta Cloud API',
      whatsappSenderPhone: '+90 532 999 44 11',
      whatsappTotalQuota: 1000,
      whatsappUsed: 920,
      whatsappRemaining: 80,
      whatsappUsagePercent: 92,
      whatsappStatus: 'critical',
      packageTier: 'Büyük Site İletişim Paketi',
      monthlyCost: 550,
      renewalDate: '2026-09-18',
      isMock: true,
      mockDisclaimer: MOCK_DISCLAIMER_TEXT,
      recentMessages: [
        {
          id: 'msg-1',
          channel: 'SMS',
          recipientCount: 22,
          title: 'Gecikmiş Aidat İkinci Hatırlatması',
          sentAt: '2026-09-07 11:20',
          status: 'delivered',
        },
        {
          id: 'msg-2',
          channel: 'WhatsApp',
          recipientCount: units,
          title: 'Olağanüstü Genel Kurul Toplantı Çağrısı',
          sentAt: '2026-09-04 16:45',
          status: 'delivered',
        },
      ],
    };
  }

  if (slug.includes('atli') || slug.includes('kapı') || slug.includes('kapi')) {
    return {
      groupId: group.id,
      groupName: group.name,
      groupSlug: group.slug,
      totalUnits: units,
      smsProvider: 'Mutlucell',
      smsHeader: 'ATLIKAPI',
      smsTotalQuota: 3000,
      smsUsed: 1200,
      smsRemaining: 1800,
      smsUsagePercent: 40,
      smsStatus: 'healthy',
      whatsappProvider: 'Twilio',
      whatsappSenderPhone: '+90 850 440 22 10',
      whatsappTotalQuota: 500,
      whatsappUsed: 180,
      whatsappRemaining: 320,
      whatsappUsagePercent: 36,
      whatsappStatus: 'healthy',
      packageTier: 'Orta Ölçekli Site Paketi',
      monthlyCost: 280,
      renewalDate: '2026-11-02',
      isMock: true,
      mockDisclaimer: MOCK_DISCLAIMER_TEXT,
      recentMessages: [
        {
          id: 'msg-1',
          channel: 'WhatsApp',
          recipientCount: units,
          title: 'Site Kapalı Otopark Giriş Kartları Dağıtımı',
          sentAt: '2026-09-05 13:00',
          status: 'delivered',
        },
      ],
    };
  }

  if (slug.includes('gencosman')) {
    return {
      groupId: group.id,
      groupName: group.name,
      groupSlug: group.slug,
      totalUnits: units,
      smsProvider: 'Netgsm',
      smsHeader: 'GENCOSMAN',
      smsTotalQuota: 2500,
      smsUsed: 2150,
      smsRemaining: 350,
      smsUsagePercent: 86,
      smsStatus: 'warning',
      whatsappProvider: 'Meta Cloud API',
      whatsappSenderPhone: '+90 530 111 22 33',
      whatsappTotalQuota: 500,
      whatsappUsed: 390,
      whatsappRemaining: 110,
      whatsappUsagePercent: 78,
      whatsappStatus: 'warning',
      packageTier: 'Apartman Eko İletişim Paketi',
      monthlyCost: 220,
      renewalDate: '2026-09-29',
      isMock: true,
      mockDisclaimer: MOCK_DISCLAIMER_TEXT,
      recentMessages: [
        {
          id: 'msg-1',
          channel: 'SMS',
          recipientCount: units,
          title: 'Acil Su Kesintisi & Hidrofor Arızası Bildirimi',
          sentAt: '2026-09-08 08:30',
          status: 'delivered',
        },
        {
          id: 'msg-2',
          channel: 'WhatsApp',
          recipientCount: units,
          title: 'Aylık Aidat ve Demirbaş Hesap Ekstresi',
          sentAt: '2026-09-01 09:15',
          status: 'delivered',
        },
      ],
    };
  }

  // Sitera Teknoloji ve genel fallback
  const isSitera = slug.includes('sitera');
  const smsTotal = isSitera ? 10000 : 3000;
  const smsUsed = isSitera ? 4200 : Math.round(units * 45);
  const smsRemaining = Math.max(0, smsTotal - smsUsed);
  const wpTotal = isSitera ? 2500 : 800;
  const wpUsed = isSitera ? 1100 : Math.round(units * 15);
  const wpRemaining = Math.max(0, wpTotal - wpUsed);

  const smsPct = Math.round((smsUsed / smsTotal) * 100);
  const wpPct = Math.round((wpUsed / wpTotal) * 100);

  return {
    groupId: group.id,
    groupName: group.name,
    groupSlug: group.slug,
    totalUnits: units,
    smsProvider: 'Netgsm',
    smsHeader: isSitera ? 'SITERA' : group.name.slice(0, 10).toUpperCase().replace(/[^A-Z]/g, ''),
    smsTotalQuota: smsTotal,
    smsUsed,
    smsRemaining,
    smsUsagePercent: smsPct,
    smsStatus: smsPct > 90 ? 'critical' : smsPct > 75 ? 'warning' : 'healthy',
    whatsappProvider: 'Meta Cloud API',
    whatsappSenderPhone: '+90 850 302 44 00',
    whatsappTotalQuota: wpTotal,
    whatsappUsed: wpUsed,
    whatsappRemaining: wpRemaining,
    whatsappUsagePercent: wpPct,
    whatsappStatus: wpPct > 90 ? 'critical' : wpPct > 75 ? 'warning' : 'healthy',
    packageTier: isSitera ? 'Platform Master Kurumsal Paket' : 'Apartman Standart Paket',
    monthlyCost: isSitera ? 850 : 250,
    renewalDate: '2026-10-30',
    isMock: true,
    mockDisclaimer: MOCK_DISCLAIMER_TEXT,
    recentMessages: [
      {
        id: 'msg-1',
        channel: 'SMS',
        recipientCount: units,
        title: 'Platform Bilgilendirme ve Güvenlik Bildirimi',
        sentAt: '2026-09-06 17:00',
        status: 'delivered',
      },
    ],
  };
}

export function getCommunicationSummary(quotas: SiteCommunicationQuota[]) {
  const totalSites = quotas.length;
  const totalSmsQuota = quotas.reduce((sum, q) => sum + q.smsTotalQuota, 0);
  const totalSmsUsed = quotas.reduce((sum, q) => sum + q.smsUsed, 0);
  const totalSmsRemaining = quotas.reduce((sum, q) => sum + q.smsRemaining, 0);

  const totalWpQuota = quotas.reduce((sum, q) => sum + q.whatsappTotalQuota, 0);
  const totalWpUsed = quotas.reduce((sum, q) => sum + q.whatsappUsed, 0);
  const totalWpRemaining = quotas.reduce((sum, q) => sum + q.whatsappRemaining, 0);

  const criticalSitesCount = quotas.filter(
    (q) => q.smsStatus === 'critical' || q.whatsappStatus === 'critical'
  ).length;

  const warningSitesCount = quotas.filter(
    (q) =>
      (q.smsStatus === 'warning' || q.whatsappStatus === 'warning') &&
      q.smsStatus !== 'critical' &&
      q.whatsappStatus !== 'critical'
  ).length;

  return {
    totalSites,
    totalSmsQuota,
    totalSmsUsed,
    totalSmsRemaining,
    smsOverallPercent: Math.round((totalSmsUsed / Math.max(1, totalSmsQuota)) * 100),
    totalWpQuota,
    totalWpUsed,
    totalWpRemaining,
    wpOverallPercent: Math.round((totalWpUsed / Math.max(1, totalWpQuota)) * 100),
    criticalSitesCount,
    warningSitesCount,
  };
}
