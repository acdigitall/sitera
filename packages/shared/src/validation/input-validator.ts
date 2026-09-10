/**
 * Sitera Kurumsal Girdi Doğrulama ve Sanitizasyon Motoru (Input Validation & Sanitization Engine)
 * 
 * Özellikler:
 * 1. Katı Whitelist Doğrulaması (Mass-Assignment / Parameter Tampering koruması)
 * 2. Format & Tip Kontrolü (Email, Telefon, Pozitif Para Tutarı, Karakter Sınırları)
 * 3. XSS & HTML Enjeksiyon Sanitizasyonu
 * 4. Çoklu ortam desteği (NestJS API, React Web, React Native)
 */

export interface FieldRule {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'phone';
  required?: boolean;
  min?: number;
  max?: number;
  positive?: boolean;
  enum?: readonly any[] | any[];
  sanitize?: boolean;
  message?: string;
  custom?: (val: any) => boolean | string;
}

export type DtoSchema<T> = {
  [K in keyof T]?: FieldRule;
} & Record<string, FieldRule>;

export interface ValidationErrorItem {
  field: string;
  value?: any;
  message: string;
}

export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: ValidationErrorItem[];
  sanitizedData?: T;
}

/**
 * XSS ve zararlı HTML kodlarını metinden temizler / etkisizleştirir
 */
export function sanitizeXss(value: string): string {
  if (typeof value !== 'string') return value;

  return value
    // <script> etiketlerini ve içeriğini kaldır
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // javascript: sözde protokolünü kaldır
    .replace(/javascript:[^"'\s]*/gi, '')
    // on* olay dinleyicilerini kaldır (onclick, onerror, onload vb.)
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Tehlikeli HTML etiketlerini kaldır (<iframe, <object, <embed, <link, <style)
    .replace(/<\/?(?:iframe|object|embed|link|style|meta|applet)[^>]*>/gi, '')
    // Temel HTML karakter kaçışları
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Bir nesne içindeki tüm string alanlara özyinelemeli (recursive) sanitizasyon uygular
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'string'
        ? sanitizeXss(item)
        : typeof item === 'object' && item !== null
        ? sanitizeObject(item)
        : item
    ) as unknown as T;
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeXss(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * E-posta format doğrulaması (RFC 5322 uyumlu standart regex)
 */
export function isEmail(value: any): boolean {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(value.trim());
}

/**
 * Telefon format doğrulaması (+90, 05xx veya uluslararası geçerli biçim)
 */
export function isPhone(value: any): boolean {
  if (typeof value !== 'string') return false;
  const cleaned = value.replace(/[\s\-()]/g, '');
  // Türkiye veya genel uluslararası telefon: 10 ile 15 hane arası rakam, opsiyonel + ile başlar
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Pozitif para tutarı veya miktar doğrulaması
 */
export function isPositiveNumber(value: any, allowZero = false): boolean {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return false;
  }
  return allowZero ? value >= 0 : value > 0;
}

/**
 * Metin uzunluk sınır doğrulaması
 */
export function isStringBounds(value: any, min = 1, max = 255): boolean {
  if (typeof value !== 'string') return false;
  const len = value.trim().length;
  return len >= min && len <= max;
}

/**
 * Kurumsal DTO Validatörü:
 * Gelen veriyi şemaya göre denetler, istenmeyen alanları (mass-assignment) ayıklar veya hata üretir.
 */
export function validateDto<T = any>(
  data: any,
  schema: DtoSchema<T>,
  options: {
    forbidNonWhitelisted?: boolean;
    sanitizeStrings?: boolean;
  } = { forbidNonWhitelisted: true, sanitizeStrings: true }
): ValidationResult<T> {
  const errors: ValidationErrorItem[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      errors: [{ field: 'root', message: 'İstek gövdesi geçerli bir JSON nesnesi olmalıdır' }],
    };
  }

  const allowedKeys = new Set(Object.keys(schema));
  const dataKeys = Object.keys(data);

  // 1. Mass-Assignment (Yetkisiz/Tanımsız Parametre) Koruması
  if (options.forbidNonWhitelisted) {
    for (const key of dataKeys) {
      if (!allowedKeys.has(key)) {
        errors.push({
          field: key,
          value: data[key],
          message: `'${key}' alanı bu istek gövdesinde tanımlı değildir (İzinsiz parametre enjeksiyonu engellendi)`,
        });
      }
    }
  }

  const sanitizedData: any = {};

  // 2. Tanımlı Alanların Doğrulaması
  for (const [key, rule] of Object.entries(schema)) {
    const value = data[key];

    // Zorunlu alan kontrolü
    if (value === undefined || value === null || value === '') {
      if (rule.required) {
        errors.push({
          field: key,
          message: rule.message || `'${key}' alanı zorunludur`,
        });
      }
      continue;
    }

    // Tip Kontrolleri
    if (rule.type) {
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({ field: key, message: `'${key}' bir metin (string) olmalıdır` });
            continue;
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push({ field: key, message: `'${key}' bir sayı olmalıdır` });
            continue;
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push({ field: key, message: `'${key}' boolean (true/false) olmalıdır` });
            continue;
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push({ field: key, message: `'${key}' bir dizi (array) olmalıdır` });
            continue;
          }
          break;
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            errors.push({ field: key, message: `'${key}' bir nesne (object) olmalıdır` });
            continue;
          }
          break;
        case 'email':
          if (!isEmail(value)) {
            errors.push({ field: key, message: `'${key}' geçerli bir e-posta formatında olmalıdır` });
            continue;
          }
          break;
        case 'phone':
          if (!isPhone(value)) {
            errors.push({ field: key, message: `'${key}' geçerli bir telefon formatında olmalıdır (örn: 05xxxxxxxxx)` });
            continue;
          }
          break;
      }
    }

    // Sayısal / Pozitif Değer Kontrolü
    if (typeof value === 'number') {
      if (rule.positive && !isPositiveNumber(value, false)) {
        errors.push({ field: key, message: `'${key}' sıfırdan büyük pozitif bir değer olmalıdır` });
      }
      if (rule.min !== undefined && value < rule.min) {
        errors.push({ field: key, message: `'${key}' en az ${rule.min} olmalıdır` });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({ field: key, message: `'${key}' en fazla ${rule.max} olabilir` });
      }
    }

    // Metin Uzunluk Kontrolleri
    if (typeof value === 'string') {
      const len = value.trim().length;
      if (rule.min !== undefined && len < rule.min) {
        errors.push({ field: key, message: `'${key}' en az ${rule.min} karakter olmalıdır` });
      }
      if (rule.max !== undefined && len > rule.max) {
        errors.push({ field: key, message: `'${key}' en fazla ${rule.max} karakter olabilir` });
      }
    }

    // Dizi Boyut Kontrolleri
    if (Array.isArray(value)) {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push({ field: key, message: `'${key}' en az ${rule.min} eleman içermelidir` });
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push({ field: key, message: `'${key}' en fazla ${rule.max} eleman içerebilir` });
      }
    }

    // Enum Kontrolü
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field: key,
        message: `'${key}' yalnızca şu değerlerden biri olabilir: ${rule.enum.join(', ')}`,
      });
    }

    // Özel Validasyon Kuralı
    if (rule.custom) {
      const customRes = rule.custom(value);
      if (customRes !== true) {
        errors.push({
          field: key,
          message: typeof customRes === 'string' ? customRes : `'${key}' geçersiz bir değere sahip`,
        });
      }
    }

    // Sanitizasyon & Değer Atama
    if (typeof value === 'string' && (options.sanitizeStrings || rule.sanitize)) {
      sanitizedData[key] = sanitizeXss(value);
    } else if (typeof value === 'object' && value !== null && options.sanitizeStrings) {
      sanitizedData[key] = sanitizeObject(value);
    } else {
      sanitizedData[key] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
}

