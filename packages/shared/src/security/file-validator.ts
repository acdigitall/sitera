/**
 * Sitera Comprehensive File & Image Security Validation Engine
 * Provides multi-layer security:
 * 1. File size enforcement
 * 2. Magic byte (binary file signature) verification (prevents MIME spoofing)
 * 3. Malicious payload / polyglot / script detection
 * 4. Dangerous / double extension detection
 */

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_TICKET_PHOTOS_COUNT = 5;

export const PHOTO_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const RECEIPT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'php', 'phtml', 'php3', 'php4', 'php5',
  'js', 'vbs', 'scr', 'com', 'msi', 'jar', 'svg', 'html', 'htm', 'xhtml',
  'asp', 'aspx', 'jsp', 'cgi', 'pl', 'py', 'ps1', 'dll', 'so', 'dylib',
]);

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: readonly string[];
  allowPdf?: boolean;
  scanMaliciousSignatures?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?:
    | 'FILE_TOO_LARGE'
    | 'INVALID_MIME_TYPE'
    | 'MIME_SPOOFING_DETECTED'
    | 'MALICIOUS_SIGNATURE_DETECTED'
    | 'DANGEROUS_EXTENSION'
    | 'INVALID_DATA_FORMAT'
    | 'TOO_MANY_FILES';
  detectedMimeType?: string;
  fileSizeBytes?: number;
}

/**
 * Inspects initial binary bytes to detect true MIME type by file signature (magic number)
 */
export function detectMagicMimeType(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // PDF: %PDF- (25 50 44 46 2D)
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return 'application/pdf';
  }

  // WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50) at offset 8
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  // GIF: GIF8 (47 49 46 38)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return 'image/gif';
  }

  return null;
}

/**
 * Checks for known executable headers or embedded script execution vectors
 */
export function detectMaliciousSignatures(bytes: Uint8Array): string | null {
  if (bytes.length < 2) return null;

  // 1. Windows PE Executable (MZ header: 4D 5A)
  if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
    return 'Windows çalıştırılabilir binary dosyası (PE/EXE/DLL) tespit edildi.';
  }

  // 2. Linux ELF Executable (7F 45 4C 46)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x7f &&
    bytes[1] === 0x45 &&
    bytes[2] === 0x4c &&
    bytes[3] === 0x46
  ) {
    return 'Linux çalıştırılabilir binary dosyası (ELF) tespit edildi.';
  }

  // 3. Java Bytecode / Mach-O Fat Binary (CA FE BA BE)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0xca &&
    bytes[1] === 0xfe &&
    bytes[2] === 0xba &&
    bytes[3] === 0xbe
  ) {
    return 'Çalıştırılabilir binary dosyası (Java Class / Mach-O) tespit edildi.';
  }

  // 4. Inspect ASCII / UTF-8 sample for embedded active scripts / polyglot injection
  const sampleLength = Math.min(bytes.length, 4096);
  let asciiText = '';
  for (let i = 0; i < sampleLength; i++) {
    const code = bytes[i];
    if (code >= 32 && code <= 126) {
      asciiText += String.fromCharCode(code);
    } else {
      asciiText += ' ';
    }
  }

  const lower = asciiText.toLowerCase();

  const scriptPatterns = [
    '<script',
    'javascript:',
    'vbscript:',
    '<?php',
    '<?=',
    'eval(',
    '/launch',
    '/javascript',
  ];

  for (const pattern of scriptPatterns) {
    if (lower.includes(pattern)) {
      return `Zararlı kod veya şüpheli betik deseni tespit edildi: "${pattern}"`;
    }
  }

  return null;
}

/**
 * Validates a file name to prevent directory traversal and double extensions
 */
