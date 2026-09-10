import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

interface RequestMetricKey {
  method: string;
  path: string;
  status: number;
}

@Injectable()
export class MetricsService {
  private requestCounts = new Map<string, number>();
  private requestDurations = new Map<string, number[]>();
  private rateLimitExceededCount = 0;
  private errorCounts = new Map<string, number>();

  constructor(
    private readonly dataSource?: DataSource,
    private readonly redisService?: RedisService,
  ) {}

  /**
   * HTTP isteği metriğini kaydeder (Süre ve durum kodu)
   */
  recordHttpRequest(method: string, rawPath: string, status: number, durationMs: number): void {
    // Rota yollarını normalize et (ID parametrelerini grupla)
    const normalizedPath = this.normalizePath(rawPath);
    const key = `${method.toUpperCase()}|${normalizedPath}|${status}`;

    const currentCount = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, currentCount + 1);

    // Süre kaydı
    const durationKey = `${method.toUpperCase()}|${normalizedPath}`;
    const durations = this.requestDurations.get(durationKey) || [];
    durations.push(durationMs);
    // Bellek şişmesini önlemek için son 1000 örneği tut
    if (durations.length > 1000) {
      durations.shift();
    }
    this.requestDurations.set(durationKey, durations);

    if (status >= 500) {
      const errKey = `${method.toUpperCase()}|${normalizedPath}|${status}`;
      this.errorCounts.set(errKey, (this.errorCounts.get(errKey) || 0) + 1);
    }
  }

  /**
   * Hız sınırı (Rate Limit) aşımını sayar
   */
  recordRateLimitExceeded(): void {
    this.rateLimitExceededCount += 1;
  }

  /**
   * Prometheus Standard Text Format (version=0.0.4) üretir
   */
  async getPrometheusMetrics(): Promise<string> {
    const lines: string[] = [];

    // 1. HTTP İstek Sayıları
    lines.push('# HELP sitera_http_requests_total Total number of HTTP requests processed');
    lines.push('# TYPE sitera_http_requests_total counter');
    for (const [key, count] of this.requestCounts.entries()) {
      const [method, path, status] = key.split('|');
      lines.push(`sitera_http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`);
    }

    // 2. HTTP İstek Yanıt Süreleri (Saniye cinsinden Histogram / Ortalama)
    lines.push('\n# HELP sitera_http_request_duration_seconds HTTP request latencies in seconds');
    lines.push('# TYPE sitera_http_request_duration_seconds summary');
    for (const [key, durations] of this.requestDurations.entries()) {
      const [method, path] = key.split('|');
      if (durations.length > 0) {
        const sorted = [...durations].sort((a, b) => a - b);
        const sumSec = durations.reduce((a, b) => a + b, 0) / 1000;
        const count = durations.length;
        const p50 = (sorted[Math.floor(count * 0.5)] || 0) / 1000;
        const p90 = (sorted[Math.floor(count * 0.9)] || 0) / 1000;
        const p99 = (sorted[Math.floor(count * 0.99)] || 0) / 1000;

        lines.push(`sitera_http_request_duration_seconds{method="${method}",path="${path}",quantile="0.5"} ${p50.toFixed(4)}`);
        lines.push(`sitera_http_request_duration_seconds{method="${method}",path="${path}",quantile="0.9"} ${p90.toFixed(4)}`);
        lines.push(`sitera_http_request_duration_seconds{method="${method}",path="${path}",quantile="0.99"} ${p99.toFixed(4)}`);
        lines.push(`sitera_http_request_duration_seconds_sum{method="${method}",path="${path}"} ${sumSec.toFixed(4)}`);
        lines.push(`sitera_http_request_duration_seconds_count{method="${method}",path="${path}"} ${count}`);
      }
    }

    // 3. Güvenlik Metrikleri (Rate Limit Aşımı)
    lines.push('\n# HELP sitera_rate_limit_exceeded_total Total number of rate-limit violations');
    lines.push('# TYPE sitera_rate_limit_exceeded_total counter');
    lines.push(`sitera_rate_limit_exceeded_total ${this.rateLimitExceededCount}`);

    // 4. Veritabanı ve Redis Sağlık Durumu (1 = Healthy, 0 = Unhealthy)
    lines.push('\n# HELP sitera_database_connected Database connection state (1=connected, 0=disconnected)');
    lines.push('# TYPE sitera_database_connected gauge');
    const isDbConnected = this.dataSource?.isInitialized ? 1 : 0;
    lines.push(`sitera_database_connected ${isDbConnected}`);

    lines.push('\n# HELP sitera_redis_connected Redis connection state (1=connected, 0=disconnected)');
    lines.push('# TYPE sitera_redis_connected gauge');
    const isRedisConnected = this.redisService?.getIsConnected() ? 1 : 0;
    lines.push(`sitera_redis_connected ${isRedisConnected}`);

    // 5. Node.js Süreç & Bellek Metrikleri
    const mem = process.memoryUsage();
    lines.push('\n# HELP process_resident_memory_bytes Resident memory size in bytes');
    lines.push('# TYPE process_resident_memory_bytes gauge');
    lines.push(`process_resident_memory_bytes ${mem.rss}`);

    lines.push('\n# HELP nodejs_heap_size_used_bytes Process heap memory used in bytes');
    lines.push('# TYPE nodejs_heap_size_used_bytes gauge');
    lines.push(`nodejs_heap_size_used_bytes ${mem.heapUsed}`);

    lines.push('\n# HELP process_uptime_seconds Total seconds process has been running');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${Math.floor(process.uptime())}`);

    return lines.join('\n') + '\n';
  }

  /**
   * Dinamik URL parametrelerini (:id, UUID, sayılar) normalize ederek metrik kardinalitesini düşük tutar
   */
  private normalizePath(path: string): string {
    const cleanPath = path.split('?')[0]; // Query stringi at
    return cleanPath
      // UUID'leri :id ile değiştir
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      // Sayısal ID'leri :id ile değiştir
      .replace(/\/\d+(?=\/|$)/g, '/:id');
  }
}
