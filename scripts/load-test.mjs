#!/usr/bin/env node
/**
 * =============================================================================
 * SITERA KURUMSAL YÜK VE STRES TESTİ MOTORU (ENTERPRISE LOAD TESTING SUITE)
 * =============================================================================
 * Bu araç; yüzlerce daireli sitelerde (500 - 1000 daire) ayın 1'i aidat pikleri,
 * acil duyuru patlamaları ve yüksek eşzamanlı sakin/yönetici trafiğini simüle eder.
 * Sayısal metrikler: Throughput (RPS), p50, p90, p95, p99 gecikmeleri ve hata oranları.
 * =============================================================================
 */

import http from 'http';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10); // Eşzamanlı Sanal Sakin/Kullanıcı
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || '1000', 10); // Toplam Gönderilecek İstek
const OUTPUT_DIR = path.join(__dirname, '../benchmarks');

const ENDPOINTS = [
  { name: 'Sistem Sağlık & Canlılık', path: '/health', method: 'GET', weight: 15 },
  { name: 'Okunmamış Bildirim Sayacı', path: '/notifications/unread-count', method: 'GET', weight: 25 },
  { name: 'Bina Duyuruları Akışı', path: '/announcements', method: 'GET', weight: 25 },
  { name: 'Daire Borç & Aidat Durumu', path: '/finance/debts', method: 'GET', weight: 20 },
  { name: 'Finansal Yönetim Özeti', path: '/finance/summary', method: 'GET', weight: 10 },
  { name: 'Arıza & Talep Listesi', path: '/tickets', method: 'GET', weight: 5 },
];

class LoadTester {
  constructor() {
    this.latencies = [];
    this.statusCounts = {};
    this.endpointStats = {};
    this.completedRequests = 0;
    this.failedRequests = 0;
    this.startTime = 0;
    this.endTime = 0;

    ENDPOINTS.forEach((ep) => {
      this.endpointStats[ep.name] = { count: 0, latencies: [], errors: 0 };
    });
  }

  getRandomEndpoint() {
    const totalWeight = ENDPOINTS.reduce((sum, ep) => sum + ep.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const ep of ENDPOINTS) {
      if (rand < ep.weight) return ep;
      rand -= ep.weight;
    }
    return ENDPOINTS[0];
  }

