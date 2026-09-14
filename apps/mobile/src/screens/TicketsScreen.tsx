import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';
import { TicketItem, apiCreateTicket, apiUpdateTicketStatus, UserProfile } from '../api/client';

interface TicketsScreenProps {
  tickets: TicketItem[];
  user?: UserProfile;
  onRefresh: () => void;
  refreshing: boolean;
  onTicketCreated: (ticket: TicketItem) => void;
}

const CATEGORIES = [
  'Asansör & Elektrik',
  'Sıhhi Tesisat',
  'Güvenlik & Kapı',
  'Temizlik & Hijyen',
  'Peyzaj & Bahçe',
  'Ortak Alan & Demirbaş',
  'Diğer',
];

export const TicketsScreen: React.FC<TicketsScreenProps> = ({
  tickets,
  user,
  onRefresh,
  refreshing,
  onTicketCreated,
}) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [isCreatingView, setIsCreatingView] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen talep başlığı ve açıklamasını yazınız.');
      return;
    }

    try {
      setSubmitting(true);
      const newTicket = await apiCreateTicket({
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
      });
      setSubmitting(false);

      onTicketCreated(newTicket);
      setIsCreatingView(false);
      setTitle('');
      setDescription('');
      Alert.alert('✅ Talep Veritabanına Kaydedildi', 'Talebiniz başarıyla PostgreSQL veritabanına işlendi ve web yönetim paneline iletildi.');
      onRefresh();
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert('Hata', err.message || 'Talep veritabanına kaydedilemedi.');
    }
  };

  const handleStatusChange = async (ticket: TicketItem, newStatus: 'in_progress' | 'resolved' | 'closed') => {
    await apiUpdateTicketStatus(ticket.id, newStatus);
    Alert.alert('✅ Durum Güncellendi', `Talep durumu "${newStatus === 'resolved' ? 'Çözüldü' : 'İnceleniyor'}" olarak güncellendi.`);
    onRefresh();
  };

  // ==========================================================================
  // NEW FULL PAGE: Create Ticket View (NO MODAL)
  // ==========================================================================
  if (isCreatingView) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formPageContent}>
        {/* Back navigation header */}
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setIsCreatingView(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Taleplere Dön</Text>
          </TouchableOpacity>
        </View>

        <Header
          title="Yeni Arıza & Destek Talebi"
          subtitle="Site yönetimine ve teknik birime anında iletilir"
        />

        <Card style={styles.formCard}>
          <Text style={styles.inputLabel}>TALEP KATEGORİSİ</Text>
          <View style={styles.catRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, isSelected && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>TALEP BAŞLIĞI</Text>
          <TextInput
            style={styles.input}
            placeholder="Kısa ve açıklayıcı başlık (örn: Asansör arızası)"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.inputLabel}>DETAYLI AÇIKLAMA</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Arızanın konumu, kat bilgisi veya detayları..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
          />

          <View style={styles.locationInfoBox}>
            <Text style={styles.locationInfoText}>
              🏠 Bildirim Yapan Daire: <Text style={styles.boldWhite}>{user?.flatNo || 'Daire 1'}</Text>
            </Text>
            <Text style={styles.locationInfoText}>
              👤 Talep Sahibi: <Text style={styles.boldWhite}>{user?.name || 'Site Sakini'}</Text>
            </Text>
          </View>

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
              onPress={handleCreate}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitActionBtnText}>Talebi Gönder ✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    );
  }

  // ==========================================================================
  // MAIN PAGE: Tickets List
  // ==========================================================================
  return (
    <View style={styles.container}>
      <Header
        title="Arıza & Destek Talepleri"
        subtitle={isAdmin ? 'Sakinlerden gelen bildirimleri yönetin' : 'Yönetim ve teknik ekibe talep iletin'}
      />

      {/* Top Bar with Add Ticket for Residents */}
      {!isAdmin ? (
        <View style={styles.topBtnContainer}>
          <TouchableOpacity
            style={styles.newTicketBtn}
            onPress={() => setIsCreatingView(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.newTicketText}>+ Yeni Arıza / Talep Bildir</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyText}>Henüz kayıtlı bir destek talebi bulunmuyor.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isResolved = item.status === 'resolved' || item.status === 'closed';
          const isInProgress = item.status === 'in_progress';

          return (
            <Card style={styles.card}>
              <View style={styles.ticketHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.ticketCategory}>{item.category}</Text>
                  <Text style={styles.ticketTitle}>{item.title}</Text>
                </View>
                <Badge
                  label={isResolved ? 'Çözüldü' : isInProgress ? 'İnceleniyor' : 'Açık'}
                  variant={isResolved ? 'success' : isInProgress ? 'primary' : 'warning'}
                />
              </View>

              <Text style={styles.ticketDesc}>{item.description}</Text>

              <View style={styles.ticketFooter}>
                <Text style={styles.metaText}>
                  📅 {item.createdAt} • 🏠 {item.unit || 'Daire'} {item.userName ? `(${item.userName})` : ''}
                </Text>
              </View>

              {/* Admin Quick Action for Tickets */}
              {isAdmin && !isResolved ? (
                <View style={styles.adminActionRow}>
                  {!isInProgress ? (
                    <TouchableOpacity
                      style={[styles.statusBtn, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}
                      onPress={() => handleStatusChange(item, 'in_progress')}
                    >
                      <Text style={[styles.statusBtnText, { color: colors.primaryLight }]}>
                        İncelemeye Al
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}
                    onPress={() => handleStatusChange(item, 'resolved')}
                  >
                    <Text style={[styles.statusBtnText, { color: colors.success }]}>
                      Çözüldü Olarak İşaretle ✓
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
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
  topBtnContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  newTicketBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newTicketText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  ticketCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryLight,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  ticketDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  ticketFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  adminActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
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

  // Full Page New Ticket Styles
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
    padding: 18,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 15, 28, 0.6)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: colors.primary,
  },
  catText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  catTextActive: {
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
    height: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  locationInfoBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    gap: 4,
  },
  locationInfoText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  boldWhite: {
    color: colors.text,
    fontWeight: '700',
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
