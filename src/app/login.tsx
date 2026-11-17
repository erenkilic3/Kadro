import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signInWithEmail, signInAsDemo, isSupabaseAuthEnabled } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        setErrorMessage(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await signInAsDemo();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandBlock}>
            <View
              style={[
                styles.brandBadge,
                { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}40` },
              ]}
            >
              <Ionicons name="football" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>Kadro</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
              Halı saha maçlarına katıl, kadro kur ve takım arkadaşlarını değerlendir.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>Giriş Yap</Text>

            {errorMessage && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: `${colors.danger}14`,
                    borderColor: `${colors.danger}35`,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>E-posta</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@kadro.app"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Şifre</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, { color: colors.text }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={14}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                submitting && styles.disabledBtn,
              ]}
              onPress={handleSignIn}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.white }]}>
                  Giriş Yap
                </Text>
              )}
            </TouchableOpacity>

            {!isSupabaseAuthEnabled && (
              <View
                style={[
                  styles.demoNotice,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.demoNoticeText, { color: colors.textSecondary }]}>
                  Supabase `.env` anahtarları henüz eklenmemiş. Yerel demo hesabıyla
                  devam edebilirsin.
                </Text>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.primary }]}
                  onPress={handleDemoSignIn}
                  disabled={submitting}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                    Demo Hesabıyla Devam Et
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Hesabın yok mu?
            </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Kayıt Ol</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  brandBadge: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  brandTitle: {
    fontSize: FONT_SIZE.title,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  primaryBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  demoNotice: {
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  demoNoticeText: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
  },
  footerLink: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
