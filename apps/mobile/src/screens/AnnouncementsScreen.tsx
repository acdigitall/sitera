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
import { AnnouncementItem, apiCreateAnnouncement, UserProfile } from '../api/client';

interface AnnouncementsScreenProps {
  announcements: AnnouncementItem[];
  user?: UserProfile;
  onRefresh: () => void;
  refreshing: boolean;
  onAnnouncementCreated?: (item: AnnouncementItem) => void;
}

export const AnnouncementsScreen: React.FC<AnnouncementsScreenProps> = ({
  announcements,
  user,
  onRefresh,
  refreshing,
  onAnnouncementCreated,
}) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [filter, setFilter] = useState<'all' | 'urgent' | 'general'>('all');
  
  // Navigation states instead of modals
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isCreatingView, setIsCreatingView] = useState(false);

  // Admin New Announcement Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'general' | 'urgent' | 'maintenance'>('general');
  const [submitting, setSubmitting] = useState(false);

  const filteredData = announcements.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return item.type === 'urgent';
    return item.type !== 'urgent';
  });

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen duyuru başlığı ve metnini yazınız.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await apiCreateAnnouncement({
        title: newTitle.trim(),
        content: newContent.trim(),
        type: newType,
      });
      setSubmitting(false);

      if (onAnnouncementCreated) {
        onAnnouncementCreated(created);
      }
      setIsCreatingView(false);
      setNewTitle('');
      setNewContent('');
      Alert.alert('📢 Duyuru Yayınlandı', 'Duyuru PostgreSQL veritabanına kaydedildi ve web paneline anında iletildi.');
      onRefresh();
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert('Hata', err.message || 'Duyuru kaydedilemedi.');
    }
  };

  // ==========================================================================
  // VIEW 1: Full-Page Announcement Detail (NO MODAL)
  // ==========================================================================
  if (selectedAnnouncement) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.detailPageContent}>
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedAnnouncement(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Duyuru Listesine Dön</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.detailCard}>
          <View style={styles.detailMetaRow}>
            <Badge
              label={selectedAnnouncement.type === 'urgent' ? 'ACİL DURUM' : 'GENEL DUYURU'}
              variant={selectedAnnouncement.type === 'urgent' ? 'danger' : 'primary'}
            />
            <Text style={styles.detailDate}>{selectedAnnouncement.date}</Text>
          </View>

          <Text style={styles.detailTitle}>{selectedAnnouncement.title}</Text>

          <View style={styles.authorBadgeBox}>
            <Text style={styles.authorBadgeText}>
              👤 Yayınlayan: <Text style={styles.boldWhite}>{selectedAnnouncement.authorName || 'Site Yönetimi'}</Text>
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.detailBodyText}>{selectedAnnouncement.content}</Text>

          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => setSelectedAnnouncement(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.returnBtnText}>Geri Dön</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    );
  }

  // ==========================================================================
  // VIEW 2: Full-Page Create Announcement (NO MODAL)
  // ==========================================================================
  if (isCreatingView) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.detailPageContent}>
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setIsCreatingView(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Duyurulara Dön</Text>
          </TouchableOpacity>
        </View>

        <Header
          title="Yeni Site Duyurusu"
          subtitle="Web paneli ve mobil sakin uygulamasına anında düşer"
        />

        <Card style={styles.formCard}>
          <Text style={styles.inputLabel}>DUYURU TİPİ</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, newType === 'general' && styles.typeBtnActive]}
              onPress={() => setNewType('general')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, newType === 'general' && styles.typeBtnTextActive]}>
                Genel Bilgi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, newType === 'urgent' && styles.typeBtnActiveUrgent]}
              onPress={() => setNewType('urgent')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, newType === 'urgent' && styles.typeBtnTextActive]}>
                ⚠️ Acil Durum
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, newType === 'maintenance' && styles.typeBtnActive]}
              onPress={() => setNewType('maintenance')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, newType === 'maintenance' && styles.typeBtnTextActive]}>
                🔧 Bakım
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>DUYURU BAŞLIĞI</Text>
          <TextInput
            style={styles.input}
            placeholder="Duyuru başlığını giriniz (örn: Hidrofor Bakımı)"
            placeholderTextColor={colors.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <Text style={styles.inputLabel}>DUYURU İÇERİĞİ</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Sakinleri bilgilendirecek metni detaylıca yazınız..."
            placeholderTextColor={colors.textMuted}
            value={newContent}
            onChangeText={setNewContent}
            multiline
            numberOfLines={6}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelActionBtn}
              onPress={() => setIsCreatingView(false)}
              disabled={submitting}
            >
              <Text style={styles.cancelActionBtnText}>Vazgeç</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitActionBtn}
              onPress={handleCreateAnnouncement}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitActionBtnText}>Duyuruyu Yayınla ✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    );
  }

  // ==========================================================================
  // VIEW 3: Main Announcements List
  // ==========================================================================
  return (
    <View style={styles.container}>
      <Header
        title="Duyurular & Bildirimler"
        subtitle="Site yönetiminden güncel bilgilendirmeler"
      />

      {/* Filter Tabs + Admin Add Button */}
      <View style={styles.topActionRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Tümü ({announcements.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'urgent' && styles.filterChipActive]}
            onPress={() => setFilter('urgent')}
          >
            <Text style={[styles.filterText, filter === 'urgent' && styles.filterTextActive]}>
              ⚠️ Acil ({announcements.filter((a) => a.type === 'urgent').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'general' && styles.filterChipActive]}
            onPress={() => setFilter('general')}
          >
            <Text style={[styles.filterText, filter === 'general' && styles.filterTextActive]}>
              Genel Bilgi
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {isAdmin ? (
          <TouchableOpacity
            style={styles.adminAddBtn}
            onPress={() => setIsCreatingView(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.adminAddBtnText}>+ Duyuru</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>Henüz yayınlanmış bir duyuru bulunmuyor.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUrgent = item.type === 'urgent';
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedAnnouncement(item)}
            >
              <Card style={[styles.card, isUrgent && styles.urgentCard]}>
                <View style={styles.cardHeader}>
                  <Badge
                    label={isUrgent ? 'ACİL DURUM' : item.type === 'maintenance' ? 'BAKIM' : 'GENEL'}
                    variant={isUrgent ? 'danger' : 'primary'}
                  />
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSnippet} numberOfLines={2}>
                  {item.content}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.authorText}>👤 {item.authorName || 'Site Yönetimi'}</Text>
                  <Text style={styles.readMoreText}>Detayı Oku →</Text>
                </View>
              </Card>
            </TouchableOpacity>
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
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  adminAddBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  adminAddBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  urgentCard: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  cardSnippet: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  authorText: {
    fontSize: 11,
    color: colors.primaryLight,
  },
  readMoreText: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },

  // Full-Page Detail & Create Styles
  detailPageContent: {
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
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 28,
    marginBottom: 12,
  },
  authorBadgeBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
  },
  authorBadgeText: {
    fontSize: 12,
    color: colors.primaryLight,
  },
  boldWhite: {
    color: colors.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  detailBodyText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  returnBtn: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  returnBtnText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },

  // Form Styles for Create
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
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    height: 40,
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
  typeBtnActiveUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: colors.danger,
  },
  typeBtnText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#fff',
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
    height: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
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
