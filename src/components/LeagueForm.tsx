import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';
import { CreateLeagueInput, MatchFormat } from '../types';
import { validateLeagueInput } from '../utils/validators';

export const LEAGUE_RULES_OPTIONS = [
  'TFF Lisanslı Hakem & Gözlemci',
  'Maçlar 25 x 2 = 50 Dakika',
  'HD Video Özetleri & Gol Kayıtları',
  'Fair-Play & Centilmenlik Puanı',
  'Kart Ceza Takibi',
  'Halı Saha / AG Krampon Zorunlu',
];

export const LEAGUE_COLOR_OPTIONS = [
  { hex: '#16A34A', name: 'Çim Yeşili' },
  { hex: '#2563EB', name: 'Mavi' },
  { hex: '#D97706', name: 'Altın' },
  { hex: '#DC2626', name: 'Kırmızı' },
  { hex: '#52525B', name: 'Antrasit' },
];

interface LeagueFormProps {
  initialValues?: Partial<CreateLeagueInput>;
  submitLabel?: string;
  isEdit?: boolean;
  onSubmit: (values: CreateLeagueInput) => Promise<void>;
}

export const LeagueForm: React.FC<LeagueFormProps> = ({
  initialValues,
  submitLabel = 'Bölgesel Ligi Başlat',
  isEdit = false,
  onSubmit,
}) => {
  const { colors } = useTheme();

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [season, setSeason] = useState(initialValues?.season ?? '2026 Bahar Sezonu');
  const [city, setCity] = useState(initialValues?.city ?? 'İstanbul');
  const [district, setDistrict] = useState(initialValues?.district ?? 'Kadıköy');
  const [venueName, setVenueName] = useState(initialValues?.venueName ?? '');
  const [format, setFormat] = useState<MatchFormat>(initialValues?.format ?? '7v7');
  const [maxTeams, setMaxTeams] = useState<number>(initialValues?.maxTeams ?? 8);
  const [prize, setPrize] = useState(
    initialValues?.prize ?? '15.000₺ Şampiyonluk Kupası & Forma Seti'
  );
  const [entryFee, setEntryFee] = useState(
    initialValues?.entryFee !== undefined ? String(initialValues.entryFee) : '1200'
  );
  const [themeColor, setThemeColor] = useState(initialValues?.themeColor ?? '#16A34A');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [selectedRules, setSelectedRules] = useState<string[]>(
    initialValues?.rules ?? [
      'TFF Lisanslı Hakem & Gözlemci',
      'Maçlar 25 x 2 = 50 Dakika',
      'Fair-Play & Centilmenlik Puanı',
    ]
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRule = (rule: string) => {
    setSelectedRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule]
    );
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    const payload: CreateLeagueInput = {
      title: title.trim(),
      season: season.trim(),
      city: city.trim() || 'İstanbul',
      district: district.trim(),
      venueName: venueName.trim(),
      format,
      maxTeams,
      entryFee: Number(entryFee) || 0,
      prize: prize.trim(),
      rules: selectedRules,
      description:
        description.trim() ||
        `${district.trim()} bölgesinde ${format} formatında amatör halı saha ligi.`,
      themeColor,
    };

    const validation = validateLeagueInput(payload);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lig kaydedilirken bir hata oluştu.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surfaceLight,
      borderColor: colors.surfaceBorder,
      color: colors.text,
    },
  ];

  return (
    <View
      style={[
        styles.formCard,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      {errorMessage && (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: `${colors.danger}15`, borderColor: colors.danger },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
        </View>
      )}

      <Text style={[styles.label, { color: colors.textSecondary }]}>Lig Adı *</Text>
      <TextInput
        style={inputStyle}
        placeholder="Örn: Kadıköy Halı Saha Ligi"
        placeholderTextColor={colors.textTertiary}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Sezon</Text>
      <TextInput
        style={inputStyle}
        placeholder="2026 Bahar Sezonu"
        placeholderTextColor={colors.textTertiary}
        value={season}
        onChangeText={setSeason}
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Şehir</Text>
          <TextInput
            style={inputStyle}
            placeholder="İstanbul"
            placeholderTextColor={colors.textTertiary}
            value={city}
            onChangeText={setCity}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>İlçe *</Text>
          <TextInput
            style={inputStyle}
            placeholder="Kadıköy"
            placeholderTextColor={colors.textTertiary}
            value={district}
            onChangeText={setDistrict}
          />
        </View>
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Tesis Adı *</Text>
      <TextInput
        style={inputStyle}
        placeholder="Kalamış Sahil Spor Tesisleri"
        placeholderTextColor={colors.textTertiary}
        value={venueName}
        onChangeText={setVenueName}
      />

      {!isEdit && (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Format</Text>
          <View style={styles.chipRow}>
            {(['5v5', '6v6', '7v7', '8v8'] as MatchFormat[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: format === f ? colors.primary : colors.surfaceLight,
                    borderColor: format === f ? colors.primary : colors.surfaceBorder,
                  },
                ]}
                onPress={() => setFormat(f)}
              >
                <Text
                  style={[
                    styles.choiceChipText,
                    { color: format === f ? '#FFFFFF' : colors.textSecondary },
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
        </>
      )}

      <Text style={[styles.label, { color: colors.textSecondary }]}>Ödül *</Text>
      <TextInput
        style={inputStyle}
        placeholder="15.000₺ Kupa & Forma Seti"
        placeholderTextColor={colors.textTertiary}
        value={prize}
        onChangeText={setPrize}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Takım Katılım Ücreti (₺)
      </Text>
      <TextInput
        style={inputStyle}
        keyboardType="numeric"
        value={entryFee}
        onChangeText={setEntryFee}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Tema Rengi</Text>
      <View style={styles.colorRow}>
        {LEAGUE_COLOR_OPTIONS.map((c) => (
          <TouchableOpacity
            key={c.hex}
            style={[
              styles.colorCircle,
              { backgroundColor: c.hex },
              themeColor === c.hex && styles.colorCircleActive,
            ]}
            onPress={() => setThemeColor(c.hex)}
          >
            {themeColor === c.hex && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Kurallar</Text>
      <View style={styles.rulesPicker}>
        {LEAGUE_RULES_OPTIONS.map((rule) => {
          const checked = selectedRules.includes(rule);
          return (
            <TouchableOpacity
              key={rule}
              style={[
                styles.ruleCheckbox,
                {
                  backgroundColor: checked ? `${colors.primary}15` : colors.surfaceLight,
                  borderColor: checked ? colors.primary : colors.surfaceBorder,
                },
              ]}
              onPress={() => toggleRule(rule)}
            >
              <Ionicons
                name={checked ? 'checkbox' : 'square-outline'}
                size={18}
                color={checked ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.ruleCheckboxText, { color: colors.text }]}>{rule}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
      <TextInput
        style={[...inputStyle, styles.textArea]}
        multiline
        placeholder="Lig hakkında kısa bilgi..."
        placeholderTextColor={colors.textTertiary}
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: themeColor }]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
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
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  choiceChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  rulesPicker: {
    gap: 8,
    marginTop: 2,
  },
  ruleCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 10,
    borderRadius: RADIUS.sm,
    gap: 8,
  },
  ruleCheckboxText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
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