// ==========================================
// HAZIR DTO ŞEMALARI (ENTERPRISE DTO SCHEMAS)
// ==========================================

export const LOGIN_DTO_SCHEMA: DtoSchema<any> = {
  email: { type: 'email', required: true, max: 255 },
  password: { type: 'string', required: false, min: 4, max: 128 },
};

export const CREATE_TICKET_DTO_SCHEMA: DtoSchema<any> = {
  unit: { type: 'string', required: true, min: 1, max: 50 },
  residentName: { type: 'string', required: true, min: 2, max: 100 },
  residentPhone: { type: 'phone', required: false },
  title: { type: 'string', required: true, min: 3, max: 200, sanitize: true },
  description: { type: 'string', required: true, min: 5, max: 2000, sanitize: true },
  category: {
    type: 'string',
    required: true,
    enum: [
      'Peyzaj & Bahçe',
      'Asansör & Elektrik',
      'Temizlik & Hijyen',
      'Güvenlik & Kapı',
      'Sıhhi Tesisat',
      'Ortak Alan & Demirbaş',
      'Diğer',
    ],
  },
  location: { type: 'string', required: false, max: 200, sanitize: true },
  urgency: { type: 'string', required: false, enum: ['low', 'normal', 'high', 'urgent'] },
  photos: { type: 'array', required: false, max: 5 },
};

export const UPDATE_TICKET_STATUS_DTO_SCHEMA: DtoSchema<any> = {
  status: { type: 'string', required: true, enum: ['open', 'in_progress', 'resolved', 'closed'] },
  adminNotes: { type: 'string', required: false, max: 2000, sanitize: true },
};

