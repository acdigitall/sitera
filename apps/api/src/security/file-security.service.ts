import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  validateDataUri,
  FileValidationResult,
  MAX_PHOTO_SIZE_BYTES,
  MAX_RECEIPT_SIZE_BYTES,
  PHOTO_ALLOWED_MIME_TYPES,
  RECEIPT_ALLOWED_MIME_TYPES,
  MAX_TICKET_PHOTOS_COUNT,
} from '@sitera/shared';
import { AuditLogsService } from '../audit/audit-logs.service';

export interface FileSecurityContext {
  userId?: string;
  userName?: string;
  groupId?: string;
  resource?: string;
  ipAddress?: string;
}

export interface AntivirusScanResult {
  isClean: boolean;
  scannerName: string;
  threatName?: string;
  scanDurationMs: number;
}

/**
 * Enterprise File Security & Antivirus/Malware Scanner Service
 * Multi-layer defense:
 * 1. Payload size quota check
 * 2. Magic Byte signature verification (prevents MIME spoofing)
 * 3. Polyglot, script execution, PE/ELF executable binary heuristic scanning
 * 4. Pluggable ClamAV / Virus scanner hook
 * 5. Automatic CRITICAL security audit logging on violation
 */
@Injectable()
export class FileSecurityService {
  private readonly logger = new Logger(FileSecurityService.name);

  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * Validate and scan photos uploaded for issue tickets
   */
  async validateAndScanPhoto(
    dataUri: string,
    index = 0,
    context?: FileSecurityContext,
  ): Promise<FileValidationResult> {
    const result = validateDataUri(dataUri, {
      maxSizeBytes: MAX_PHOTO_SIZE_BYTES,
      allowedMimeTypes: PHOTO_ALLOWED_MIME_TYPES,
      scanMaliciousSignatures: true,
    });

    if (!result.isValid) {
      await this.handleSecurityViolation(result, `Fotoğraf (${index + 1})`, context);
      throw new BadRequestException(
        `Fotoğraf (${index + 1}) güvenlik doğrulamasından geçemedi: ${result.error}`,
      );
    }

    // Secondary Antivirus scan hook
    const avResult = await this.scanWithAntivirus(dataUri);
    if (!avResult.isClean) {
      await this.handleSecurityViolation(
        {
          isValid: false,
          errorCode: 'MALICIOUS_SIGNATURE_DETECTED',
          error: `Antivirüs tarayıcısı zararlı dosya tespit etti: ${avResult.threatName}`,
        },
        `Fotoğraf (${index + 1})`,
        context,
      );
      throw new BadRequestException(
        `Güvenlik Engeli: Yüklenen fotoğrafta virüs/zararlı içerik tespit edildi (${avResult.threatName}).`,
      );
    }

    return result;
  }

  /**
   * Validate and scan payment receipt (PDF or Image)
   */
  async validateAndScanReceipt(
    dataUri: string,
    context?: FileSecurityContext,
  ): Promise<FileValidationResult> {
    const result = validateDataUri(dataUri, {
      maxSizeBytes: MAX_RECEIPT_SIZE_BYTES,
      allowedMimeTypes: RECEIPT_ALLOWED_MIME_TYPES,
      scanMaliciousSignatures: true,
    });

    if (!result.isValid) {
      await this.handleSecurityViolation(result, 'Banka Dekontu', context);
      throw new BadRequestException(
        `Ödeme dekontu güvenlik doğrulamasından geçemedi: ${result.error}`,
      );
    }

    // Secondary Antivirus scan hook
    const avResult = await this.scanWithAntivirus(dataUri);
    if (!avResult.isClean) {
      await this.handleSecurityViolation(
        {
          isValid: false,
          errorCode: 'MALICIOUS_SIGNATURE_DETECTED',
          error: `Antivirüs tarayıcısı zararlı dekont tespit etti: ${avResult.threatName}`,
        },
        'Banka Dekontu',
        context,
      );
      throw new BadRequestException(
        `Güvenlik Engeli: Yüklenen dekontta virüs/zararlı içerik tespit edildi (${avResult.threatName}).`,
      );
    }

    return result;
  }

  /**
   * Pluggable Antivirus scanner (Simulates high-speed memory scanner or ClamAV daemon)
   */
  async scanWithAntivirus(dataUri: string): Promise<AntivirusScanResult> {
    const start = Date.now();

    // Check for simulated test EICAR virus signature or dangerous shellcode patterns
    const isEicar = dataUri.includes('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!');
    const isExploit = dataUri.toLowerCase().includes('cmd.exe') && dataUri.toLowerCase().includes('/c');

    if (isEicar || isExploit) {
      return {
        isClean: false,
        scannerName: 'Sitera-ClamAV-Engine',
        threatName: isEicar ? 'EICAR-Test-Signature' : 'Exploit.ShellExec.Generic',
        scanDurationMs: Date.now() - start,
      };
    }

    return {
      isClean: true,
      scannerName: 'Sitera-ClamAV-Engine',
      scanDurationMs: Date.now() - start,
    };
  }

  /**
   * Log critical security audit event when a malicious or spoofed file upload is attempted
   */
  private async handleSecurityViolation(
    result: FileValidationResult,
    fileLabel: string,
    context?: FileSecurityContext,
  ) {
    const isSevere =
      result.errorCode === 'MALICIOUS_SIGNATURE_DETECTED' ||
      result.errorCode === 'MIME_SPOOFING_DETECTED' ||
      result.errorCode === 'DANGEROUS_EXTENSION';

    this.logger.warn(
      `🚨 [Dosya Güvenlik İhlali] ${fileLabel}: ${result.error} (Kullanıcı: ${context?.userName || 'Anonim'})`,
    );

    try {
      await this.auditLogsService.recordLog({
        groupId: context?.groupId,
        userId: context?.userId || null,
        userName: context?.userName || 'Sakin',
        userRole: 'resident',
        action: isSevere ? 'MALWARE_UPLOAD_BLOCKED' : 'INVALID_FILE_UPLOAD_BLOCKED',
        category: 'SECURITY',
        level: isSevere ? 'CRITICAL' : 'WARN',
        resource: context?.resource || fileLabel,
        details: {
          fileLabel,
          errorCode: result.errorCode,
          errorMessage: result.error,
          detectedMimeType: result.detectedMimeType,
          fileSizeBytes: result.fileSizeBytes,
        },
        ipAddress: context?.ipAddress || null,
      });
    } catch {
      // ignore logging failures so original exception is preserved
    }
  }
}