export function validateFileName(filename: string): { isValid: boolean; error?: string } {
  if (!filename || filename.trim().length === 0) {
    return { isValid: false, error: 'Dosya adı boş olamaz.' };
  }

  // Null byte or path traversal
  if (filename.includes('\0') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { isValid: false, error: 'Güvenlik ihlali: Dosya adında geçersiz karakterler veya dizin geçişi tespit edildi.' };
  }

  const parts = filename.toLowerCase().split('.').filter(Boolean);
  if (parts.length < 2) {
    return { isValid: false, error: 'Dosya uzantısı bulunamadı.' };
  }

  const ext = parts[parts.length - 1];

  // Dangerous extension check
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { isValid: false, error: `Güvenlik engeli: ".${ext}" uzantılı dosyaların yüklenmesi yasaktır.` };
  }

  // Double extension check: e.g. "report.php.jpg" or "invoice.exe.png"
  for (let i = 1; i < parts.length - 1; i++) {
    if (DANGEROUS_EXTENSIONS.has(parts[i])) {
      return {
        isValid: false,
        error: `Güvenlik engeli: Çift uzantılı gizli dosya tespit edildi (".${parts[i]}.${ext}").`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates a Data URI or Base64 string payload (Used on server API and client)
 */
export function validateDataUri(
  dataUri: string,
  options: FileValidationOptions = {},
): FileValidationResult {
  if (!dataUri || typeof dataUri !== 'string') {
    return {
      isValid: false,
      errorCode: 'INVALID_DATA_FORMAT',
      error: 'Geçersiz dosya verisi sağlandı.',
    };
  }

  // 1. If it's a regular remote URL (http/https), pass through if allowed
  if (dataUri.startsWith('http://') || dataUri.startsWith('https://')) {
    return { isValid: true };
  }

  // 2. Parse data URI: data:[<mediatype>][;base64],<data>
  const match = dataUri.match(/^data:([a-zA-Z0-9/+-]+)?(;base64)?,(.*)$/);
  if (!match) {
    return {
      isValid: false,
      errorCode: 'INVALID_DATA_FORMAT',
      error: 'Veri geçerli bir Data URI (Base64) formatında değil.',
    };
  }

  const claimedMime = (match[1] || '').toLowerCase();
  const base64Data = match[3] || '';

  // Approximate byte size from base64
  const estimatedSizeBytes = Math.floor((base64Data.length * 3) / 4);
  const maxBytes = options.maxSizeBytes || MAX_PHOTO_SIZE_BYTES;

  if (estimatedSizeBytes > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    const actualMb = (estimatedSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      errorCode: 'FILE_TOO_LARGE',
      fileSizeBytes: estimatedSizeBytes,
      error: `Dosya boyutu sınırı aşıldı: Maksimum ${maxMb} MB yükleyebilirsiniz (Yüklenen: ${actualMb} MB).`,
    };
  }

  // Decode binary bytes
  let bytes: Uint8Array;
  try {
    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(base64Data, 'base64');
      bytes = new Uint8Array(buf);
    } else if (typeof atob !== 'undefined') {
      const binaryStr = atob(base64Data.slice(0, 8192)); // read initial chunk for magic inspection
      bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
    } else {
      return { isValid: true, fileSizeBytes: estimatedSizeBytes };
    }
  } catch {
    return {
      isValid: false,
      errorCode: 'INVALID_DATA_FORMAT',
      error: 'Base64 dosya içeriği ayrıştırılamadı.',
    };
  }

  // 3. Detect Magic MIME Type
  const detectedMime = detectMagicMimeType(bytes);
  if (!detectedMime) {
    return {
      isValid: false,
      errorCode: 'INVALID_MIME_TYPE',
      error: 'Dosya biçimi doğrulanamadı. Desteklenmeyen veya geçersiz dosya içeriği.',
    };
  }

  // 4. Check against allowed MIME types whitelist
  const allowed = options.allowedMimeTypes || PHOTO_ALLOWED_MIME_TYPES;
  if (!allowed.includes(detectedMime)) {
    return {
      isValid: false,
      errorCode: 'INVALID_MIME_TYPE',
      detectedMimeType: detectedMime,
      error: `İzin verilmeyen dosya türü (${detectedMime}). İzin verilen formatlar: ${allowed.join(', ')}`,
    };
  }

  // 5. Check if claimed MIME matches detected MIME (prevent MIME spoofing)
  if (claimedMime && claimedMime !== detectedMime) {
    // If claimed is image/jpg and detected is image/jpeg, that's fine
    const isJpgAlias =
      (claimedMime === 'image/jpg' && detectedMime === 'image/jpeg') ||
      (claimedMime === 'image/jpeg' && detectedMime === 'image/jpg');

    if (!isJpgAlias) {
      return {
        isValid: false,
        errorCode: 'MIME_SPOOFING_DETECTED',
        detectedMimeType: detectedMime,
        error: `Sahte dosya türü tespit edildi: Başlık '${claimedMime}' belirtilmiş fakat dosya içeriği '${detectedMime}'.`,
      };
    }
  }

  // 6. Scan for malicious payloads
  if (options.scanMaliciousSignatures !== false) {
    const maliciousWarning = detectMaliciousSignatures(bytes);
    if (maliciousWarning) {
      return {
        isValid: false,
        errorCode: 'MALICIOUS_SIGNATURE_DETECTED',
        error: `Güvenlik ihlali: ${maliciousWarning}`,
      };
    }
  }

  return {
    isValid: true,
    detectedMimeType: detectedMime,
    fileSizeBytes: estimatedSizeBytes,
  };
}

/**
 * Validates a browser File object before reading into DataURL
 */
export async function validateBrowserFile(
  file: File,
  options: FileValidationOptions = {},
): Promise<FileValidationResult> {
  if (!file) {
    return { isValid: false, errorCode: 'INVALID_DATA_FORMAT', error: 'Dosya seçilmedi.' };
  }

  // 1. File Name check
  const nameCheck = validateFileName(file.name);
  if (!nameCheck.isValid) {
    return {
      isValid: false,
      errorCode: 'DANGEROUS_EXTENSION',
      error: nameCheck.error,
    };
  }

  // 2. File Size check
  const maxBytes = options.maxSizeBytes || MAX_PHOTO_SIZE_BYTES;
  if (file.size > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    const actualMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      errorCode: 'FILE_TOO_LARGE',
      fileSizeBytes: file.size,
      error: `Dosya boyutu sınırı aşıldı: Maksimum ${maxMb} MB yükleyebilirsiniz (${file.name}: ${actualMb} MB).`,
    };
  }

  // 3. Inspect magic bytes via slice
  try {
    const slice = file.slice(0, 4096);
    const arrayBuffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const detectedMime = detectMagicMimeType(bytes);
    if (!detectedMime) {
      return {
        isValid: false,
        errorCode: 'INVALID_MIME_TYPE',
        error: `"${file.name}" dosyasının biçimi doğrulanamadı. Desteklenmeyen veya bozuk dosya.`,
      };
    }

    const allowed = options.allowedMimeTypes || PHOTO_ALLOWED_MIME_TYPES;
    if (!allowed.includes(detectedMime)) {
      return {
        isValid: false,
        errorCode: 'INVALID_MIME_TYPE',
        detectedMimeType: detectedMime,
        error: `"${file.name}" için izin verilmeyen dosya türü (${detectedMime}). İzin verilen formatlar: ${allowed.join(', ')}`,
      };
    }

    // Malicious signatures check
    if (options.scanMaliciousSignatures !== false) {
      const maliciousWarning = detectMaliciousSignatures(bytes);
      if (maliciousWarning) {
        return {
          isValid: false,
          errorCode: 'MALICIOUS_SIGNATURE_DETECTED',
          error: `Güvenlik ihlali (${file.name}): ${maliciousWarning}`,
        };
      }
    }

    return {
      isValid: true,
      detectedMimeType: detectedMime,
      fileSizeBytes: file.size,
    };
  } catch (err: any) {
    return {
      isValid: false,
      errorCode: 'INVALID_DATA_FORMAT',
      error: `Dosya okunamadı: ${err.message}`,
    };
  }
}
