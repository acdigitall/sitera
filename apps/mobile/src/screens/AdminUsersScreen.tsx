import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';
import { UserProfile, apiCreateUser } from '../api/client';

interface AdminUsersScreenProps {
  users: UserProfile[];
  onRefresh: () => void;
  refreshing: boolean;
  onUserAdded: (user: UserProfile) => void;
}

export const AdminUsersScreen: React.FC<AdminUsersScreenProps> = ({
  users,
  onRefresh,
  refreshing,
  onUserAdded,
}) => {
  const [search, setSearch] = useState('');
  const [isAddingView, setIsAddingView] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [unit, setUnit] = useState('');
  const [residentType, setResidentType] = useState<'owner' | 'tenant'>('owner');
  const [submitting, setSubmitting] = useState(false);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.flatNo && u.flatNo.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen ad soyad ve e-posta adresini giriniz.');
      return;
    }

    setSubmitting(true);
    const result = await apiCreateUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      units: unit.trim() ? [unit.trim()] : ['Daire ' + (users.length + 1)],
      residentType,
    });
    setSubmitting(false);

    if (result.success && result.user) {
      onUserAdded(result.user);
      setIsAddingView(false);
      setName('');
      setEmail('');
      setPhone('');
      setUnit('');
      Alert.alert('✅ Sakin Eklendi', `${name} başarıyla site sakinleri arasına kaydedildi.`);
      onRefresh();
    } else {
      Alert.alert('İşlem Başarısız', result.message || 'Sakin eklenirken bir hata oluştu.');
    }
  };

  // ==========================================================================
  // VIEW 1: Full-Page Add Resident (NO MODAL)
  // ==========================================================================
  if (isAddingView) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formPageContent}>
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setIsAddingView(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Sakin Listesine Dön</Text>
          </TouchableOpacity>
        </View>

        <Header
          title="Yeni Sakin & Daire Kaydı"
          subtitle="Veritabanına ve web paneline anında işlenir"
        />

        <Card style={styles.formCard}>
          <Text style={styles.inputLabel}>AD SOYAD</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Mehmet Kaya"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.inputLabel}>E-POSTA ADRESİ</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@domain.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>TELEFON NUMARASI</Text>
          <TextInput
            style={styles.input}
            placeholder="5XX XXX XX XX"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>DAİRE / BAĞIMSIZ BÖLÜM</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Daire 5"
            placeholderTextColor={colors.textMuted}
            value={unit}
            onChangeText={setUnit}
          />

          <Text style={styles.inputLabel}>MÜLKİYET DURUMU</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, residentType === 'owner' && styles.typeBtnActive]}
              onPress={() => setResidentType('owner')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, residentType === 'owner' && styles.typeBtnTextActive]}>
                🏠 Kat Maliki (Ev Sahibi)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, residentType === 'tenant' && styles.typeBtnActive]}
              onPress={() => setResidentType('tenant')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, residentType === 'tenant' && styles.typeBtnTextActive]}>
                🔑 Kiracı
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelActionBtn}
              onPress={() => setIsAddingView(false)}
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
                <Text style={styles.submitActionBtnText}>Sakin Kaydet ✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    );
  }

  // ==========================================================================
  // VIEW 2: Main Residents List
  // ==========================================================================
  return (
    <View style={styles.container}>
      <Header
        title="Sakin & Daire Yönetimi"
        subtitle={`Sitede toplam ${users.length} kayıtlı kullanıcı`}
      />

      {/* Search & Add Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="İsim, e-posta veya daire ara..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsAddingView(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Sakin Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>Aranan kriterlere uygun sakin bulunamadı.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isAdmin = item.role === 'admin' || item.role === 'superadmin';
          return (
            <Card style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  {item.phone ? (
                    <Text style={styles.userPhone}>📞 {item.phone}</Text>
                  ) : null}
                </View>
                <Badge
                  label={isAdmin ? 'Yönetici' : 'Sakin'}
                  variant={isAdmin ? 'primary' : 'success'}
                />
              </View>

              <View style={styles.userFooter}>
                <View style={styles.unitBadge}>
                  <Text style={styles.unitText}>
                    🏠 {item.flatNo || (item.units ? item.units.join(', ') : 'Daire Belirtilmemiş')}
                  </Text>
                </View>
                <Text style={styles.typeText}>
                  {item.residentType === 'tenant' ? 'Kiracı' : 'Kat Maliki'}
                </Text>
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
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 11,
    color: colors.primaryLight,
    marginTop: 2,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  unitBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  typeText: {
    fontSize: 12,
    color: colors.textMuted,
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

  // Full-Page Add Resident Styles
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
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
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
