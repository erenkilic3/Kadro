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
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  FONT_SIZE,
  POSITION_COLORS,
  POSITION_LABELS,
  RADIUS,
  SPACING,
} from '../constants/theme';
import { PlayerPosition } from '../types';

const POSITIONS: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];
const DISTRICTS = ['Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Bakırköy', 'Ataşehir'];

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signUpWithEmail } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('MID');
  const [district, setDistrict] = useState('Kadıköy');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setErrorMessage(null);
    setConfirmationEmail(null);
    setSubmitting(true);
    try {
      const result = await signUpWithEmail({
        name,
        email,
        password,
        position,
        city: 'İstanbul',
        district,
      });

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      if (result.needsEmailConfirmation) {
        setConfirmationEmail(email.trim().toLowerCase());
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
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>Hesap Oluştur</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Mevkini seç ve sahaya çıkmaya hazırlan.
              </Text>
            </View>
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
            {confirmationEmail && (
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: `${colors.success}14`,
                    borderColor: `${colors.success}40`,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[styles.infoText, { color: colors.success }]}>
                  {confirmationEmail} adresine doğrulama bağlantısı gönderildi. E-postanı
                  onayladıktan sonra giriş yapabilirsin.
                </Text>
              </View>
            )}

            {errorMessage && (
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: `${colors.danger}14`,
                    borderColor: `${colors.danger}35`,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.infoText, { color: colors.danger }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Ad Soyad</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Ionicons name="person-outline" size={18} color={colors.textTertiary} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ahmet Yılmaz"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

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

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Mevki</Text>
              <View style={styles.chipRow}>
                {POSITIONS.map((pos) => {
                  const selected = position === pos;
                  const posColor = POSITION_COLORS[pos];
                  return (
                    <TouchableOpacity
                      key={pos}
                      onPress={() => setPosition(pos)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? `${posColor}22` : colors.surfaceLight,
                          borderColor: selected ? posColor : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? posColor : colors.textSecondary },
                        ]}
                      >
                        {POSITION_LABELS[pos]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Bölge (İstanbul)
              </Text>
              <View style={styles.chipRow}>
                {DISTRICTS.map((item) => {
                  const selected = district === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setDistrict(item)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected
                            ? `${colors.primary}20`
                            : colors.surfaceLight,
                          borderColor: selected ? colors.primary : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                submitting && styles.disabledBtn,
              ]}
              onPress={handleRegister}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.white }]}>
                  Kayıt Ol
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Zaten hesabın var mı?
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Giriş Yap</Text>
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
    paddingVertical: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    lineHeight: 17,
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
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
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
