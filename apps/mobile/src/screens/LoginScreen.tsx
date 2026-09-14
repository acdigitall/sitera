import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { apiLogin, UserProfile } from '../api/client';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('yonetim@alemdar.com');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Lütfen e-posta ve şifrenizi girin');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const result = await apiLogin(email, password);
    setLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.message || 'Giriş yapılamadı');
    }
  };

  const fillCredentials = (type: 'admin' | 'resident' | 'superadmin') => {
    if (type === 'admin') {
      setEmail('yonetim@alemdar.com');
      setPassword('Admin123!');
    } else if (type === 'resident') {
      setEmail('alperen@gmail.com');
      setPassword('User123!');
    } else {
      setEmail('admin@sitera.com');
      setPassword('Admin123!');
    }
    setErrorMsg(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🏢</Text>
          </View>
          <Text style={styles.brandTitle}>SITERA</Text>
          <Text style={styles.brandSubtitle}>Akıllı Site & Yaşam Portalı</Text>
          <View style={styles.dbBadge}>
            <Text style={styles.dbBadgeText}>⚡ PostgreSQL RLS & NestJS Canlı API</Text>
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mobil Giriş</Text>
          <Text style={styles.cardDesc}>Web ile eşzamanlı yönetim veya sakin hesabınız</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-POSTA ADRESİ</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@sitera.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ŞİFRE</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Giriş Yap →</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Fillers matching real database */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>HIZLI TEST HESABI SEÇİN</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                style={[styles.demoBtn, styles.demoAdmin]}
                onPress={() => fillCredentials('admin')}
              >
                <Text style={styles.demoBtnText}>👑 Site Yöneticisi</Text>
                <Text style={styles.demoSubText}>yonetim@alemdar.com</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBtn, styles.demoResident]}
                onPress={() => fillCredentials('resident')}
              >
                <Text style={styles.demoBtnText}>🏠 Sakin (Daire 1, 4)</Text>
                <Text style={styles.demoSubText}>alperen@gmail.com</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBtn, styles.demoSuper]}
                onPress={() => fillCredentials('superadmin')}
              >
                <Text style={styles.demoBtnText}>⚡ Süper Admin</Text>
                <Text style={styles.demoSubText}>admin@sitera.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  dbBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dbBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 18,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(10, 15, 28, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  demoSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 16,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  demoButtons: {
    gap: 8,
  },
  demoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  demoAdmin: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  demoResident: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  demoSuper: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  demoSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});
