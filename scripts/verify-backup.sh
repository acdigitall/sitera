#!/bin/bash
# =============================================================================
# SITERA YEDEK VE KURTARMA DOĞRULAMA TESTİ (DISASTER RECOVERY DRILL TEST)
# =============================================================================
# Bu betik, otomatik bir yedek alır, kriptografik doğruluğunu test eder ve
# felaket kurtarma sürecinin hatasız çalıştığını periyodik olarak teyit eder.
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_BACKUP_DIR="${SCRIPT_DIR}/../backups/drill_test"

echo "🧪 SITERA FELAKET KURTARMA TATBİKATI BAŞLATILIYOR..."

# 1. Test Yedeği Al
BACKUP_DIR="${TEST_BACKUP_DIR}" "${SCRIPT_DIR}/backup.sh"

# 2. Üretilen Yedeği Bul
LATEST_BACKUP=$(ls -t "${TEST_BACKUP_DIR}"/sitera_db_*.sql.gz.enc | head -n 1)

if [ -z "${LATEST_BACKUP}" ]; then
  echo "❌ HATA: Test yedeği üretilemedi!"
  exit 1
fi

echo "🔍 En son üretilen test yedeği: ${LATEST_BACKUP}"

# 3. Geri Yükleme Prosedürünü Doğrula (Dry-Run / Restore)
"${SCRIPT_DIR}/restore.sh" "${LATEST_BACKUP}"

# 4. Tatbikat Dosyalarını Temizle
rm -rf "${TEST_BACKUP_DIR}"

echo "🎉 FELAKET KURTARMA TATBİKATI (DR DRILL) %100 BAŞARIYLA TAMAMLANDI!"
