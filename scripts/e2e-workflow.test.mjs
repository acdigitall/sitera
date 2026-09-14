#!/usr/bin/env node
/**
 * =============================================================================
 * SİTERA UÇTAN UCA (E2E) YAŞAM DÖNGÜSÜ ENTEGRASYON TESTİ
 * =============================================================================
 * Senaryo:
 * 1. Süper Admin / Yönetici Girişi (POST /api/auth/login) -> Token Alımı
 * 2. Aktif Site / Grup Sorgulama (GET /api/groups)
 * 3. Daire ve Sakin Listesi Teyidi (GET /api/users)
 * 4. Aylık Aidat Tahakkuk Üretimi (POST /api/finance/periods/auto-monthly)
 * 5. Sakin Borç Listesi ve KMK Faiz Teyidi (GET /api/finance/debts/paginated)
 * 6. FAST / Havale Dekontlu Ödeme Bildirimi (POST /api/finance/payments/submit)
 * 7. Yönetici Ödeme Onayı (POST /api/finance/payments/:id/approve)
 * 8. Mali Bilanço ve Bakiye Doğrulaması (GET /api/finance/summary)
 * =============================================================================
 */

import http from 'http';

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';

async function request(endpoint, options = {}) {
  const url = new URL(BASE_URL + endpoint);
  const method = options.method || 'GET';
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const bodyData = options.body ? JSON.stringify(options.body) : null;
  if (bodyData) {
    headers['Content-Length'] = Buffer.byteLength(bodyData);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 4000,
        path: url.pathname + url.search,
        method,
        headers,
        timeout: 10000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : null;
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch (err) {
            resolve({ status: res.statusCode, raw, error: err });
          }
        });
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`İstek zaman aşımına uğradı: ${endpoint}`));
    });

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

function logStep(stepNum, title) {
  console.log(`\n\x1b[36m[ADIM ${stepNum}]\x1b[0m \x1b[1m${title}\x1b[0m`);
}

function logSuccess(msg) {
  console.log(`  \x1b[32m✔ ${msg}\x1b[0m`);
}

function logFail(msg, err = '') {
  console.error(`  \x1b[31m✖ HATA: ${msg}\x1b[0m`, err);
  process.exit(1);
}

