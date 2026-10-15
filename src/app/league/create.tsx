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
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { MatchFormat } from '../../types';

export default function CreateLeagueScreen() {
  const { createLeague } = useApp();
  const { colors, isDark } = useTheme();

  const [leagueTitle, setLeagueTitle] = useState('');
  const [leagueSeason, setLeagueSeason] = useState('2026 Bahar Sezonu');
  const [leagueCity, setLeagueCity] = useState('İstanbul');
  const [leagueDistrict, setLeagueDistrict] = useState('Kadıköy');
  const [leagueVenue, setLeagueVenue] = useState('');
  const [leagueFormat, setLeagueFormat] = useState<MatchFormat>('7v7');
  const [maxTeams, setMaxTeams] = useState<number>(8);
  const [prize, setPrize] = useState('🏆 15.000₺ Şampiyonluk Kupası & Forma Seti');
  const [leagueEntryFee, setLeagueEntryFee] = useState('1200');
  const [themeColor, setThemeColor] = useState('#00D664');
  const [leagueDescription, setLeagueDescription] = useState('');
  const [selectedRules, setSelectedRules] = useState<string[]>([
    'TFF Lisanslı Resmi Hakem & Gözlemci',
    'Maçlar 25 x 2 = 50 Dakika Oynanır',
    'Fair-Play & Centilmenlik Puanı',
    'Kadro Uygulamasında Canlı Puan Durumu',
  ]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRule = (rule: string) => {
    if (selectedRules.includes(rule)) {
      setSelectedRules(selectedRules.filter((r) => r !== rule));
    } else {
      setSelectedRules([...selectedRules, rule]);
    }
  };

  const handleCreateLeague = async () => {
    setErrorMessage(null);

    if (!leagueTitle.trim()) {
      setErrorMessage('Lütfen lig adını giriniz.');
      return;
    }
    if (!leagueVenue.trim()) {
      setErrorMessage('Lütfen ligin oynanacağı tesis adını giriniz.');
      return;
    }
    if (!prize.trim()) {
      setErrorMessage('Lütfen şampiyonluk ödülünü belirtiniz.');
      return;
    }

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
          `${leagueDistrict} bölgesinde ${leagueFormat} formatında amatör bölgesel halı saha turnuvası.`,
        themeColor,
      });

      Alert.alert(
        '🏆 Lig Başarıyla Kuruldu!',
        `"${newLeague.title}" bölgesel ligi oluşturuldu. Şimdi puan durumu ve fikstürü inceleyebilir, diğer takımları davet edebilirsiniz.`,
        [
          {
            text: 'Lige Git',
            onPress: () => {
              router.replace(`/league/${newLeague.id}` as any);
            },
          },
        ]
      );
    } catch (e) {
      setErrorMessage('Lig oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.surfaceLight }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.screenTitle, { color: colors.text }]}>Yeni Bölgesel Lig Kur</Text>
              <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
                Semtini organize et, turnuvayı başlat!
              </Text>
            </View>
          </View>

          {errorMessage && (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: colors.danger,
                },
              ]}
            >
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
            </View>
          )}

          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            {/* League Title */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Lig Adı *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Örn: Beşiktaş Veteranlar & Masterlar Ligi"
              placeholderTextColor={colors.textTertiary}
              value={leagueTitle}
              onChangeText={setLeagueTitle}
            />

            {/* Season */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Sezon & Dönem</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Örn: 2026 Bahar Sezonu"
              placeholderTextColor={colors.textTertiary}
              value={leagueSeason}
              onChangeText={setLeagueSeason}
            />

            {/* City & District */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Şehir</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.surfaceBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="İstanbul"
                  placeholderTextColor={colors.textTertiary}
                  value={leagueCity}
                  onChangeText={setLeagueCity}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>İlçe / Bölge *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.surfaceBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Beşiktaş"
                  placeholderTextColor={colors.textTertiary}
                  value={leagueDistrict}
                  onChangeText={setLeagueDistrict}
                />
              </View>
            </View>

            {/* Facility / Venue */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Halı Saha Tesisi *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Örn: Çilekli Halı Saha Spor Tesisleri"
              placeholderTextColor={colors.textTertiary}
              value={leagueVenue}
              onChangeText={setLeagueVenue}
            />

            {/* Format & Max Teams */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Maç Formatı</Text>
            <View style={styles.chipRow}>
              {(['5v5', '6v6', '7v7', '8v8'] as MatchFormat[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.choiceChip,
                    {
                      backgroundColor: leagueFormat === f ? colors.primary : colors.surfaceLight,
                      borderColor: leagueFormat === f ? colors.primary : colors.surfaceBorder,
                    },
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

            <Text style={[styles.label, { color: colors.textSecondary }]}>Takım Kontenjanı</Text>
            <View style={styles.chipRow}>
              {[6, 8, 10, 12, 16].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.choiceChip,
                    {
                      backgroundColor: maxTeams === num ? colors.primary : colors.surfaceLight,
                      borderColor: maxTeams === num ? colors.primary : colors.surfaceBorder,
                    },
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

            {/* Prize & Entry Fee */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Büyük Şampiyonluk Ödülü *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Örn: 🏆 20.000₺ Şampiyonluk Kupası & Hediyeler"
              placeholderTextColor={colors.textTertiary}
              value={prize}
              onChangeText={setPrize}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Takım Başı Katılım Ücreti (₺)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.surfaceBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="1200 (veya 0 için Ücretsiz)"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={leagueEntryFee}
                  onChangeText={setLeagueEntryFee}
                />
              </View>
            </View>

            {/* League Rules Checklist */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Lig Standartları & Kuralları
            </Text>
            <View style={styles.rulesPicker}>
              {[
                'TFF Lisanslı Resmi Hakem & Gözlemci',
                'Maçlar 25 x 2 = 50 Dakika Oynanır',
                'HD Video Özetleri & Gol Kayıtları',
                'Fair-Play & Centilmenlik Puanı',
                'Sarı ve Kırmızı Kart Ceza Takibi',
                'Halı Saha / AG Krampon Zorunludur',
              ].map((rule) => {
                const isChecked = selectedRules.includes(rule);
                return (
                  <TouchableOpacity
                    key={rule}
                    style={[
                      styles.ruleCheckbox,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: isChecked ? colors.primary : colors.surfaceBorder,
                      },
                    ]}
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

            {/* Theme Color Picker */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Lig Rozet / Tema Rengi</Text>
            <View style={styles.colorRow}>
              {[
                { hex: '#00D664', name: 'Zümrüt Yeşil' },
                { hex: '#3B82F6', name: 'Gece Mavi' },
                { hex: '#F59E0B', name: 'Altın Sarı' },
                { hex: '#EF4444', name: 'Ateş Kırmızı' },
                { hex: '#8B5CF6', name: 'Kraliyet Mor' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.hex}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c.hex },
                    themeColor === c.hex && styles.colorCircleActive,
                  ]}
                  onPress={() => setThemeColor(c.hex)}
                >
                  {themeColor === c.hex && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Lig Tüzüğü & Ek Bilgiler
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Katılım şartları, fikstür takvimi ve iletişim detayları..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              value={leagueDescription}
              onChangeText={setLeagueDescription}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateLeague}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Ionicons name="trophy" size={20} color="#FFFFFF" />
              <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                {isSubmitting ? 'Lig Kuruluyor...' : 'Bölgesel Ligi Başlat ve Yayınla'}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  screenSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    flex: 1,
  },
  formCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  choiceChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  rulesPicker: {
    gap: 8,
    marginTop: 4,
  },
  ruleCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  ruleCheckboxText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: SPACING.xl,
    gap: 8,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
