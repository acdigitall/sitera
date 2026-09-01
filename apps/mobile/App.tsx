import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { User, APP_NAME, formatFullName, formatRoleBadge } from '@sitera/shared';
import { getMobileUsers } from './src/services/api';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await getMobileUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MONOREPO</Text>
        </View>
        <Text style={styles.title}>{APP_NAME} Mobile</Text>
        <Text style={styles.subtitle}>React Native (Expo) & @sitera/shared</Text>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📱 Workspace Senkronizasyonu</Text>
        <Text style={styles.cardDesc}>
          Bu uygulama, NestJS API ve React Web ile aynı DTO ve TypeScript tiplerini paylaşmaktadır.
        </Text>
      </View>

      {/* List Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kullanıcılar ({users.length})</Text>
        <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Yenile</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const roleBadge = formatRoleBadge(item.role);
            return (
              <View style={styles.userCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{formatFullName(item.name)}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: `${roleBadge.color}25` }]}>
                  <Text style={[styles.roleText, { color: roleBadge.color }]}>
                    {roleBadge.label}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d14',
    paddingTop: StatusBar.currentHeight || 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  badge: {
    backgroundColor: '#6366f1',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
    marginVertical: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
  },
  refreshText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
