import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { colors } from './src/theme/colors';
import {
  UserProfile,
  AnnouncementItem,
  DebtItem,
  TicketItem,
  FinanceSummaryData,
  apiGetUsers,
  apiGetAnnouncements,
  apiGetDebts,
  apiGetTickets,
  apiGetFinanceSummary,
  setAuthSession,
} from './src/api/client';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { AnnouncementsScreen } from './src/screens/AnnouncementsScreen';
import { TicketsScreen } from './src/screens/TicketsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { AdminUsersScreen } from './src/screens/AdminUsersScreen';
import { AdminFinanceScreen } from './src/screens/AdminFinanceScreen';

type AdminTab = 'admin_dashboard' | 'admin_users' | 'admin_finance' | 'announcements' | 'tickets' | 'profile';
type ResidentTab = 'home' | 'finance' | 'announcements' | 'tickets' | 'profile';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Synchronized Data with Backend
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummaryData>({
    totalLiquidity: 28450,
    totalReceivable: 3500,
    totalCollected: 14200,
    collectionRate: 80,
    activePeriodName: 'Eylül 2026',
    siteName: 'alemdarapartmanı',
    bankName: 'Ziraat Bankası',
    iban: 'TR00 0001 0090 1234 5678 5001',
    accountHolder: 'alemdarapartmanı Yönetimi',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Load all data from real backend
  const loadAllData = useCallback(async () => {
    try {
      const [u, a, d, t, f] = await Promise.all([
        apiGetUsers(),
        apiGetAnnouncements(),
        apiGetDebts(),
        apiGetTickets(),
        apiGetFinanceSummary(),
      ]);

      setUsersList(u);
      setAnnouncements(a);
      setDebts(d);
      setTickets(t);
      setFinanceSummary(f);
    } catch (err) {
      console.warn('Data sync warning:', err);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleLoginSuccess = async (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    const adminRole = loggedInUser.role === 'admin' || loggedInUser.role === 'superadmin';
    setCurrentTab(adminRole ? 'admin_dashboard' : 'home');
    setLoading(true);
    await loadAllData();
    setLoading(false);
  };

  const handleLogout = () => {
    setAuthSession(null, null);
    setUser(null);
    setCurrentTab('home');
  };

  // Render current active screen
  const renderScreen = () => {
    if (!user) return null;

    if (isAdmin) {
      switch (currentTab) {
        case 'admin_dashboard':
          return (
            <AdminDashboardScreen
              user={user}
              financeSummary={financeSummary}
              residentCount={usersList.length}
              openTicketCount={tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          );
        case 'admin_users':
          return (
            <AdminUsersScreen
              users={usersList}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              onUserAdded={(newUser) => setUsersList((prev) => [newUser, ...prev])}
            />
          );
        case 'admin_finance':
          return (
            <AdminFinanceScreen
              financeSummary={financeSummary}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          );
        case 'announcements':
          return (
            <AnnouncementsScreen
              announcements={announcements}
              user={user}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              onAnnouncementCreated={(newAnn) => setAnnouncements((prev) => [newAnn, ...prev])}
            />
          );
        case 'tickets':
          return (
            <TicketsScreen
              tickets={tickets}
              user={user}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              onTicketCreated={(newT) => setTickets((prev) => [newT, ...prev])}
            />
          );
        case 'profile':
          return (
            <ProfileScreen
              user={user}
              financeSummary={financeSummary}
              onLogout={handleLogout}
            />
          );
        default:
          return (
            <AdminDashboardScreen
              user={user}
              financeSummary={financeSummary}
              residentCount={usersList.length}
              openTicketCount={tickets.length}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          );
      }
    }

    // Resident (Member) Screens
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            user={user}
            announcements={announcements}
            debts={debts}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        );
      case 'finance':
        return (
          <FinanceScreen
            debts={debts}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        );
      case 'announcements':
        return (
          <AnnouncementsScreen
            announcements={announcements}
            user={user}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        );
      case 'tickets':
        return (
          <TicketsScreen
            tickets={tickets}
            user={user}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onTicketCreated={(newT) => setTickets((prev) => [newT, ...prev])}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            financeSummary={financeSummary}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <HomeScreen
            user={user}
            announcements={announcements}
            debts={debts}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ExpoStatusBar style="light" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />

      {/* Screen Body */}
      <View style={styles.body}>{renderScreen()}</View>

      {/* Role-Based Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        {isAdmin ? (
          <>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('admin_dashboard')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>📊</Text>
              <Text style={[styles.tabLabel, currentTab === 'admin_dashboard' && styles.tabLabelActive]}>
                Yönetim
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('admin_users')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>👥</Text>
              <Text style={[styles.tabLabel, currentTab === 'admin_users' && styles.tabLabelActive]}>
                Sakinler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('admin_finance')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>💰</Text>
              <Text style={[styles.tabLabel, currentTab === 'admin_finance' && styles.tabLabelActive]}>
                Finans
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('announcements')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>📢</Text>
              <Text style={[styles.tabLabel, currentTab === 'announcements' && styles.tabLabelActive]}>
                Duyurular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('tickets')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>🎫</Text>
              <Text style={[styles.tabLabel, currentTab === 'tickets' && styles.tabLabelActive]}>
                Talepler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>👤</Text>
              <Text style={[styles.tabLabel, currentTab === 'profile' && styles.tabLabelActive]}>
                Profil
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('home')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>🏠</Text>
              <Text style={[styles.tabLabel, currentTab === 'home' && styles.tabLabelActive]}>
                Ana Sayfa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('finance')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>💳</Text>
              <Text style={[styles.tabLabel, currentTab === 'finance' && styles.tabLabelActive]}>
                Aidatlarım
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('announcements')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>📢</Text>
              <Text style={[styles.tabLabel, currentTab === 'announcements' && styles.tabLabelActive]}>
                Duyurular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('tickets')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>🎫</Text>
              <Text style={[styles.tabLabel, currentTab === 'tickets' && styles.tabLabelActive]}>
                Taleplerim
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setCurrentTab('profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>👤</Text>
              <Text style={[styles.tabLabel, currentTab === 'profile' && styles.tabLabelActive]}>
                Profilim
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  body: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primaryLight,
    fontWeight: '800',
  },
});
