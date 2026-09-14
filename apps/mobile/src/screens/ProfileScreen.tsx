import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';
import { UserProfile, FinanceSummaryData } from '../api/client';

interface ProfileScreenProps {
  user: UserProfile;
  financeSummary?: FinanceSummaryData;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, financeSummary, onLogout }) => {
  const confirmLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: onLogout },
    ]);
  };

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Profil & Ayarlar" subtitle="Hesap ve site yönetim bilgileri" />

      {/* User Card */}
      <Card highlight style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.badgeRow}>
          <Badge
            label={
              user.role === 'superadmin'
                ? '👑 SÜPER YÖNETİCİ'
                : user.role === 'admin'
                ? '👑 SİTE YÖNETİCİSİ'
                : '🏠 KAT MALİKİ / SAKİN'
            }
            variant={isAdmin ? 'warning' : 'primary'}
          />
        </View>
      </Card>

      {/* Residence / Site Info */}
      <Text style={styles.sectionTitle}>Bağlı Site & Daire Bilgisi</Text>
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Site / Apartman:</Text>
          <Text style={styles.infoValue}>{user.groupName || 'alemdarapartmanı'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Bağımsız Bölüm (Daire):</Text>
          <Text style={styles.infoValue}>
            {user.flatNo || (user.units ? user.units.join(', ') : (isAdmin ? 'Yönetim' : 'Daire 1'))}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kullanıcı Rolü:</Text>
          <Text style={styles.infoValue}>{isAdmin ? 'Yönetim Kurulu Başkanı' : 'Kat Maliki (Ev Sahibi)'}</Text>
        </View>
      </Card>

      {/* Site Management & Emergency Contacts */}
      <Text style={styles.sectionTitle}>Site İletişim Bilgileri</Text>
      <Card style={styles.infoCard}>
        <TouchableOpacity style={styles.contactRow} activeOpacity={0.7}>
          <View style={styles.contactIcon}>
            <Text style={styles.iconText}>👑</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Site Yönetimi (Abdullah Alemdar)</Text>
            <Text style={styles.contactNumber}>0212 456 78 90 • yonetim@alemdar.com</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.contactRow} activeOpacity={0.7}>
          <View style={styles.contactIcon}>
            <Text style={styles.iconText}>🛡️</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Bina Güvenlik & Görevli</Text>
            <Text style={styles.contactNumber}>Dahili: 101 • 0212 456 78 99</Text>
          </View>
        </TouchableOpacity>

        {financeSummary?.iban ? (
          <>
            <View style={styles.divider} />
            <View style={styles.ibanRow}>
              <Text style={styles.ibanLabel}>Site Aidat Hesabı ({financeSummary.bankName || 'Ziraat'}):</Text>
              <Text style={styles.ibanVal}>{financeSummary.iban}</Text>
            </View>
          </>
        ) : null}
      </Card>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={confirmLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Sitera Mobil v1.0.0 • NestJS & PostgreSQL Monorepo</Text>
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
  userCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  badgeRow: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  contactNumber: {
    fontSize: 12,
    color: colors.primaryLight,
    marginTop: 2,
  },
  ibanRow: {
    paddingVertical: 4,
  },
  ibanLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  ibanVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Courier',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    opacity: 0.6,
  },
});
