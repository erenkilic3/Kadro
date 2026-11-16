import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';
import { MatchFormat } from '../../types';

const RULES_OPTIONS = [
  'TFF Lisanslı Hakem & Gözlemci',
  'Maçlar 25 x 2 = 50 Dakika',
  'HD Video Özetleri & Gol Kayıtları',
  'Fair-Play & Centilmenlik Puanı',
  'Kart Ceza Takibi',
  'Halı Saha / AG Krampon Zorunlu',
];

const COLOR_OPTIONS = ['#16A34A', '#2563EB', '#D97706', '#DC2626', '#52525B'];

export default function CreateLeagueScreen() {
  const { createLeague } = useApp();
  const { colors } = useTheme();

  const [leagueTitle, setLeagueTitle] = useState('');
  const [leagueSeason, setLeagueSeason] = useState('2026 Bahar Sezonu');
  const [leagueCity, setLeagueCity] = useState('İstanbul');
  const [leagueDistrict, setLeagueDistrict] = useState('Kadıköy');
  const [leagueVenue, setLeagueVenue] = useState('');
  const [leagueFormat, setLeagueFormat] = useState<MatchFormat>('7v7');
  const [maxTeams, setMaxTeams] = useState<number>(8);
  const [prize, setPrize] = useState('15.000₺ Şampiyonluk Kupası & Forma Seti');
  const [leagueEntryFee, setLeagueEntryFee] = useState('1200');
  const [themeColor, setThemeColor] = useState('#16A34A');
  const [leagueDescription, setLeagueDescription] = useState('');
  const [selectedRules, setSelectedRules] = useState<string[]>([
    'TFF Lisanslı Hakem & Gözlemci',
    'Maçlar 25 x 2 = 50 Dakika',
    'Fair-Play & Centilmenlik Puanı',
  ]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRule = (rule: string) => {
    setSelectedRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule]
    );
  };

  const handleCreateLeague = async () => {
    setErrorMessage(null);
    if (!leagueTitle.trim()) return setErrorMessage('Lütfen lig adını giriniz.');
    if (!leagueVenue.trim()) return setErrorMessage('Lütfen tesis adını giriniz.');
    if (!prize.trim()) return setErrorMessage('Lütfen şampiyonluk ödülünü belirtiniz.');

    try {
      setIsSubmitting(true);
      const newLeague = await createLeague({
        title: leagueTitle.trim(),
        season: leagueSeason.trim(),
        city: leagueCity.trim(),
        district: leagueDistrict.trim(),
        venueName: leagueVenue.trim(),
        format: leagueFormat,
        maxTeams,
        entryFee: Number(leagueEntryFee) || 0,
        prize: prize.trim(),
        rules: selectedRules,
        description:
          leagueDescription.trim() ||
          `${leagueDistrict} bölgesinde ${leagueFormat} formatında amatör halı saha turnuvası.`,
        themeColor,
      });

      Alert.alert('Lig Kuruldu', `"${newLeague.title}" bölgesel ligi oluşturuldu.`, [
        {
          text: 'Lige Git',
          onPress: () => router.replace(`/league/${newLeague.id}` as any),
        },
      ]);
    } catch {
      setErrorMessage('Lig oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surfaceLight, color: colors.text },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.surfaceLight }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.screenTitle, { color: colors.text }]}>Yeni Bölgesel Lig</Text>
              <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
                Turnuva detaylarını ve kurallarını belirleyin
              </Text>
            </View>
          </View>

          {errorMessage && (
            <View style={[styles.errorBox, { backgroundColor: `${colors.danger}15` }]}>
              <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
            </View>
          )}

          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>Lig Adı *</Text>
            <TextInput
              style={inputStyle}
              placeholder="Örn: Beşiktaş Master Ligi"
              placeholderTextColor={colors.textTertiary}
              value={leagueTitle}
              onChangeText={setLeagueTitle}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Sezon</Text>
            <TextInput
              style={inputStyle}
              placeholder="2026 Bahar Sezonu"
              placeholderTextColor={colors.textTertiary}
              value={leagueSeason}
              onChangeText={setLeagueSeason}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Şehir</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="İstanbul"
                  placeholderTextColor={colors.textTertiary}
                  value={leagueCity}
                  onChangeText={setLeagueCity}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>İlçe *</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="Beşiktaş"
                  placeholderTextColor={colors.textTertiary}
                  value={leagueDistrict}
                  onChangeText={setLeagueDistrict}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Halı Saha Tesisi *</Text>
            <TextInput
              style={inputStyle}
              placeholder="Örn: Çilekli Spor Tesisleri"
              placeholderTextColor={colors.textTertiary}
              value={leagueVenue}
              onChangeText={setLeagueVenue}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Format</Text>
            <View style={styles.chipRow}>
              {(['5v5', '6v6', '7v7', '8v8'] as MatchFormat[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.choiceChip,
                    { backgroundColor: leagueFormat === f ? colors.primary : colors.surfaceLight },
                  ]}
                  onPress={() => setLeagueFormat(f)}
                >
                  <Text
                    style={[
                      styles.choiceChipText,
                      { color: leagueFormat === f ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Takım Sayısı</Text>
            <View style={styles.chipRow}>
              {[6, 8, 10, 12, 16].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.choiceChip,
                    { backgroundColor: maxTeams === num ? colors.primary : colors.surfaceLight },
                  ]}
                  onPress={() => setMaxTeams(num)}
                >
                  <Text
                    style={[
                      styles.choiceChipText,
                      { color: maxTeams === num ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {num} Takım
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Şampiyonluk Ödülü *</Text>
            <TextInput
              style={inputStyle}
              placeholder="15.000₺ Kupa & Forma Seti"
              placeholderTextColor={colors.textTertiary}
              value={prize}
              onChangeText={setPrize}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Katılım Ücreti (₺ / Takım)
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="1200"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={leagueEntryFee}
              onChangeText={setLeagueEntryFee}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Kurallar</Text>
            <View style={styles.rulesPicker}>
              {RULES_OPTIONS.map((rule) => {
                const isChecked = selectedRules.includes(rule);
                return (
                  <TouchableOpacity
                    key={rule}
                    style={[styles.ruleCheckbox, { backgroundColor: colors.surfaceLight }]}
                    onPress={() => toggleRule(rule)}
                  >
                    <Ionicons
                      name={isChecked ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={isChecked ? colors.primary : colors.textTertiary}
                    />
                    <Text style={[styles.ruleCheckboxText, { color: colors.text }]}>{rule}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Lig Rengi</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((hex) => (
                <TouchableOpacity
                  key={hex}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: hex },
                    themeColor === hex && styles.colorCircleActive,
                  ]}
                  onPress={() => setThemeColor(hex)}
                >
                  {themeColor === hex && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Katılım şartları ve maç takvimi..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              value={leagueDescription}
              onChangeText={setLeagueDescription}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateLeague}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Oluşturuluyor...' : 'Ligi Yayınla'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  screenSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    flex: 1,
  },
  formCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: RADIUS.sm,
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    height: 76,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  choiceChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  rulesPicker: {
    gap: 8,
    marginTop: 2,
  },
  ruleCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.sm,
    gap: 8,
  },
  ruleCheckboxText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginTop: SPACING.xl,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
