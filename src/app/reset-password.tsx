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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { updatePassword, clearPasswordRecovery } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setErrorMessage(null);
    if (password !== confirmPassword) {
      setErrorMessage('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (result.error) {
        setErrorMessage(result.error);
      }
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
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text style={[styles.title, { color: colors.text }]}>Yeni Şifre Belirle</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Hesabınız için en az 6 karakterlik yeni bir şifre girin.
            </Text>

            {errorMessage && (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: `${colors.danger}14`, borderColor: colors.danger },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Yeni Şifre</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="En az 6 karakter"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.surfaceBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Yeni Şifre (Tekrar)
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Şifreyi tekrar girin"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.surfaceBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                submitting && styles.disabledBtn,
              ]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.white }]}>
                  Şifreyi Güncelle
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
              onPress={clearPasswordRecovery}
              disabled={submitting}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Vazgeç</Text>
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
  },
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  fieldGroup: { gap: 6 },
  label: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    height: 46,
    fontSize: FONT_SIZE.md,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  disabledBtn: { opacity: 0.65 },
  primaryBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
});