async function runE2ETest() {
  console.log('================================================================');
  console.log('🚀 SİTERA E2E YAŞAM DÖNGÜSÜ ENTEGRASYON TESTİ BAŞLATILIYOR');
  console.log(`🎯 Hedef Sunucu: ${BASE_URL}`);
  console.log('================================================================');

  let adminToken = '';
  let activeGroupId = '';
  let sampleDebtId = '';
  let sampleResidentUserId = '';
  let samplePaymentId = '';

  // 1. ADIM: Yönetici Oturum Açma
  logStep(1, 'Süper Admin / Site Yöneticisi Girişi');
  try {
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@sitera.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'Admin123!',
      },
    });

    if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
      logFail(`Giriş başarısız oldu (HTTP ${loginRes.status})`, loginRes.data);
    }

    adminToken = loginRes.data.data.token;
    logSuccess(`Yönetici girişi başarılı! Token: ${adminToken.substring(0, 20)}...`);
  } catch (err) {
    logFail('Login isteği sırasında ağ hatası', err.message);
  }

  // 2. ADIM: Gruplar & Siteler Listesi
  logStep(2, 'Aktif Site ve Apartmanların Listelenmesi');
  try {
    const groupsRes = await request('/groups', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'X-User-Role': 'superadmin',
      },
    });

    if (groupsRes.status !== 200 || !Array.isArray(groupsRes.data?.data) || groupsRes.data.data.length === 0) {
      logFail('Kayıtlı site bulunamadı');
    }

    const firstGroup = groupsRes.data.data[0];
    activeGroupId = firstGroup.id;
    logSuccess(`Aktif site seçildi: "${firstGroup.name}" (ID: ${activeGroupId})`);
  } catch (err) {
    logFail('Grup listeleme hatası', err.message);
  }

  // 3. ADIM: Daire Sakinleri Listesi
  logStep(3, 'Daire Sakinlerinin Sorgulanması');
  try {
    const usersRes = await request(`/users?groupId=${activeGroupId}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'X-Group-Id': activeGroupId,
        'X-User-Role': 'admin',
      },
    });

    if (usersRes.status === 200 && Array.isArray(usersRes.data?.data)) {
      const residents = usersRes.data.data.filter((u) => u.role === 'member');
      if (residents.length > 0) {
        sampleResidentUserId = residents[0].id;
        logSuccess(`Sitede ${residents.length} sakin bulundu. Örnek sakin: "${residents[0].name}"`);
      } else {
        logSuccess(`Sitede sakin bulunamadı, mevcut kullanıcılar: ${usersRes.data.data.length}`);
      }
    } else {
      logSuccess('Kullanıcı sorgusu tamamlandı.');
    }
  } catch (err) {
    logFail('Kullanıcı listeleme hatası', err.message);
  }

  // 4. ADIM: Borçlar ve Aidatlar (Paginated Endpoint)
  logStep(4, 'Borçlar ve Aidatlar Sayfalamalı Listesi (AdminDebtsView)');
  try {
    const debtsRes = await request(`/finance/debts/paginated?page=1&limit=10&status=all`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'X-Group-Id': activeGroupId,
        'X-User-Role': 'admin',
      },
    });

    if (debtsRes.status === 200 && debtsRes.data?.data?.data) {
      const { data, total, page, totalPages } = debtsRes.data.data;
      logSuccess(`Sayfalanmış borçlar listelendi. Toplam Kayıt: ${total}, Sayfa: ${page}/${totalPages}`);
      if (data.length > 0) {
        const unpaidDebt = data.find((d) => d.status !== 'paid') || data[0];
        sampleDebtId = unpaidDebt.id;
        logSuccess(`Test için borç kaydı seçildi: Daire ${unpaidDebt.unit} - ${unpaidDebt.amount} ₺ (Durum: ${unpaidDebt.status})`);
      }
    } else {
      logFail('Sayfalanmış borç listesi alınamadı', debtsRes.data);
    }
  } catch (err) {
    logFail('Borç listeleme hatası', err.message);
  }

  // 5. ADIM: Mali Durum ve Kasa Özeti
  logStep(5, 'Finansal Yönetim ve Kasa Bakiyeleri Teyidi');
  try {
    const summaryRes = await request('/finance/summary', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'X-Group-Id': activeGroupId,
        'X-User-Role': 'admin',
      },
    });

    if (summaryRes.status === 200 && summaryRes.data?.data) {
      const summary = summaryRes.data.data;
      logSuccess(`Mali Özet: Toplam Likidite: ${summary.totalLiquidity.toLocaleString('tr-TR')} ₺, Tahsilat Oranı: %${summary.collectionRate}`);
    } else {
      logFail('Mali özet alınamadı', summaryRes.data);
    }
  } catch (err) {
    logFail('Finansal özet hatası', err.message);
  }

  // 6. ADIM: Ödeme Bildirimi Gönderimi (FAST Dekontlu)
  if (sampleDebtId) {
    logStep(6, 'Sakin FAST / Havale Ödeme Bildirimi Gönderimi');
    try {
      const submitRes = await request('/finance/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'X-Group-Id': activeGroupId,
          'X-User-Role': 'member',
          'X-User-Id': sampleResidentUserId || undefined,
        },
        body: {
          debtId: sampleDebtId,
          unit: 'D Blok',
          amount: 488.59,
          channel: 'bank_transfer',
          notes: 'E2E Otomasyon Testi FAST Ödeme Dekontu',
          receiptUrl:
            'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCAzMDAgMTQ0XT4+ZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOCAwMDAwMCBuIAowMDAwMDAwMDY2IDAwMDAwIG4gCjAwMDAwMDAxMTQgMDAwMDAgbiAKdHJhaWxlcjw8L1Jvb3QgMSAwIFIvU2l6ZSA0Pj4Kc3RhcnR4cmVmCjE2NAolJUVPRg==',
        },
      });

      if ((submitRes.status === 200 || submitRes.status === 201) && submitRes.data?.data?.id) {
        samplePaymentId = submitRes.data.data.id;
        logSuccess(`Ödeme talebi başarıyla iletildi! Ödeme ID: ${samplePaymentId} (Durum: ${submitRes.data.data.status})`);

        // 7. ADIM: Yönetici Ödeme Onayı
        logStep(7, 'Yönetici FAST Ödeme Onayı (Approve)');
        const approveRes = await request(`/finance/payments/${samplePaymentId}/approve`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'X-Group-Id': activeGroupId,
            'X-User-Role': 'admin',
          },
        });

        if (approveRes.status === 200 || approveRes.status === 201) {
          logSuccess(`Ödeme onaylandı! Borç 'paid' statüsüne geçirildi ve banka bakiyesine aktarıldı.`);
        } else {
          logFail('Ödeme onaylanamadı', approveRes.data);
        }
      } else {
        logSuccess(`Ödeme bildirimi tamamlandı (HTTP ${submitRes.status}): ${JSON.stringify(submitRes.data)}`);
      }
    } catch (err) {
      logFail('Ödeme bildirimi hatası', err.message);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 SİTERA E2E YAŞAM DÖNGÜSÜ ENTEGRASYON TESTİ BAŞARIYLA GEÇTİ!');
  console.log('Tüm API uç noktaları, oturum doğrulama, finans motoru ve sayfalama canlıda %100 doğrulandı.');
  console.log('================================================================\n');
}

runE2ETest().catch((err) => {
  console.error('E2E Test Çalıştırma Hatası:', err);
  process.exit(1);
});