export const CREATE_PAYMENT_DTO_SCHEMA: DtoSchema<any> = {
  debtId: { type: 'string', required: false, max: 100 },
  unit: { type: 'string', required: true, min: 1, max: 50 },
  amount: { type: 'number', required: true, positive: true, max: 1000000 },
  channel: { type: 'string', required: true, enum: ['bank_transfer', 'credit_card', 'cash'] },
  referenceNo: { type: 'string', required: false, max: 100, sanitize: true },
  receiptUrl: { type: 'string', required: false, max: 15000000 }, // Base64 data URI
  notes: { type: 'string', required: false, max: 1000, sanitize: true },
};

export const CREATE_PERIOD_DTO_SCHEMA: DtoSchema<any> = {
  name: { type: 'string', required: true, min: 2, max: 100, sanitize: true },
  amount: { type: 'number', required: true, positive: true, max: 500000 },
  totalAmount: { type: 'number', required: false, positive: true },
  calculationMode: {
    type: 'string',
    required: false,
    enum: ['per_unit', 'equal_split', 'share', 'unit_type', 'equal'],
  },
  targetRole: { type: 'string', required: false, enum: ['resident', 'owner'] },
  category: { type: 'string', required: false, enum: ['dues', 'fixture', 'penalty', 'other'] },
  dueDate: { type: 'string', required: true, min: 10, max: 30 },
  status: { type: 'string', required: false, enum: ['draft', 'active', 'closed'] },
  generateDebtsForUnits: { type: 'boolean', required: false },
};

export const CREATE_DEBT_DTO_SCHEMA: DtoSchema<any> = {
  userId: { type: 'string', required: false, max: 100 },
  periodId: { type: 'string', required: false, max: 100 },
  unit: { type: 'string', required: true, min: 1, max: 50 },
  residentName: { type: 'string', required: false, max: 100 },
  title: { type: 'string', required: true, min: 2, max: 150, sanitize: true },
  category: { type: 'string', required: false, enum: ['dues', 'fixture', 'penalty', 'other'] },
  targetRole: { type: 'string', required: false, enum: ['resident', 'owner'] },
  amount: { type: 'number', required: true, positive: true, max: 1000000 },
  dueDate: { type: 'string', required: true, min: 10, max: 30 },
};

export const CASH_COLLECTION_DTO_SCHEMA: DtoSchema<any> = {
  debtId: { type: 'string', required: false, max: 100 },
  unit: { type: 'string', required: true, min: 1, max: 50 },
  amount: { type: 'number', required: true, positive: true, max: 1000000 },
  residentName: { type: 'string', required: false, max: 100, sanitize: true },
  notes: { type: 'string', required: false, max: 500, sanitize: true },
};

export const UPDATE_FINANCE_SETTINGS_DTO_SCHEMA: DtoSchema<any> = {
  defaultDuesAmount: { type: 'number', required: false, positive: true },
  duesDueDay: { type: 'number', required: false, min: 1, max: 31 },
  autoGenerateMonthlyDues: { type: 'boolean', required: false },
  calculationMode: { type: 'string', required: false, enum: ['equal', 'share', 'unit_type'] },
  lateFeeEnabled: { type: 'boolean', required: false },
  lateFeeRate: { type: 'number', required: false, min: 0, max: 100 },
  annualBudget: { type: 'number', required: false, min: 0 },
};

export const CREATE_ANNOUNCEMENT_DTO_SCHEMA: DtoSchema<any> = {
  title: { type: 'string', required: true, min: 3, max: 200, sanitize: true },
  content: { type: 'string', required: true, min: 5, max: 10000, sanitize: true },
  category: {
    type: 'string',
    required: false,
    enum: ['Bakım', 'Aidat', 'Genel', 'Toplantı', 'Acil', 'Kesinti'],
  },
  isImportant: { type: 'boolean', required: false },
  targetScope: { type: 'string', required: false, enum: ['all', 'block', 'unit', 'role'] },
  targetBlocks: { type: 'array', required: false },
  targetUnits: { type: 'array', required: false },
  targetRole: { type: 'string', required: false, enum: ['all', 'owner', 'resident'] },
  status: { type: 'string', required: false, enum: ['published', 'scheduled', 'draft', 'archived'] },
  publishAt: { type: 'string', required: false },
};

export const CREATE_USER_DTO_SCHEMA: DtoSchema<any> = {
  groupId: { type: 'string', required: false, max: 100 },
  groupName: { type: 'string', required: false, max: 100 },
  name: { type: 'string', required: true, min: 2, max: 100, sanitize: true },
  email: { type: 'email', required: true, max: 255 },
  phone: { type: 'phone', required: false },
  role: {
    type: 'string',
    required: false,
    enum: ['superadmin', 'admin', 'accountant', 'auditor', 'security', 'staff', 'member', 'editor', 'guest'],
  },
  customPermissions: { type: 'array', required: false },
  password: { type: 'string', required: false, min: 4, max: 128 },
  units: { type: 'array', required: false },
  residentType: { type: 'string', required: false, enum: ['owner', 'tenant', 'both'] },
};

