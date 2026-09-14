import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';
import { DebtItem, apiPayDebt } from '../api/client';

interface FinanceScreenProps {
  debts: DebtItem[];
  onRefresh: () => void;
  refreshing: boolean;
}

export const FinanceScreen: React.FC<FinanceScreenProps> = ({
  debts: initialDebts,
  onRefresh,
  refreshing,
}) => {
  const [debts, setDebts] = useState<DebtItem[]>(initialDebts);
  const [payingDebt, setPayingDebt] = useState<DebtItem | null>(null);
  
  // Payment Form Fields
  const [cardHolder, setCardHolder] = useState('Alperen Alemdar');
  const [cardNumber, setCardNumber] = useState('4543 •••• •••• 9012');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('321');
  const [paying, setPaying] = useState(false);

  const totalPending = debts
    .filter((d) => d.status === 'pending' || d.status === 'overdue')
    .reduce((acc, d) => acc + d.amount, 0);

  const handleConfirmPayment = async () => {
    if (!payingDebt) return;
    setPaying(true);

    await apiPayDebt(payingDebt.id, payingDebt.amount);

    setPaying(false);
    const paidItem = payingDebt;
    setPayingDebt(null);

    // Update local state
    setDebts((prev) =>
      prev.map((d) => (d.id === paidItem.id ? { ...d, status: 'paid' as const } : d))
    );

    Alert.alert(
      '✅ Ödeme Başarılı',
      `${paidItem.periodName} için ${paidItem.amount.toLocaleString('tr-TR')} ₺ tutarındaki aidat ödemeniz başarıyla alındı ve yönetici paneline işlendi.`
    );
    onRefresh();
  };

  // ==========================================================================
  // VIEW 1: Full-Page Secure Payment POS (NO MODAL)
  // ==========================================================================
  if (payingDebt) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.paymentPageContent}>
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setPayingDebt(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Aidat Listesine Dön</Text>
          </TouchableOpacity>
        </View>

        <Header
          title="Güvenli Aidat Ödemesi"
          subtitle="Sitera Sanal POS • 256-Bit SSL Şifreli"
        />

        {/* Debt Details Card */}
        <Card highlight style={styles.summaryBoxCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>ÖDENECEK DÖNEM</Text>
            <Badge label="Aidat" variant="primary" />
          </View>
          <Text style={styles.summaryTitle}>{payingDebt.periodName}</Text>
          <Text style={styles.summaryAmountLarge}>
            {payingDebt.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </Text>
          <Text style={styles.summaryDue}>Son Ödeme: {payingDebt.dueDate}</Text>
        </Card>

        {/* Virtual Credit Card Form */}
        <Card style={styles.paymentFormCard}>
          <Text style={styles.sectionHeading}>Kredi / Banka Kartı Bilgileri</Text>

          <Text style={styles.inputLabel}>KART ÜZERİNDEKİ İSİM</Text>
          <TextInput
            style={styles.input}
            value={cardHolder}
            onChangeText={setCardHolder}
            placeholder="Ad Soyad"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>KART NUMARASI</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />

          <View style={styles.cardDualRow}>
            <View style={styles.cardDualCol}>
              <Text style={styles.inputLabel}>SKT (AY/YIL)</Text>
              <TextInput
                style={styles.input}
                value={expiry}
                onChangeText={setExpiry}
                placeholder="AA/YY"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.cardDualCol}>
              <Text style={styles.inputLabel}>CVV / CVC</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={setCvv}
                placeholder="•••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.sslBadge}>
            <Text style={styles.sslText}>🔒 3D Secure Doğrulama ve BDDK Lisanslı POS</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelActionBtn}
              onPress={() => setPayingDebt(null)}
              disabled={paying}
            >
              <Text style={styles.cancelActionBtnText}>Vazgeç</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.payActionBtn}
              onPress={handleConfirmPayment}
              disabled={paying}
              activeOpacity={0.8}
            >
              {paying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.payActionBtnText}>
                  {payingDebt.amount.toLocaleString('tr-TR')} ₺ Öde ✓
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    );
  }

  // ==========================================================================
  // VIEW 2: Main Finance & Debts List
  // ==========================================================================
  return (
    <View style={styles.container}>
      <Header title="Aidat & Finans" subtitle="Dairenize ait borç ve ödeme geçmişi" />

      {/* Summary Box */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOPLAM BEKLEYEN BORÇ</Text>
          <Text style={[styles.summaryAmount, totalPending > 0 && { color: colors.warning }]}>
            {totalPending.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </Text>
          <Text style={styles.summaryHint}>
            {totalPending > 0
              ? 'Ödemelerinizi gecikme faizi uygulanmadan yapınız.'
              : 'Tüm aidatlarınız düzenli ödenmiştir. Teşekkürler! 🎉'}
          </Text>
        </Card>
      </View>

      <Text style={styles.listTitle}>Dönem Dökümü</Text>

      <FlatList
        data={debts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item }) => {
          const isPaid = item.status === 'paid';
          return (
            <Card style={styles.debtCard}>
              <View style={styles.debtHeader}>
                <Text style={styles.periodName}>{item.periodName}</Text>
                <Badge
                  label={isPaid ? 'Ödendi' : item.status === 'overdue' ? 'Gecikmede' : 'Bekliyor'}
                  variant={isPaid ? 'success' : item.status === 'overdue' ? 'danger' : 'warning'}
                />
              </View>

              <View style={styles.debtBody}>
                <View>
                  <Text style={styles.amountText}>
                    {item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </Text>
                  <Text style={styles.dueText}>
                    {isPaid ? 'Ödeme Alındı ✓' : `Son Gün: ${item.dueDate}`}
                  </Text>
                </View>

                {!isPaid ? (
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => setPayingDebt(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.payBtnText}>Öde →</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.receiptBadge}>
                    <Text style={styles.receiptText}>🧾 Makbuz</Text>
                  </View>
                )}
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginVertical: 4,
  },
  summaryHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  debtCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  periodName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  debtBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  dueText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  payBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  receiptBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  receiptText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },

  // Full Page Payment Styles
  paymentPageContent: {
    padding: 16,
    paddingBottom: 40,
  },
  navHeader: {
    marginBottom: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
  },
  backBtnText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryBoxCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  summaryAmountLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primaryLight,
    marginBottom: 4,
  },
  summaryDue: {
    fontSize: 12,
    color: colors.textMuted,
  },
  paymentFormCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(10, 15, 28, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardDualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardDualCol: {
    flex: 1,
  },
  sslBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
    alignItems: 'center',
  },
  sslText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelActionBtnText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  payActionBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  payActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
