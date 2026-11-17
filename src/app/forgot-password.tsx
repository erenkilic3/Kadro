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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSentEmail(null);
    setSubmitting(true);
    try {
      const result = await sendPasswordReset(email);
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
      setSentEmail(email.trim().toLowerCase());
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
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={14}
              style={[
                styles.backBtn,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>Şifre Sıfırlama</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                E-posta adresinize sıfırlama bağlantısı gönderelim.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            {sentEmail && (
              <View
                style={[
                  styles.statusBox,
                  {
                    backgroundColor: `${colors.success}14`,
                    borderColor: colors.success,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>
                  {sentEmail} adresine şifre sıfırlama bağlantısı gönderildi.
                </Text>
              </View>
            )}

            {errorMessage && (
              <View
                style={[
                  styles.statusBox,
                  {
                    backgroundColor: `${colors.danger}14`,
                    borderColor: colors.danger,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.statusText, { color: colors.danger }]}>
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

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                submitting && styles.disabledBtn,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.white }]}>
                  Sıfırlama Bağlantısı Gönder
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
  },
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  statusText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    lineHeight: 18,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    height: 46,
  },
  input: { flex: 1, fontSize: FONT_SIZE.md },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  disabledBtn: { opacity: 0.65 },
  primaryBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