  async sendRequest(endpoint) {
    return new Promise((resolve) => {
      const url = new URL(BASE_URL + endpoint.path);
      const start = performance.now();

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 4000,
          path: url.pathname + url.search,
          method: endpoint.method,
          headers: {
            'User-Agent': 'Sitera-LoadTest-Agent/1.0',
            'Accept': 'application/json',
            'X-Group-Id': 'a2485f94-7a43-4898-b8c2-a68bbac97a4c',
            'X-User-Id': '574b3bcd-4a1c-4558-a805-5edc5cd0451c',
            'X-User-Role': 'admin',
            'X-Forwarded-For': `10.0.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250) + 1}`, // Farklı IP simülasyonu
          },
          timeout: 10000,
        },
        (res) => {
          res.on('data', () => {}); // Tüket
          res.on('end', () => {
            const duration = performance.now() - start;
            this.recordResult(endpoint, res.statusCode, duration);
            resolve();
          });
        }
      );

      req.on('error', (err) => {
        const duration = performance.now() - start;
        this.recordResult(endpoint, 0, duration, err);
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        const duration = performance.now() - start;
        this.recordResult(endpoint, 408, duration, new Error('Timeout'));
        resolve();
      });

      req.end();
    });
  }

  recordResult(endpoint, statusCode, durationMs, error = null) {
    this.latencies.push(durationMs);
    this.statusCounts[statusCode] = (this.statusCounts[statusCode] || 0) + 1;
    this.completedRequests++;

    const epStat = this.endpointStats[endpoint.name];
    epStat.count++;
    epStat.latencies.push(durationMs);
    if (error || statusCode >= 400) {
      this.failedRequests++;
      epStat.errors++;
    }
  }

  async run() {
    console.log('================================================================');
    console.log('🚀 SITERA KURUMSAL YÜK & PERFORMANS STRES TESTİ BAŞLATILIYOR');
    console.log(`🎯 Hedef API           : ${BASE_URL}`);
    console.log(`👥 Eşzamanlı Sanal Sakin: ${CONCURRENCY} Sanal Kullanıcı`);
    console.log(`📦 Toplam İstek Sayısı : ${TOTAL_REQUESTS} İstek`);
    console.log(`🏘️  Hedef Ölçek         : 500 - 1.000 Daireli Büyük Konut Siteleri`);
    console.log('================================================================\n');

    this.startTime = performance.now();

    let sent = 0;
    const workers = [];

    const workerLoop = async () => {
      while (sent < TOTAL_REQUESTS) {
        sent++;
        const ep = this.getRandomEndpoint();
        await this.sendRequest(ep);
        if (this.completedRequests % 100 === 0 || this.completedRequests === TOTAL_REQUESTS) {
          process.stdout.write(
            `\r⏳ İşlenen İstek: ${this.completedRequests}/${TOTAL_REQUESTS} (%${Math.round(
              (this.completedRequests / TOTAL_REQUESTS) * 100
            )})`
          );
        }
      }
    };

    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push(workerLoop());
    }

    await Promise.all(workers);
    this.endTime = performance.now();
    console.log('\n\n✅ Test tamamlandı, metrikler hesaplanıyor...\n');

    this.printReport();
  }

  calculatePercentiles(arr) {
    if (arr.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
    const sorted = [...arr].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg,
      p50,
      p90,
      p95,
      p99,
    };
  }

  printReport() {
    const totalDurationSec = (this.endTime - this.startTime) / 1000;
    const rps = this.completedRequests / totalDurationSec;
    const globalPercentiles = this.calculatePercentiles(this.latencies);
    const errorRate = (this.failedRequests / this.completedRequests) * 100;

    console.log('================================================================');
    console.log('📊 SITERA YÜK TESTİ SONUÇ VE PERFORMANS RAPORU');
    console.log('================================================================');
    console.log(`⏱️  Toplam Test Süresi       : ${totalDurationSec.toFixed(2)} saniye`);
    console.log(`⚡ Throughput (RPS)          : ${rps.toFixed(1)} istek / saniye`);
    console.log(`🎯 Tamamlanan İstek          : ${this.completedRequests}`);
    console.log(`❌ Hata / Aşım Sayısı        : ${this.failedRequests} (%${errorRate.toFixed(2)})`);
    console.log('----------------------------------------------------------------');
    console.log('⏱️  YANIT SÜRELERİ (LATENCY METRİKLERİ):');
    console.log(`   • Minimum Gecikme (Min)   : ${globalPercentiles.min.toFixed(2)} ms`);
    console.log(`   • Ortalama Gecikme (Avg)  : ${globalPercentiles.avg.toFixed(2)} ms`);
    console.log(`   • Medyan (p50)            : ${globalPercentiles.p50.toFixed(2)} ms`);
    console.log(`   • 90. Yüzdelik (p90)      : ${globalPercentiles.p90.toFixed(2)} ms`);
    console.log(`   • 95. Yüzdelik (p95)      : ${globalPercentiles.p95.toFixed(2)} ms`);
    console.log(`   • 99. Yüzdelik (p99)      : ${globalPercentiles.p99.toFixed(2)} ms`);
    console.log(`   • Maksimum Gecikme (Max)  : ${globalPercentiles.max.toFixed(2)} ms`);
    console.log('----------------------------------------------------------------');
    console.log('📋 HTTP DURUM KODLARI DAĞILIMI:');
    for (const [status, count] of Object.entries(this.statusCounts)) {
      const pct = ((count / this.completedRequests) * 100).toFixed(1);
      console.log(`   • HTTP ${status}: ${count} (%${pct})`);
    }
    console.log('----------------------------------------------------------------');
    console.log('🏘️  UÇ NOKTA (ENDPOINT) BAZLI YÜK PERFORMANSI:');
    for (const [name, stat] of Object.entries(this.endpointStats)) {
      const epPerc = this.calculatePercentiles(stat.latencies);
      console.log(
        `   • ${name.padEnd(26)}: ${stat.count} istek | Ort: ${epPerc.avg.toFixed(
          1
        )}ms | p95: ${epPerc.p95.toFixed(1)}ms | Hata: ${stat.errors}`
      );
    }
    console.log('================================================================');

    // Sonuçları Diske Yaz
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const reportJson = {
      timestamp: new Date().toISOString(),
      concurrency: CONCURRENCY,
      totalRequests: this.completedRequests,
      durationSeconds: totalDurationSec,
      throughputRps: rps,
      errorRatePercent: errorRate,
      statusCodes: this.statusCounts,
      latencies: globalPercentiles,
      endpoints: this.endpointStats,
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'load-test-report.json'),
      JSON.stringify(reportJson, null, 2)
    );
    console.log(`💾 Ayrıntılı JSON raporu kaydedildi: benchmarks/load-test-report.json\n`);
  }
}

const tester = new LoadTester();
tester.run().catch((err) => {
  console.error('Yük testi hatası:', err);
  process.exit(1);
});
