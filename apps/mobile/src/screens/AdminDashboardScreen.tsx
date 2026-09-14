import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';
import { UserProfile, FinanceSummaryData } from '../api/client';

interface AdminDashboardScreenProps {
  user: UserProfile;
  financeSummary: FinanceSummaryData;
  residentCount: number;
  openTicketCount: number;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  user,
  financeSummary,
  residentCount,
  openTicketCount,
  onNavigateTab,
  onRefresh,
  refreshing,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header
        title={user.groupName || 'alemdarapartmanı'}
        subtitle={`👑 Site Yönetim Paneli • ${user.name}`}
      />

      {/* Top Site Status Banner */}
      <Card highlight style={styles.siteBanner}>
        <View style={styles.siteHeader}>
          <View>
            <Text style={styles.siteBadgeText}>🏢 AKTİF YÖNETİM</Text>
            <Text style={styles.siteTitle}>{user.groupName || 'alemdarapartmanı'}</Text>
          </View>
          <Badge label="24 Daire • Pro" variant="success" />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>{residentCount}</Text>
            <Text style={styles.metricLabel}>Kayıtlı Sakin</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>%{financeSummary.collectionRate}</Text>
            <Text style={styles.metricLabel}>Tahsilat Oranı</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: colors.warning }]}>{openTicketCount}</Text>
            <Text style={styles.metricLabel}>Açık Talep</Text>
          </View>
        </View>
      </Card>

      {/* Quick Action Buttons */}
      <Text style={styles.sectionTitle}>Hızlı Yönetim İşlemleri</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => onNavigateTab('announcements')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Text style={styles.actionIcon}>📢</Text>
          </View>
          <Text style={styles.actionTitle}>Duyuru Yayınla</Text>
          <Text style={styles.actionDesc}>Sakinlere anında ilet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => onNavigateTab('users')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
            <Text style={styles.actionIcon}>👤</Text>
          </View>
          <Text style={styles.actionTitle}>Sakin Ekle</Text>
          <Text style={styles.actionDesc}>Yeni daire kaydı</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => onNavigateTab('finance')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
            <Text style={styles.actionIcon}>💰</Text>
          </View>
          <Text style={styles.actionTitle}>Kasa & Aidat</Text>
          <Text style={styles.actionDesc}>Tahsilat durumu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => onNavigateTab('tickets')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Text style={styles.actionIcon}>🎫</Text>
          </View>
          <Text style={styles.actionTitle}>Arıza & Talep</Text>
          <Text style={styles.actionDesc}>Gelen bildirimler</Text>
        </TouchableOpacity>
      </View>

      {/* Finance Overview Card */}
      <Text style={styles.sectionTitle}>Mali Durum & Bakiye</Text>
      <Card style={styles.financeCard}>
        <View style={styles.financeHeader}>
          <Text style={styles.financeLabel}>KASA & BANKA VARLIĞI</Text>
          <Badge label={financeSummary.activePeriodName || 'Eylül 2026'} variant="primary" />
        </View>
        <Text style={styles.financeAmount}>
          {financeSummary.totalLiquidity.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
        </Text>

        <View style={styles.financeStatsRow}>
          <View style={styles.financeStat}>
            <Text style={styles.statLabel}>Bu Ay Tahsil Edilen:</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              +{financeSummary.totalCollected.toLocaleString('tr-TR')} ₺
            </Text>
          </View>
          <View style={styles.financeStat}>
            <Text style={styles.statLabel}>Bekleyen Aidatlar:</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {financeSummary.totalReceivable.toLocaleString('tr-TR')} ₺
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => onNavigateTab('finance')}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsBtnText}>Tüm Mali Tabloyu İncele →</Text>
        </TouchableOpacity>
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
  siteBanner: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  siteBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryLight,
    letterSpacing: 1,
    marginBottom: 4,
  },
  siteTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(10, 15, 28, 0.6)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: colors.textMuted,
  },
  financeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  financeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  financeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  financeAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  financeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 15, 28, 0.4)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  financeStat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailsBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsBtnText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
});
