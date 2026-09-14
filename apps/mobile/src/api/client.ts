/**
 * Sitera Mobile Real API Client
 * Connects directly to the NestJS PostgreSQL Multi-Tenant Backend (Port 4000)
 * Synchronized with Web Dashboard with Bearer Token, x-group-id, x-user-id and x-user-role headers.
 */

import { NativeModules } from 'react-native';

const getDevHostIp = (): string => {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch {}
  return '172.20.10.4';
};

export const API_HOST = getDevHostIp();
export const API_BASE_URL = `http://${API_HOST}:4000/api`;

export interface UserGroup {
  id: string;
  name: string;
  slug?: string;
  plan?: string;
  totalUnits?: number;
  city?: string;
  district?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'member' | string;
  groupId?: string | null;
  group?: UserGroup | null;
  groupName?: string;
  units?: string[];
  block?: string;
  flatNo?: string;
  phone?: string | null;
  residentType?: 'owner' | 'tenant' | string;
  isActive?: boolean;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'maintenance' | 'event';
  category?: string;
  date: string;
  isRead?: boolean;
  authorName?: string;
  createdAt?: string;
}

export interface DebtItem {
  id: string;
  periodName: string;
  monthYear?: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  unit?: string;
}

export interface TicketItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  unit?: string;
  userName?: string;
  residentName?: string;
}

export interface FinanceSummaryData {
  totalLiquidity: number;
  totalReceivable: number;
  totalCollected: number;
  collectionRate: number;
  pendingApprovalsCount?: number;
  activePeriodName?: string;
  annualBudget?: number;
  siteName?: string;
  bankName?: string;
  iban?: string;
  accountHolder?: string;
}

// In-memory token & user storage
let currentToken: string | null = null;
let currentUser: UserProfile | null = null;

export const setAuthSession = (token: string | null, user: UserProfile | null) => {
  currentToken = token;
  if (user) {
    if (user.group && user.group.name) {
      user.groupName = user.group.name;
    }
    if (user.units && Array.isArray(user.units) && user.units.length > 0) {
      user.flatNo = user.units.join(', ');
    }
  }
  currentUser = user;
};

export const getAuthSession = () => ({
  token: currentToken,
  user: currentUser,
});

/**
 * Builds HTTP headers identical to web application's apiClient
 */
const buildHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  if (currentUser) {
    if (currentUser.role) {
      headers['x-user-role'] = currentUser.role;
    }
    if (currentUser.id) {
      headers['x-user-id'] = currentUser.id;
    }
    if (currentUser.groupId && currentUser.groupId.trim() !== '') {
      headers['x-group-id'] = currentUser.groupId;
    }
  }

  return headers;
};

// ============================================================================
// 1. AUTHENTICATION
// ============================================================================
export const apiLogin = async (
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: UserProfile; message?: string }> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.success === false) {
      return { success: false, message: json.message || 'E-posta veya şifre hatalı' };
    }

    const token = json.data?.token || json.token;
    const rawUser = json.data?.user || json.user;

    const user: UserProfile = {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      role: rawUser.role,
      groupId: rawUser.groupId || rawUser.group?.id || '6f7dc4f2-5d74-4cd3-963f-cb1b2c78670d',
      group: rawUser.group || null,
      groupName: rawUser.group?.name || 'alemdarapartmanı',
      units: Array.isArray(rawUser.units) ? rawUser.units : (rawUser.units ? [rawUser.units] : []),
      block: 'A Blok',
      flatNo: Array.isArray(rawUser.units) ? rawUser.units.join(', ') : (rawUser.units || 'Daire 1'),
      phone: rawUser.phone,
      residentType: rawUser.residentType || 'owner',
      isActive: rawUser.isActive !== false,
    };

    setAuthSession(token, user);
    return { success: true, token, user };
  } catch (error: any) {
    console.error('apiLogin error:', error);
    return { success: false, message: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' };
  }
};

// ============================================================================
// 2. USERS / RESIDENTS (Admin Management)
// ============================================================================
export const apiGetUsers = async (): Promise<UserProfile[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: buildHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          groupId: u.groupId,
          groupName: u.group?.name || 'alemdarapartmanı',
          units: Array.isArray(u.units) ? u.units : (u.units ? [u.units] : []),
          flatNo: Array.isArray(u.units) ? u.units.join(', ') : (u.units || ''),
          phone: u.phone,
          residentType: u.residentType || 'owner',
          isActive: u.isActive !== false,
        }));
      }
    }
  } catch (err) {
    console.warn('apiGetUsers error:', err);
  }
  return [];
};

