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
import { UserProfile, AnnouncementItem, DebtItem } from '../api/client';

interface HomeScreenProps {
  user: UserProfile;
  announcements: AnnouncementItem[];
  debts: DebtItem[];
  onNavigateTab: (tab: 'home' | 'finance' | 'announcements' | 'tickets' | 'profile') => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  announcements,
  debts,
  onNavigateTab,
  onRefresh,
  refreshing,
}) => {
  const latestAnnouncement = announcements[0];
  const pendingDebts = debts.filter((d) => d.status === 'pending' || d.status === 'overdue');
  const totalPendingAmount = pendingDebts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Top Welcome Bar */}
      <View style={styles.userBar}>
        <View>
          <Text style={styles.greetingText}>Merhaba,</Text>
          <Text style={styles.userNameText}>{user.name}</Text>
          <Text style={styles.siteInfoText}>
            🏢 {user.groupName || 'alemdarapartmanı'} • {user.flatNo || 'Daire 1, Daire 4'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileAvatar} onPress={() => onNavigateTab('profile')}>
          <Text style={styles.avatarLetter}>{user.name.charAt(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* Finans Özeti / Borç Kartı */}
      <Card highlight style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>GÜNCEL AİDAT BORCUNUZ</Text>
          <Badge
            label={totalPendingAmount > 0 ? 'Bekleyen Ödeme' : 'Borç Yok'}
            variant={totalPendingAmount > 0 ? 'warning' : 'success'}
          />
        </View>
        <Text style={styles.balanceAmount}>
          {totalPendingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
        </Text>
        <Text style={styles.dueDateText}>
          {totalPendingAmount > 0 ? 'Son Ödeme: 25 Eylül 2026' : 'Tüm aidatlarınız günceldir ✓'}
        </Text>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => onNavigateTab('finance')}
            activeOpacity={0.8}
          >
            <Text style={styles.payBtnText}>💳 Aidat Detayı & Sanal POS ile Öde</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => onNavigateTab('tickets')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Text style={styles.icon}>🛠️</Text>
          </View>
          <Text style={styles.quickTitle}>Arıza / Talep Bildir</Text>
          <Text style={styles.quickSub}>Yönetime ilet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => onNavigateTab('announcements')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
            <Text style={styles.icon}>📢</Text>
          </View>
          <Text style={styles.quickTitle}>Duyurular</Text>
          <Text style={styles.quickSub}>{announcements.length} yeni duyuru</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => onNavigateTab('finance')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
            <Text style={styles.icon}>🧾</Text>
          </View>
          <Text style={styles.quickTitle}>Ödeme Geçmişi</Text>
          <Text style={styles.quickSub}>Makbuz dökümü</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => onNavigateTab('profile')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Text style={styles.icon}>📞</Text>
          </View>
          <Text style={styles.quickTitle}>Yönetim İletişim</Text>
          <Text style={styles.quickSub}>Güvenlik & Yönetici</Text>
        </TouchableOpacity>
      </View>

      {/* Latest Announcement Widget */}
      {latestAnnouncement ? (
        <View style={styles.announcementSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Site Duyurusu</Text>
            <TouchableOpacity onPress={() => onNavigateTab('announcements')}>
              <Text style={styles.seeAllText}>Tümü →</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.announcementCard}>
            <View style={styles.announcementHeader}>
              <Badge
                label={latestAnnouncement.type === 'urgent' ? 'ACİL' : 'DUYURU'}
                variant={latestAnnouncement.type === 'urgent' ? 'danger' : 'primary'}
              />
              <Text style={styles.announcementDate}>{latestAnnouncement.date}</Text>
            </View>
            <Text style={styles.announcementTitle}>{latestAnnouncement.title}</Text>
            <Text style={styles.announcementSnippet} numberOfLines={2}>
              {latestAnnouncement.content}
            </Text>
          </Card>
        </View>
      ) : null}
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
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greetingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  siteInfoText: {
    fontSize: 12,
    color: colors.primaryLight,
    marginTop: 2,
    fontWeight: '600',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: colors.primaryLight,
    fontSize: 18,
    fontWeight: '800',
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickBtn: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 20,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  quickSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  announcementSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAllText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  announcementCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  announcementSnippet: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
