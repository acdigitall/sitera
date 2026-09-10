/**
 * Sitera İstemci Tarafı Gözlemlenebilirlik ve Hata Raporlama Servisi (Web Observability & Sentry Hook)
 */

export interface ClientErrorPayload {
  message: string;
  stack?: string;
  source?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  extra?: Record<string, any>;
}

class ClientObservabilityService {
  private isInitialized = false;

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    // 1. Yakalanmamış JavaScript Hataları (Uncaught Exceptions)
    window.addEventListener('error', (event) => {
      this.captureClientError(event.error || new Error(event.message), {
        source: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // 2. Reddedilmiş Promise Hataları (Unhandled Promise Rejections)
    window.addEventListener('unhandledrejection', (event) => {
      this.captureClientError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { source: 'unhandledrejection' }
      );
    });

    this.isInitialized = true;
    console.log('✅ Sitera Web İstemci Gözlemlenebilirlik servisi devrede.');
  }

  /**
   * İstemci tarafı hatasını yakalar ve yapılandırılmış konsol / telemetri kaydı düşer
   */
  captureClientError(error: Error, extra?: Record<string, any>) {
    const payload: ClientErrorPayload = {
      message: error?.message || 'Bilinmeyen İstemci Hatası',
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      extra,
    };

    if (process.env.NODE_ENV === 'production') {
      // Üretim ortamında Sentry Web SDK veya merkezi telemetry endpoint'ine gönderilir
      console.error('[Telemetry Client Error]', JSON.stringify(payload));
    } else {
      console.error('🚨 [Client Observability Trace]', payload);
    }
  }

  /**
   * Performans ölçüm işareti (Web Vitals / User Timing API)
   */
  markPerformance(markName: string) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(markName);
    }
  }
}

export const clientObservability = new ClientObservabilityService();