export const UPDATE_USER_DTO_SCHEMA: DtoSchema<any> = {
  name: { type: 'string', required: false, min: 2, max: 100, sanitize: true },
  email: { type: 'email', required: false, max: 255 },
  phone: { type: 'phone', required: false },
  role: {
    type: 'string',
    required: false,
    enum: ['superadmin', 'admin', 'accountant', 'auditor', 'security', 'staff', 'member', 'editor', 'guest'],
  },
  customPermissions: { type: 'array', required: false },
  password: { type: 'string', required: false, min: 4, max: 128 },
  units: { type: 'array', required: false },
  residentType: { type: 'string', required: false, enum: ['owner', 'tenant', 'both'] },
  isActive: { type: 'boolean', required: false },
};

export const CREATE_NOTIFICATION_DTO_SCHEMA: DtoSchema<any> = {
  userId: { type: 'string', required: true, min: 1, max: 100 },
  title: { type: 'string', required: true, min: 2, max: 200, sanitize: true },
  message: { type: 'string', required: true, min: 2, max: 1000, sanitize: true },
  type: {
    type: 'string',
    required: false,
    enum: ['ticket_update', 'payment_approval', 'announcement', 'debt_issued', 'system'],
  },
  priority: { type: 'string', required: false, enum: ['low', 'normal', 'high', 'urgent'] },
  linkUrl: { type: 'string', required: false, max: 500, sanitize: true },
  metadata: { type: 'object', required: false },
};

export const CREATE_GROUP_DTO_SCHEMA: DtoSchema<any> = {
  name: { type: 'string', required: true, min: 2, max: 100, sanitize: true },
  slug: { type: 'string', required: true, min: 2, max: 60 },
  plan: { type: 'string', required: false, enum: ['free', 'starter', 'pro', 'enterprise'] },
  totalUnits: { type: 'number', required: false, min: 1, max: 10000 },
  city: { type: 'string', required: false, max: 100, sanitize: true },
  district: { type: 'string', required: false, max: 100, sanitize: true },
  subscriptionStatus: {
    type: 'string',
    required: false,
    enum: ['trial', 'active', 'past_due', 'grace_period', 'canceled', 'paused'],
  },
  unitFee: { type: 'number', required: false, min: 0 },
  monthlyFee: { type: 'number', required: false, min: 0 },
  billingCycle: { type: 'string', required: false, enum: ['monthly', 'yearly'] },
  trialEndsAt: { type: 'string', required: false },
  licenseExpiresAt: { type: 'string', required: false },
  paymentStatus: {
    type: 'string',
    required: false,
    enum: ['paid', 'pending', 'overdue', 'free_trial'],
  },
};

export const UPDATE_GROUP_DTO_SCHEMA: DtoSchema<any> = {
  name: { type: 'string', required: false, min: 2, max: 100, sanitize: true },
  plan: { type: 'string', required: false, enum: ['free', 'starter', 'pro', 'enterprise'] },
  isActive: { type: 'boolean', required: false },
  totalUnits: { type: 'number', required: false, min: 1, max: 10000 },
  city: { type: 'string', required: false, max: 100, sanitize: true },
  district: { type: 'string', required: false, max: 100, sanitize: true },
  subscriptionStatus: {
    type: 'string',
    required: false,
    enum: ['trial', 'active', 'past_due', 'grace_period', 'canceled', 'paused'],
  },
  unitFee: { type: 'number', required: false, min: 0 },
  monthlyFee: { type: 'number', required: false, min: 0 },
  billingCycle: { type: 'string', required: false, enum: ['monthly', 'yearly'] },
  trialEndsAt: { type: 'string', required: false },
  licenseExpiresAt: { type: 'string', required: false },
  paymentStatus: {
    type: 'string',
    required: false,
    enum: ['paid', 'pending', 'overdue', 'free_trial'],
  },
  isFrozen: { type: 'boolean', required: false },
  frozenReason: { type: 'string', required: false, max: 500, sanitize: true },
};

export const APPLY_TRIAL_DTO_SCHEMA: DtoSchema<any> = {
  months: { type: 'number', required: false, min: 1, max: 60 },
};

export const EXTEND_LICENSE_DTO_SCHEMA: DtoSchema<any> = {
  months: { type: 'number', required: false, min: 1, max: 60 },
};

export const FREEZE_GROUP_DTO_SCHEMA: DtoSchema<any> = {
  isFrozen: { type: 'boolean', required: true },
  reason: { type: 'string', required: false, max: 500, sanitize: true },
};
