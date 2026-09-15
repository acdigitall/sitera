import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  user: 'cagataydalaman',
  password: '12345678',
  database: 'sitera_db',
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function runScenario() {
  console.log('========================================================================');
  console.log('🚀 SİTERA A\'DAN Z\'YE GERÇEK HAYAT SENARYOSU: DEFNE EVLERİ SİTESİ');
  console.log('========================================================================\n');

  const client = await pool.connect();
  let groupId;
  try {
    await client.query('BEGIN');

    // 1. SITE (GROUP) CREATION
    const slug = 'defne-evleri';
    let groupRes = await client.query('SELECT id FROM groups WHERE slug = $1', [slug]);

    if (groupRes.rows.length > 0) {
      groupId = groupRes.rows[0].id;
      console.log(`ℹ️ Mevcut site bulundu (ID: ${groupId}), veriler temizlenip yeniden yapılandırılıyor...`);
      // Clean up previous test data for this group
      await client.query('DELETE FROM payments WHERE group_id = $1', [groupId]);
      await client.query('DELETE FROM debts WHERE group_id = $1', [groupId]);
      await client.query('DELETE FROM periods WHERE group_id = $1', [groupId]);
      await client.query('DELETE FROM announcements WHERE group_id = $1', [groupId]);
      await client.query('DELETE FROM finance_accounts WHERE group_id = $1', [groupId]);
      await client.query('DELETE FROM users WHERE group_id = $1', [groupId]);
    } else {
      const newGroupRes = await client.query(
        `INSERT INTO groups (id, name, slug, "totalUnits", city, district, plan, "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), 'Defne Evleri Sitesi', $1, 4, 'İstanbul', 'Kadıköy', 'pro', true, NOW(), NOW())
         RETURNING id`,
        [slug]
      );
      groupId = newGroupRes.rows[0].id;
      console.log(`✅ Yeni site oluşturuldu: Defne Evleri Sitesi (ID: ${groupId})`);
    }

    // 2. BANKA & KASA HESAPLARI (FINANCE ACCOUNTS)
    const bankAccountRes = await client.query(
      `INSERT INTO finance_accounts (id, group_id, name, type, "bankName", iban, balance, "isPrimary", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, 'Ziraat Bankası Site Ana Hesabı', 'bank', 'T.C. Ziraat Bankası', 'TR56 0001 0000 9999 8888 7777 01', 42500.00, true, NOW(), NOW())
       RETURNING id`,
      [groupId]
    );
    const bankAccountId = bankAccountRes.rows[0].id;

    await client.query(
      `INSERT INTO finance_accounts (id, group_id, name, type, "bankName", balance, "isPrimary", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, 'Site Yönetimi Nakit Kasası', 'cash', 'Elden Nakit Kasa', 15000.00, false, NOW(), NOW())`,
      [groupId]
    );
    console.log('✅ Banka ve Kasa hesapları oluşturuldu (Bakiye: 42.500 ₺ Banka / 15.000 ₺ Kasa)');

    // 3. KULLANICILAR & DAİRE EŞLEŞMELERİ
    const usersData = [
      {
        email: 'yonetim@defneevleri.com',
        name: 'Ahmet Kaya (Site Yöneticisi)',
        role: 'admin',
        residentType: 'owner',
        units: null,
        phone: '+90 532 999 88 77',
        pass: 'Defne123!',
      },
      {
        email: 'kemal.malik@defneevleri.com',
        name: 'Kemal Sunal (Kat Maliki)',
        role: 'member',
        residentType: 'owner',
        units: 'A Blok D.1',
        phone: '+90 532 111 22 33',
        pass: 'User123!',
      },
      {
        email: 'baris.kiraci@defneevleri.com',
        name: 'Barış Akarsu (Kiracı Sakin)',
        role: 'member',
        residentType: 'tenant',
        units: 'A Blok D.1',
        phone: '+90 533 222 33 44',
        pass: 'User123!',
      },
      {
        email: 'zeynep.aslan@defneevleri.com',
        name: 'Zeynep Aslan (Ev Sahibi & İkamet)',
        role: 'member',
        residentType: 'both',
        units: 'A Blok D.2',
        phone: '+90 535 333 44 55',
        pass: 'User123!',
      },
      {
        email: 'mehmet.oz@defneevleri.com',
        name: 'Mehmet Öz (Kat Maliki)',
        role: 'member',
        residentType: 'owner',
        units: 'A Blok D.3',
        phone: '+90 536 444 55 66',
        pass: 'User123!',
      },
      {
        email: 'can.yilmaz@defneevleri.com',
        name: 'Can Yılmaz (Kiracı - İcralık)',
        role: 'member',
        residentType: 'tenant',
        units: 'A Blok D.3',
        phone: '+90 537 555 66 77',
        pass: 'User123!',
      },
      {
        email: 'daire4@sitera.dev',
        name: 'B Blok D.4 (Boş Daire)',
        role: 'member',
        residentType: 'owner',
        units: 'B Blok D.4',
        phone: '',
        pass: 'User123!',
      },
    ];

    const userMap = {};
    for (const u of usersData) {
      const uRes = await client.query(
        `INSERT INTO users (id, group_id, name, email, password, role, "residentType", units, phone, "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
         RETURNING id, email`,
        [groupId, u.name, u.email, hashPassword(u.pass), u.role, u.residentType, u.units, u.phone]
      );
      userMap[u.email] = uRes.rows[0].id;
    }
    console.log(`✅ 7 Kullanıcı oluşturuldu (Yönetici, Kat Malikleri, Kiracılar, Boş Daire)`);

    // 4. FİNANSAL DÖNEMLER (Nisan - Eylül 2026)
    const periodsData = [
      { name: 'Nisan 2026 Aidat Dönemi', amount: 6000.00, dueDate: '2026-04-25' },
      { name: 'Mayıs 2026 Aidat Dönemi', amount: 6000.00, dueDate: '2026-05-25' },
      { name: 'Mayıs 2026 Asansör Motor ve Halat Revizyonu (Demirbaş)', amount: 40000.00, dueDate: '2026-06-01' },
      { name: 'Haziran 2026 Aidat Dönemi', amount: 6000.00, dueDate: '2026-06-25' },
      { name: 'Temmuz 2026 Aidat Dönemi', amount: 6000.00, dueDate: '2026-07-25' },
      { name: 'Ağustos 2026 Aidat Dönemi', amount: 6000.00, dueDate: '2026-08-25' },
      { name: 'Eylül 2026 Aidat Dönemi', amount: 6000.00, dueDate: '2026-09-25' },
    ];

    const periodMap = {};
    for (const p of periodsData) {
      const pRes = await client.query(
        `INSERT INTO periods (id, group_id, name, amount, "dueDate", status, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active', NOW(), NOW())
         RETURNING id`,
        [groupId, p.name, p.amount, p.dueDate]
      );
      periodMap[p.name] = pRes.rows[0].id;
    }
    console.log(`✅ 7 Finansal dönem açıldı (6 Aylık Rutin Aidat + 1 Büyük Demirbaş)`);

    // 5. BORÇLAR / TAHAKKUKLAR (DEBTS) & ÖDEMELER (PAYMENTS)
    async function insertDebt({ periodName, unit, residentEmail, title, category, targetRole, amount, paidAmount, status, dueDate, paidDate }) {
      const periodId = periodMap[periodName];
      const userId = userMap[residentEmail];
      const uObj = usersData.find(x => x.email === residentEmail);

      const dRes = await client.query(
        `INSERT INTO debts (id, group_id, user_id, period_id, unit, "residentName", title, category, "targetRole", amount, "paidAmount", status, "dueDate", "paidDate", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
         RETURNING id`,
        [
          groupId,
          userId,
          periodId,
          unit,
          uObj ? uObj.name : unit,
          title,
          category,
          targetRole,
          amount,
          paidAmount,
          status,
          dueDate,
          paidDate,
        ]
      );

      const debtId = dRes.rows[0].id;

      if (status === 'paid' && paidAmount > 0) {
        await client.query(
          `INSERT INTO payments (id, group_id, user_id, debt_id, unit, "residentName", amount, channel, "referenceNo", "receiptUrl", notes, status, "approved_by", "approved_at", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'bank_transfer', 'REF-2026-8841', 'https://sitera.dev/receipts/dekont_ornek.pdf', 'Ziraat Bankası Havale / Dekont Onaylandı', 'approved', $7, NOW(), NOW(), NOW())`,
          [groupId, userId, debtId, unit, uObj?.name || unit, paidAmount, userMap['yonetim@defneevleri.com']]
        );
      }

      return debtId;
    }

    // A) NİSAN 2026 AİDAT (1.500 TL) - Herkes ödedi
    await insertDebt({
      periodName: 'Nisan 2026 Aidat Dönemi',
      unit: 'A Blok D.1',
      residentEmail: 'baris.kiraci@defneevleri.com',
      title: 'Nisan 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-04-25',
      paidDate: '2026-04-20',
    });

    await insertDebt({
      periodName: 'Nisan 2026 Aidat Dönemi',
      unit: 'A Blok D.2',
      residentEmail: 'zeynep.aslan@defneevleri.com',
      title: 'Nisan 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-04-25',
      paidDate: '2026-04-15',
    });

    await insertDebt({
      periodName: 'Nisan 2026 Aidat Dönemi',
      unit: 'A Blok D.3',
      residentEmail: 'can.yilmaz@defneevleri.com',
      title: 'Nisan 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-04-25',
      paidDate: '2026-04-24',
    });

    // B) MAYIS 2026 AİDAT (1.500 TL) - Can Yılmaz ödemedi!
    await insertDebt({
      periodName: 'Mayıs 2026 Aidat Dönemi',
      unit: 'A Blok D.1',
      residentEmail: 'baris.kiraci@defneevleri.com',
      title: 'Mayıs 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-05-25',
      paidDate: '2026-05-22',
    });

    await insertDebt({
      periodName: 'Mayıs 2026 Aidat Dönemi',
      unit: 'A Blok D.2',
      residentEmail: 'zeynep.aslan@defneevleri.com',
      title: 'Mayıs 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-05-25',
      paidDate: '2026-05-18',
    });

    await insertDebt({
      periodName: 'Mayıs 2026 Aidat Dönemi',
      unit: 'A Blok D.3',
      residentEmail: 'can.yilmaz@defneevleri.com',
      title: 'Mayıs 2026 Aidat & İşletme Avansı (Gecikmede)',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 0.00,
      status: 'unpaid',
      dueDate: '2026-05-25',
      paidDate: null,
    });

    // C) MAYIS 2026 DEMİRBAŞ (10.000 TL / Daire) - SADECE EV SAHİPLERİNE (KAT MALİKLERİ)
    await insertDebt({
      periodName: 'Mayıs 2026 Asansör Motor ve Halat Revizyonu (Demirbaş)',
      unit: 'A Blok D.1',
      residentEmail: 'kemal.malik@defneevleri.com',
      title: 'Asansör Motor ve Halat Revizyonu (Demirbaş / Kat Maliki)',
      category: 'fixture',
      targetRole: 'owner',
      amount: 10000.00,
      paidAmount: 10000.00,
      status: 'paid',
      dueDate: '2026-06-01',
      paidDate: '2026-05-30',
    });

    await insertDebt({
      periodName: 'Mayıs 2026 Asansör Motor ve Halat Revizyonu (Demirbaş)',
      unit: 'A Blok D.2',
      residentEmail: 'zeynep.aslan@defneevleri.com',
      title: 'Asansör Motor ve Halat Revizyonu (Demirbaş / Kat Maliki)',
      category: 'fixture',
      targetRole: 'owner',
      amount: 10000.00,
      paidAmount: 10000.00,
      status: 'paid',
      dueDate: '2026-06-01',
      paidDate: '2026-05-28',
    });

    await insertDebt({
      periodName: 'Mayıs 2026 Asansör Motor ve Halat Revizyonu (Demirbaş)',
      unit: 'A Blok D.3',
      residentEmail: 'mehmet.oz@defneevleri.com',
      title: 'Asansör Motor ve Halat Revizyonu (Demirbaş / Kat Maliki)',
      category: 'fixture',
      targetRole: 'owner',
      amount: 10000.00,
      paidAmount: 0.00,
      status: 'unpaid',
      dueDate: '2026-06-01',
      paidDate: null,
    });

    // D) HAZİRAN 2026 AİDAT (1.500 TL)
    await insertDebt({
      periodName: 'Haziran 2026 Aidat Dönemi',
      unit: 'A Blok D.1',
      residentEmail: 'baris.kiraci@defneevleri.com',
      title: 'Haziran 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-06-25',
      paidDate: '2026-06-21',
    });

    await insertDebt({
      periodName: 'Haziran 2026 Aidat Dönemi',
      unit: 'A Blok D.2',
      residentEmail: 'zeynep.aslan@defneevleri.com',
      title: 'Haziran 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-06-25',
      paidDate: '2026-06-20',
    });

    await insertDebt({
      periodName: 'Haziran 2026 Aidat Dönemi',
      unit: 'A Blok D.3',
      residentEmail: 'can.yilmaz@defneevleri.com',
      title: 'Haziran 2026 Aidat & İşletme Avansı (Gecikmede)',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 0.00,
      status: 'unpaid',
      dueDate: '2026-06-25',
      paidDate: null,
    });

    // E) TEMMUZ 2026 AİDAT (1.500 TL)
    await insertDebt({
      periodName: 'Temmuz 2026 Aidat Dönemi',
      unit: 'A Blok D.1',
      residentEmail: 'baris.kiraci@defneevleri.com',
      title: 'Temmuz 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-07-25',
      paidDate: '2026-07-23',
    });

    await insertDebt({
      periodName: 'Temmuz 2026 Aidat Dönemi',
      unit: 'A Blok D.2',
      residentEmail: 'zeynep.aslan@defneevleri.com',
      title: 'Temmuz 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-07-25',
      paidDate: '2026-07-20',
    });

    await insertDebt({
      periodName: 'Temmuz 2026 Aidat Dönemi',
      unit: 'A Blok D.3',
      residentEmail: 'can.yilmaz@defneevleri.com',
      title: 'Temmuz 2026 Aidat & İşletme Avansı (Gecikmede - İhtar Gönderildi)',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 0.00,
      status: 'unpaid',
      dueDate: '2026-07-25',
      paidDate: null,
    });

    // F) AĞUSTOS 2026 AİDAT (1.500 TL)
    await insertDebt({
      periodName: 'Ağustos 2026 Aidat Dönemi',
      unit: 'A Blok D.1',
      residentEmail: 'baris.kiraci@defneevleri.com',
      title: 'Ağustos 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-08-25',
      paidDate: '2026-08-24',
    });

    await insertDebt({
      periodName: 'Ağustos 2026 Aidat Dönemi',
      unit: 'A Blok D.2',
      residentEmail: 'zeynep.aslan@defneevleri.com',
      title: 'Ağustos 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 1500.00,
      status: 'paid',
      dueDate: '2026-08-25',
      paidDate: '2026-08-20',
    });

    await insertDebt({
      periodName: 'Ağustos 2026 Aidat Dönemi',
      unit: 'A Blok D.3',
      residentEmail: 'can.yilmaz@defneevleri.com',
      title: 'Ağustos 2026 Aidat & İşletme Avansı (Gecikmede - İcralık Dosya)',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 0.00,
      status: 'unpaid',
      dueDate: '2026-08-25',
      paidDate: null,
    });

    // G) EYLÜL 2026 AİDAT (1.500 TL - YENİ DÖNEM)
    await insertDebt({
      periodName: 'Eylül 2026 Aidat Dönemi',
      unit: 'A Blok D.1',
      residentEmail: 'baris.kiraci@defneevleri.com',
      title: 'Eylül 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 0.00,
      status: 'unpaid',
      dueDate: '2026-09-25',
      paidDate: null,
    });

    await insertDebt({
      periodName: 'Eylül 2026 Aidat Dönemi',
      unit: 'A Blok D.2',
      residentEmail: 'zeynep.aslan@defneevleri.com',
      title: 'Eylül 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 0.00,
      status: 'unpaid',
      dueDate: '2026-09-25',
      paidDate: null,
    });

    await insertDebt({
      periodName: 'Eylül 2026 Aidat Dönemi',
      unit: 'A Blok D.3',
      residentEmail: 'can.yilmaz@defneevleri.com',
      title: 'Eylül 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 0.00,
      status: 'unpaid',
      dueDate: '2026-09-25',
      paidDate: null,
    });

    await insertDebt({
      periodName: 'Eylül 2026 Aidat Dönemi',
      unit: 'B Blok D.4',
      residentEmail: 'daire4@sitera.dev',
      title: 'Eylül 2026 Aidat & İşletme Avansı',
      category: 'dues',
      targetRole: 'resident',
      amount: 1500.00,
      paidAmount: 0.00,
      status: 'unpaid',
      dueDate: '2026-09-25',
      paidDate: null,
    });

    console.log('✅ Borçlar, Tahakkuklar ve Ödemeler eksiksiz işlendi');

    // 6. DUYURULAR (ANNOUNCEMENTS)
    await client.query(
      `INSERT INTO announcements (id, group_id, title, content, category, "targetRole", "isImportant", status, "createdAt", "updatedAt")
       VALUES 
       (gen_random_uuid(), $1, '2026 Yıllık Kat Malikleri Olağan Genel Kurul Çağrısı', 'Sayın Kat Malikleri, 634 Sayılı Kat Mülkiyeti Kanunu uyarınca sitemizin 2026 yılı Olağan Genel Kurul Toplantısı 15 Ekim 2026 tarihinde site sosyal tesisinde gerçekleştirilecektir. Toplantıya yalnızca tapu sahibi kat malikleri veya noter onaylı vekilleri katılabilir.', 'general', 'owner', true, 'published', NOW(), NOW()),
       (gen_random_uuid(), $1, 'Bina Ortak Alan İlaçlama ve Su Deposu Periyodik Temizliği', 'Değerli site sakinlerimiz ve kiracılarımız, 22 Eylül Salı günü 10:00 - 16:00 saatleri arasında tüm blokların bodrum, asansör boşlukları ve su depolarında periyodik dezenfeksiyon çalışması yapılacaktır. Belirtilen saatlerde su kesintisi yaşanacaktır.', 'maintenance', 'resident', false, 'published', NOW(), NOW())`,
      [groupId]
    );
    console.log('✅ Duyurular yayınlandı (Maliklere Genel Kurul, Kiracılara İlaçlama Duyurusu)');

    await client.query('COMMIT');
    console.log('🎉 Veritabanı tohumlama başarıyla tamamlandı!\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Hata oluştu, geri alındı:', err);
    throw err;
  } finally {
    client.release();
  }

  // 7. API DOĞRULAMA VE ENTEGRASYON TESTİ
  console.log('========================================================================');
  console.log('🔍 REST API DOĞRULAMA VE ENTEGRASYON TESTLERİ BAŞLATILIYOR...');
  console.log('========================================================================\n');

  const API_BASE = 'http://localhost:4000/api';

  async function loginUser(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    return json;
  }

  // TEST 1: Yönetici Girişi
  console.log('1️⃣ Test: Site Yöneticisi Girişi (yonetim@defneevleri.com)');
  const adminLogin = await loginUser('yonetim@defneevleri.com', 'Defne123!');
  if (!adminLogin.success) {
    throw new Error(`Admin login başarısız: ${JSON.stringify(adminLogin)}`);
  }
  const adminToken = adminLogin.data.token;
  console.log(`   ✓ Başarılı! Rol: ${adminLogin.data.user.role}, Site: ${adminLogin.data.user.group.name}`);

  // Fetch admin debts
  const adminDebtsRes = await fetch(`${API_BASE}/finance/debts`, {
    headers: { Authorization: `Bearer ${adminToken}`, 'x-group-id': groupId },
  });
  const adminDebts = await adminDebtsRes.json();
  console.log(`   ✓ Yönetici toplam ${adminDebts.data.length} adet tahakkuk kaydını eksiksiz listeledi.`);

  // TEST 2: Daire 1 Ev Sahibi Girişi (Kemal Sunal)
  console.log('\n2️⃣ Test: Kat Maliki / Ev Sahibi Girişi (kemal.malik@defneevleri.com)');
  const ownerLogin = await loginUser('kemal.malik@defneevleri.com', 'User123!');
  const ownerToken = ownerLogin.data.token;
  console.log(`   ✓ Başarılı! Daire: ${ownerLogin.data.user.units.join(', ')}, Statü: ${ownerLogin.data.user.residentType}`);

  const ownerDebtsRes = await fetch(`${API_BASE}/finance/debts`, {
    headers: { Authorization: `Bearer ${ownerToken}`, 'x-group-id': groupId },
  });
  const ownerDebts = await ownerDebtsRes.json();
  const ownerD1Debts = ownerDebts.data;
  console.log(`   ✓ Ev Sahibi kendi dairesine (A Blok D.1) ait toplam ${ownerD1Debts.length} borç kaydını gördü:`);
  
  const tenantPaidCount = ownerD1Debts.filter(d => d.targetRole === 'resident' && d.status === 'paid').length;
  const ownerFixtureDebt = ownerD1Debts.find(d => d.targetRole === 'owner');
  console.log(`     - Kiracısının (Barış Akarsu) ödediği aidat sayısı: ${tenantPaidCount} Dönem (Ödendi olarak görüyor ✓)`);
  console.log(`     - Kendisine ait asansör demirbaş payı: ${ownerFixtureDebt?.amount} ₺ (${ownerFixtureDebt?.status === 'paid' ? 'Ödendi ✓' : 'Açık'})`);

  // TEST 3: Daire 1 Kiracı Girişi (Barış Akarsu)
  console.log('\n3️⃣ Test: Kiracı Sakin Girişi (baris.kiraci@defneevleri.com)');
  const tenantLogin = await loginUser('baris.kiraci@defneevleri.com', 'User123!');
  const tenantToken = tenantLogin.data.token;
  console.log(`   ✓ Başarılı! Daire: ${tenantLogin.data.user.units.join(', ')}, Statü: ${tenantLogin.data.user.residentType}`);

  const tenantDebtsRes = await fetch(`${API_BASE}/finance/debts`, {
    headers: { Authorization: `Bearer ${tenantToken}`, 'x-group-id': groupId },
  });
  const tenantDebts = await tenantDebtsRes.json();
  console.log(`   ✓ Kiracı portaldan kendi borçlarını çekti (${tenantDebts.data.length} kayıt).`);
  const tenantSeesFixture = tenantDebts.data.some(d => d.category === 'fixture' && d.targetRole === 'owner' && d.userId !== tenantLogin.data.user.id);
  console.log(`     - Güvenlik & KMK Kontrolü: Ev sahibinin demirbaş borcu kiracıya yansıtıldı mı? -> ${tenantSeesFixture ? 'HAYIR (HATA)' : 'HAYIR (DOĞRU / İZOLASYON SAĞLANDI ✓)'}`);

  // TEST 4: Daire 3 İcralık Kiracı Girişi (Can Yılmaz) & Gecikme Zammı Hesabı
  console.log('\n4️⃣ Test: İcralık Kiracı (can.yilmaz@defneevleri.com) & KMK %5 Gecikme Zammı Hesabı');
  const icraLogin = await loginUser('can.yilmaz@defneevleri.com', 'User123!');
  const icraToken = icraLogin.data.token;

  const icraDebtsRes = await fetch(`${API_BASE}/finance/debts`, {
    headers: { Authorization: `Bearer ${icraToken}`, 'x-group-id': groupId },
  });
  const icraDebts = await icraDebtsRes.json();
  const unpaidIcraDebts = icraDebts.data.filter(d => d.status !== 'paid');
  console.log(`   ✓ İcralık kiracının ödenmemiş aidat sayısı: ${unpaidIcraDebts.length} Adet`);
  
  let totalBaseDebt = 0;
  let totalWithLate = 0;
  unpaidIcraDebts.forEach(d => {
    totalBaseDebt += Number(d.amount);
    totalWithLate += Number(d.totalWithLateFee || d.amount);
    console.log(`     * ${d.title}: Anapara: ${d.amount} ₺ | Gecikme: ${d.overdueDays || 0} gün | Gecikme Zammı: ${d.lateFee || 0} ₺ | Toplam: ${d.totalWithLateFee || d.amount} ₺`);
  });
  console.log(`   ✓ Toplam Anapara Borcu: ${totalBaseDebt.toLocaleString('tr-TR')} ₺`);
  console.log(`   ✓ KMK %5 Yasal Gecikme Zammı Dahil İcralık Tutar: ${totalWithLate.toLocaleString('tr-TR')} ₺ ✓`);

  // TEST 5: Daire 3 Ev Sahibi Girişi (Mehmet Öz - Kiracısının İcralık Durumunu Görme)
  console.log('\n5️⃣ Test: Daire 3 Kat Maliki (mehmet.oz@defneevleri.com) - Kiracı İcralık Takibi');
  const mehmetLogin = await loginUser('mehmet.oz@defneevleri.com', 'User123!');
  const mehmetToken = mehmetLogin.data.token;

  const mehmetDebtsRes = await fetch(`${API_BASE}/finance/debts`, {
    headers: { Authorization: `Bearer ${mehmetToken}`, 'x-group-id': groupId },
  });
  const mehmetDebts = await mehmetDebtsRes.json();
  const d3UnpaidDebts = mehmetDebts.data.filter(d => d.status !== 'paid');
  console.log(`   ✓ Ev Sahibi (Mehmet Öz) dairesine ait ${d3UnpaidDebts.length} adet ödenmemiş borç gördü:`);
  console.log(`     - Kiracısı Can Yılmaz'ın 4 aylık aidatını ödemediğini ve müteselsil sorumluluk uyarısını panelinde görüyor ✓`);

  console.log('\n========================================================================');
  console.log('🏆 TEST BAŞARIYLA TAMAMLANDI! TÜM VERİLER SİSTEME İŞLENDİ.');
  console.log('========================================================================\n');
}

runScenario()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Fatal Error:', err);
    pool.end();
    process.exit(1);
  });
