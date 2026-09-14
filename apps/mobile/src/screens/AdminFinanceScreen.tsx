import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';
import { FinanceSummaryData } from '../api/client';

interface AdminFinanceScreenProps {
  financeSummary: FinanceSummaryData;
  onRefresh: () => void;
  refreshing: boolean;
}

export const AdminFinanceScreen: React.FC<AdminFinanceScreenProps> = ({
  financeSummary,
  onRefresh,
  refreshing,
}) => {
  const [isRecordingView, setIsRecordingView] = useState(false);
  const [collectorName, setCollectorName] = useState('');
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'transfer'>('cash');

  const handleRecordCollection = () => {
    if (!collectorName.trim() || !collectionAmount.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen sakin adı/daire ve tahsilat tutarını giriniz.');
      return;
    }

    Alert.alert(
      '✅ Tahsilat Kaydedildi',
      `${collectorName} adına ${collectionAmount} ₺ tutarında ${paymentType === 'cash' ? 'nakit' : 'havale'} tahsilat makbuzu oluşturuldu ve kasaya eklendi.`
    );
    setIsRecordingView(false);
    setCollectorName('');
    setCollectionAmount('');
    setCollectionDesc('');
  };

  // ==========================================================================
  // VIEW 1: Full-Page Record Collection (NO MODAL)
  // ==========================================================================
  if (isRecordingView) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formPageContent}>
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setIsRecordingView(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Finans Paneline Dön</Text>
          </TouchableOpacity>
        </View>

        <Header
          title="Nakit / Havale Tahsilatı Gir"
          subtitle="Makbuz kesilir ve anında kasaya işlenir"
        />

        <Card style={styles.formCard}>
          <Text style={styles.inputLabel}>TAHSİLAT TÜRÜ</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, paymentType === 'cash' && styles.typeBtnActive]}
              onPress={() => setPaymentType('cash')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, paymentType === 'cash' && styles.typeBtnTextActive]}>
                💵 Nakit Elden
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, paymentType === 'transfer' && styles.typeBtnActive]}
              onPress={() => setPaymentType('transfer')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, paymentType === 'transfer' && styles.typeBtnTextActive]}>
                🏦 Banka Havalesi / EFT
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>SAKİN ADI VEYA DAİRE NO</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Alperen Alemdar - Daire 1"
            placeholderTextColor={colors.textMuted}
            value={collectorName}
            onChangeText={setCollectorName}
          />

          <Text style={styles.inputLabel}>TAHSİLAT TUTARI (₺)</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 875"
            placeholderTextColor={colors.textMuted}
            value={collectionAmount}
            onChangeText={setCollectionAmount}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>AÇIKLAMA VEYA MAKBUZ NOTU</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Örn: Eylül 2026 Aidatı Elden Teslim Alındı"
            placeholderTextColor={colors.textMuted}
            value={collectionDesc}
            onChangeText={setCollectionDesc}
            multiline
            numberOfLines={3}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelActionBtn}
              onPress={() => setIsRecordingView(false)}
            >
              <Text style={styles.cancelActionBtnText}>Vazgeç</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitActionBtn}
              onPress={handleRecordCollection}
              activeOpacity={0.8}
            >
              <Text style={styles.submitActionBtnText}>Makbuzu Kaydet ✓</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    );
  }

  // ==========================================================================
  // VIEW 2: Main Admin Finance Overview
  // ==========================================================================
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header
        title="Finans & Aidat Yönetimi"
        subtitle="Site kasası, banka hesapları ve tahsilat tablosu"
      />

      {/* Main Liquidity Card */}
      <Card highlight style={styles.mainCard}>
        <Text style={styles.cardLabel}>TOPLAM KASA & BANKA VARLIĞI</Text>
        <Text style={styles.cardAmount}>
          {financeSummary.totalLiquidity.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
        </Text>

        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>Aidat Tahsilat Oranı</Text>
          <Text style={styles.rateVal}>%{financeSummary.collectionRate}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${financeSummary.collectionRate}%` }]} />
        </View>
      </Card>

      {/* Dual Stats */}
      <View style={styles.dualRow}>
        <Card style={styles.dualCard}>
          <Text style={styles.dualLabel}>BU AY TAHSİL EDİLEN</Text>
          <Text style={[styles.dualValue, { color: colors.success }]}>
            {financeSummary.totalCollected.toLocaleString('tr-TR')} ₺
          </Text>
          <Badge label="Makbuzlu" variant="success" />
        </Card>

        <Card style={styles.dualCard}>
          <Text style={styles.dualLabel}>BEKLEYEN ALACAK</Text>
          <Text style={[styles.dualValue, { color: colors.warning }]}>
            {financeSummary.totalReceivable.toLocaleString('tr-TR')} ₺
          </Text>
          <Badge label="Gecikmede" variant="warning" />
        </Card>
      </View>

      {/* Action Button: Opens Full-Page View */}
      <TouchableOpacity
        style={styles.primaryActionBtn}
        onPress={() => setIsRecordingView(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryActionBtnText}>💵 Yeni Tahsilat / Makbuz Girişi</Text>
      </TouchableOpacity>

      {/* Bank Account Info Card */}
      <Text style={styles.sectionTitle}>Resmi Site Banka Hesabı</Text>
      <Card style={styles.bankCard}>
        <View style={styles.bankHeader}>
          <Text style={styles.bankName}>🏦 {financeSummary.bankName || 'Ziraat Bankası'}</Text>
          <Badge label="Doğrulanmış" variant="primary" />
        </View>
        <Text style={styles.holderName}>
          Hesap Sahibi: {financeSummary.accountHolder || 'alemdarapartmanı Yönetimi'}
        </Text>
        <View style={styles.ibanBox}>
          <Text style={styles.ibanLabel}>IBAN NUMARASI:</Text>
          <Text style={styles.ibanText}>{financeSummary.iban}</Text>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rateLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  rateVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dualCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  dualLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  dualValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  bankCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  holderName: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  ibanBox: {
    backgroundColor: 'rgba(10, 15, 28, 0.6)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ibanLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
    marginBottom: 4,
  },
  ibanText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Courier',
    letterSpacing: 0.5,
  },

  // Full-Page Record Collection Styles
  formPageContent: {
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 15, 28, 0.6)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: colors.primary,
  },
  typeBtnText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
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
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  submitActionBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  submitActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