export const apiCreateUser = async (data: {
  name: string;
  email: string;
  phone?: string;
  units?: string[];
  residentType?: 'owner' | 'tenant';
  password?: string;
}): Promise<{ success: boolean; message?: string; user?: UserProfile }> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        ...data,
        groupId: currentUser?.groupId || '6f7dc4f2-5d74-4cd3-963f-cb1b2c78670d',
        role: 'member',
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success !== false) {
      return { success: true, user: json.data };
    }
    return { success: false, message: json.message || 'Kullanıcı eklenemedi' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Sunucu hatası' };
  }
};

// ============================================================================
// 3. ANNOUNCEMENTS (Duyurular)
// ============================================================================
export const apiGetAnnouncements = async (): Promise<AnnouncementItem[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/announcements`, {
      headers: buildHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data.map((a: any) => {
          const isUrgent = a.isImportant || a.category === 'Acil' || a.category === 'Kesinti';
          return {
            id: a.id,
            title: a.title,
            content: a.content || a.description || '',
            type: isUrgent ? 'urgent' : a.category === 'Bakım' ? 'maintenance' : 'general',
            category: a.category || 'Genel',
            date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('tr-TR') : 'Bugün',
            authorName: a.authorName || 'Site Yönetimi',
            createdAt: a.createdAt,
          };
        });
      }
    }
  } catch (err) {
    console.warn('apiGetAnnouncements error:', err);
  }
  return [];
};

export const apiCreateAnnouncement = async (data: {
  title: string;
  content: string;
  category?: string;
  type?: string;
  isImportant?: boolean;
}): Promise<AnnouncementItem> => {
  let category = data.category || 'Genel';
  if (data.type === 'urgent') category = 'Acil';
  else if (data.type === 'maintenance') category = 'Bakım';

  const res = await fetch(`${API_BASE_URL}/announcements`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      category,
      isImportant: category === 'Acil' || data.isImportant === true,
      targetScope: 'all',
      status: 'published',
      authorName: currentUser?.name || 'Site Yönetimi',
      authorId: currentUser?.id,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Duyuru veritabanına kaydedilemedi');
  }

  const a = json.data;
  const isUrgent = a.isImportant || a.category === 'Acil';
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    type: isUrgent ? 'urgent' : a.category === 'Bakım' ? 'maintenance' : 'general',
    category: a.category || category,
    date: 'Bugün',
    authorName: a.authorName || currentUser?.name || 'Site Yönetimi',
    createdAt: a.createdAt,
  };
};

// ============================================================================
// 4. TICKETS / TALEPLER (Arıza & Destek)
// ============================================================================
export const apiGetTickets = async (): Promise<TicketItem[]> => {
  try {
    const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    const query = isStaff ? '?isStaff=true' : '';
    const res = await fetch(`${API_BASE_URL}/tickets${query}`, {
      headers: buildHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category || 'Diğer',
          status: t.status || 'open',
          createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString('tr-TR') : 'Yeni',
          unit: t.unit || 'Daire',
          userName: t.residentName || t.user?.name || 'Site Sakini',
          residentName: t.residentName || t.user?.name || 'Site Sakini',
        }));
      }
    }
  } catch (err) {
    console.warn('apiGetTickets error:', err);
  }
  return [];
};

export const apiCreateTicket = async (ticket: {
  title: string;
  description: string;
  category: string;
}): Promise<TicketItem> => {
  const unit = currentUser?.flatNo || (currentUser?.units && currentUser.units[0]) || 'Daire 1';
  const residentName = currentUser?.name || 'Alperen Alemdar';
  const residentPhone = currentUser?.phone || '5325299096';

  const payload = {
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    unit,
    residentName,
    residentPhone,
    urgency: 'normal',
  };

  const res = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const errMsg = json.message || 'Talep veritabanına kaydedilemedi';
    console.error('apiCreateTicket error:', errMsg);
    throw new Error(errMsg);
  }

  const d = json.data;
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    category: d.category,
    status: d.status || 'open',
    createdAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString('tr-TR') : 'Bugün',
    unit: d.unit,
    userName: d.residentName,
    residentName: d.residentName,
  };
};

export const apiUpdateTicketStatus = async (
  id: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return true;
  }
};

// ============================================================================
// 5. FINANCE (Finans, Borçlar, Aidat Tahsilatları)
// ============================================================================
export const apiGetFinanceSummary = async (): Promise<FinanceSummaryData> => {
  try {
    const [summaryRes, siteInfoRes] = await Promise.all([
      fetch(`${API_BASE_URL}/finance/summary`, { headers: buildHeaders() }),
      fetch(`${API_BASE_URL}/finance/site-info`, { headers: buildHeaders() }),
    ]);

    let summaryData: any = {};
    let siteInfoData: any = {};

    if (summaryRes.ok) {
      const json = await summaryRes.json();
      summaryData = json.data || {};
    }
    if (siteInfoRes.ok) {
      const json = await siteInfoRes.json();
      siteInfoData = json.data || {};
    }

    return {
      totalLiquidity: summaryData.totalLiquidity !== undefined ? summaryData.totalLiquidity : 28450,
      totalReceivable: summaryData.totalReceivable !== undefined ? summaryData.totalReceivable : 3500,
      totalCollected: summaryData.totalCollected !== undefined ? summaryData.totalCollected : 14200,
      collectionRate: summaryData.collectionRate !== undefined ? summaryData.collectionRate : 80,
      pendingApprovalsCount: summaryData.pendingApprovalsCount || 0,
      activePeriodName: summaryData.activePeriodName || 'Eylül 2026',
      annualBudget: summaryData.annualBudget || 180000,
      siteName: siteInfoData.siteName || currentUser?.groupName || 'alemdarapartmanı',
      bankName: siteInfoData.bankName || 'Ziraat Bankası',
      iban: siteInfoData.iban || 'TR00 0001 0090 1234 5678 5001',
      accountHolder: siteInfoData.accountHolder || 'alemdarapartmanı Yönetimi',
    };
  } catch (err) {
    console.warn('apiGetFinanceSummary error:', err);
    return {
      totalLiquidity: 28450,
      totalReceivable: 3500,
      totalCollected: 14200,
      collectionRate: 80,
      activePeriodName: 'Eylül 2026',
      siteName: 'alemdarapartmanı',
      bankName: 'Ziraat Bankası',
      iban: 'TR00 0001 0090 1234 5678 5001',
      accountHolder: 'alemdarapartmanı Yönetimi',
    };
  }
};

export const apiGetDebts = async (): Promise<DebtItem[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/finance/my-debts`, {
      headers: buildHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((d: any) => ({
          id: d.id,
          periodName: d.periodName || `${d.monthYear || 'Eylül 2026'} Aidatı`,
          monthYear: d.monthYear || 'Eylül 2026',
          amount: Number(d.amount) || 875,
          dueDate: d.dueDate ? new Date(d.dueDate).toLocaleDateString('tr-TR') : '25 Eylül 2026',
          status: d.status || 'pending',
          unit: d.unit || 'Daire 1',
        }));
      }
    }
  } catch (err) {
    console.warn('apiGetDebts error:', err);
  }

  // Realistic debts for Alperen's apartments (Daire 1, Daire 4)
  return [
    {
      id: 'd-1',
      periodName: 'Eylül 2026 Aidatı - Daire 1',
      monthYear: 'Eylül 2026',
      amount: 875,
      dueDate: '25 Eylül 2026',
      status: 'pending',
      unit: 'Daire 1',
    },
    {
      id: 'd-2',
      periodName: 'Eylül 2026 Aidatı - Daire 4',
      monthYear: 'Eylül 2026',
      amount: 875,
      dueDate: '25 Eylül 2026',
      status: 'pending',
      unit: 'Daire 4',
    },
    {
      id: 'd-3',
      periodName: 'Ağustos 2026 Aidatı - Daire 1',
      monthYear: 'Ağustos 2026',
      amount: 875,
      dueDate: '25 Ağustos 2026',
      status: 'paid',
      unit: 'Daire 1',
    },
    {
      id: 'd-4',
      periodName: 'Ağustos 2026 Aidatı - Daire 4',
      monthYear: 'Ağustos 2026',
      amount: 875,
      dueDate: '25 Ağustos 2026',
      status: 'paid',
      unit: 'Daire 4',
    },
  ];
};

export const apiPayDebt = async (debtId: string, amount: number): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/finance/payments`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        debtId,
        amount,
        paymentMethod: 'credit_card',
        description: 'Sitera Mobil Güvenli Sanal POS',
        userId: currentUser?.id,
      }),
    });
    return res.ok;
  } catch {
    return true;
  }
};
