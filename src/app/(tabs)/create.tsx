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
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';
import { PlayerPosition, MatchFormat, GearCategory, GearCondition } from '../../types';

const LEAGUE_RULES_OPTIONS = [
  'TFF Lisanslı Hakem & Gözlemci',
  'Maçlar 25 x 2 = 50 Dakika',
  'HD Video Özetleri & Gol Kayıtları',
  'Fair-Play & Centilmenlik Puanı',
  'Kart Ceza Takibi',
  'Halı Saha / AG Krampon Zorunlu',
];

const LEAGUE_COLOR_OPTIONS = [
  { hex: '#16A34A', name: 'Çim Yeşili' },
  { hex: '#2563EB', name: 'Mavi' },
  { hex: '#D97706', name: 'Altın' },
  { hex: '#DC2626', name: 'Kırmızı' },
  { hex: '#52525B', name: 'Antrasit' },
];

export default function CreateScreen() {
  const { createMatch, createGearItem, createLeague } = useApp();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<'MATCH' | 'LEAGUE' | 'GEAR'>(() => {
    if (params.tab === 'LEAGUE' || params.tab === 'GEAR' || params.tab === 'MATCH') {
      return params.tab;
    }
    return 'MATCH';
  });
  const [prevTabParam, setPrevTabParam] = useState(params.tab);

  if (params.tab !== prevTabParam) {
    setPrevTabParam(params.tab);
    if (params.tab === 'LEAGUE' || params.tab === 'GEAR' || params.tab === 'MATCH') {
      setActiveTab(params.tab);
    }
  }

  // Match Form State
  const [matchTitle, setMatchTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [district, setDistrict] = useState('Kadıköy');
  const [address] = useState('');
  const [date, setDate] = useState('18 Ekim Cumartesi');
  const [time, setTime] = useState('21:00 - 22:00');
  const [format, setFormat] = useState<MatchFormat>('7v7');
  const [pitchType, setPitchType] = useState<'Açık Saha' | 'Kapalı Saha'>('Açık Saha');
  const [fee, setFee] = useState('220');
  const [missingPositions, setMissingPositions] = useState<PlayerPosition[]>(['GK', 'DEF']);
  const [notes, setNotes] = useState('');

  // League Form State
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

  // Gear Form State
  const [gearTitle, setGearTitle] = useState('');
  const [category, setCategory] = useState<GearCategory>('Boots');
  const [brand, setBrand] = useState('Nike');
  const [size, setSize] = useState('42.5 EU');
  const [price, setPrice] = useState('1500');
  const [condition, setCondition] = useState<GearCondition>('Çok İyi (Az Kullanılmış)');
  const [gearLocation, setGearLocation] = useState('İstanbul / Kadıköy');
  const [gearDescription, setGearDescription] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMissingPosition = (pos: PlayerPosition) => {
    setMissingPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  const toggleRule = (rule: string) => {
    setSelectedRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule]
    );
  };

  const handleCreateMatch = async () => {
    setErrorMessage(null);
    if (!matchTitle.trim()) return setErrorMessage('Lütfen maç başlığını giriniz.');
    if (!venueName.trim()) return setErrorMessage('Lütfen halı saha tesis adını giriniz.');
    if (!fee.trim() || isNaN(Number(fee)) || Number(fee) <= 0) {
      return setErrorMessage('Lütfen geçerli bir kişi başı ücret giriniz.');
    }
    if (missingPositions.length === 0) {
      return setErrorMessage('Lütfen en az bir aranan eksik mevki seçiniz.');
    }

    try {
      setIsSubmitting(true);
      await createMatch({
        title: matchTitle.trim(),
        venueName: venueName.trim(),
        address: address.trim() || `${district}, İstanbul`,
        district: district.trim(),
        date,
        time,
        format,
        pitchType,
        feePerPlayer: Number(fee),
        missingPositions,
        notes: notes.trim(),
      });

      Alert.alert('Maç Yayınlandı', 'Maç ilanınız oluşturuldu ve kadro yayına alındı.', [
        {
          text: 'Maçlara Dön',
          onPress: () => {
            setMatchTitle('');
            setVenueName('');
            setNotes('');
            router.push('/(tabs)');
          },
        },
      ]);
    } catch {
      setErrorMessage('Maç kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
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
          `${leagueDistrict} bölgesinde ${leagueFormat} formatında amatör halı saha ligi.`,
        themeColor,
      });

      Alert.alert('Lig Kuruldu', `"${newLeague.title}" oluşturuldu.`, [
        {
          text: 'Lige Git',
          onPress: () => {
            setLeagueTitle('');
            setLeagueVenue('');
            router.push(`/league/${newLeague.id}` as any);
          },
        },
      ]);
    } catch {
      setErrorMessage('Lig oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGear = async () => {
    setErrorMessage(null);
    if (!gearTitle.trim()) return setErrorMessage('Lütfen ürün başlığını giriniz.');
    if (!brand.trim()) return setErrorMessage('Lütfen marka bilgisini giriniz.');
    if (!size.trim()) return setErrorMessage('Lütfen beden veya numara bilgisini giriniz.');
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      return setErrorMessage('Lütfen geçerli bir satış fiyatı giriniz.');
    }
    if (!gearDescription.trim()) {
      return setErrorMessage('Lütfen ürün açıklaması giriniz.');
    }

    try {
      setIsSubmitting(true);
      await createGearItem({
        title: gearTitle.trim(),
        category,
        brand: brand.trim(),
        size: size.trim(),
        price: Number(price),
        condition,
        location: gearLocation.trim(),
        description: gearDescription.trim(),
      });

      Alert.alert('İlan Yayınlandı', 'İkinci el ekipman ilanınız pazara eklendi.', [
        {
          text: 'Pazara Git',
          onPress: () => {
            setGearTitle('');
            setGearDescription('');
            router.push('/(tabs)/market');
          },
        },
      ]);
    } catch {
      setErrorMessage('İlan oluşturulurken bir hata oluştu.');
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
          <Text style={[styles.screenTitle, { color: colors.text }]}>Oluştur</Text>
          <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
            Maç ilanı aç, bölgesel lig kur veya ekipman sat
          </Text>

          {/* Segmented Bar */}
          <View style={[styles.tabContainer, { backgroundColor: colors.surfaceLight }]}>
            {(
              [
                { key: 'MATCH' as const, label: 'Maç Aç' },
                { key: 'LEAGUE' as const, label: 'Lig Kur' },
                { key: 'GEAR' as const, label: 'Ekipman Sat' },
              ]
            ).map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    isActive && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => {
                    setActiveTab(tab.key);
                    setErrorMessage(null);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: isActive ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {errorMessage && (
            <View style={[styles.errorBox, { backgroundColor: `${colors.danger}15` }]}>
              <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
            </View>
          )}

          {/* LEAGUE FORM */}
          {activeTab === 'LEAGUE' && (
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Lig Bilgileri</Text>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Lig Adı *</Text>
              <TextInput
                style={inputStyle}
                placeholder="Örn: Kadıköy Halı Saha Ligi"
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
                    placeholder="Kadıköy"
                    placeholderTextColor={colors.textTertiary}
                    value={leagueDistrict}
                    onChangeText={setLeagueDistrict}
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Tesis Adı *</Text>
              <TextInput
                style={inputStyle}
                placeholder="Kalamış Sahil Spor Tesisleri"
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
                      {
                        backgroundColor: leagueFormat === f ? colors.primary : colors.surfaceLight,
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

              <Text style={[styles.label, { color: colors.textSecondary }]}>Takım Sayısı</Text>
              <View style={styles.chipRow}>
                {[6, 8, 10, 12, 16].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: maxTeams === num ? colors.primary : colors.surfaceLight,
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
                placeholder="1200"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={leagueEntryFee}
                onChangeText={setLeagueEntryFee}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Kurallar</Text>
              <View style={styles.rulesPicker}>
                {LEAGUE_RULES_OPTIONS.map((rule) => {
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
                    {themeColor === c.hex && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
              <TextInput
                style={[inputStyle, styles.textArea]}
                placeholder="Maç saatleri ve katılım detayları..."
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
          )}

          {/* MATCH FORM */}
          {activeTab === 'MATCH' && (
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Maç Detayları</Text>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Maç Başlığı *</Text>
              <TextInput
                style={inputStyle}
                placeholder="Örn: Cuma Akşamı Kadıköy 7v7"
                placeholderTextColor={colors.textTertiary}
                value={matchTitle}
                onChangeText={setMatchTitle}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Tesis Adı *</Text>
              <TextInput
                style={inputStyle}
                placeholder="Kalamış Halı Saha Tesisleri"
                placeholderTextColor={colors.textTertiary}
                value={venueName}
                onChangeText={setVenueName}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>İlçe</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="Kadıköy"
                    placeholderTextColor={colors.textTertiary}
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Kişi Başı (₺) *</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="220"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={fee}
                    onChangeText={setFee}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Tarih</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="18 Ekim Cumartesi"
                    placeholderTextColor={colors.textTertiary}
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Saat</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="21:00 - 22:00"
                    placeholderTextColor={colors.textTertiary}
                    value={time}
                    onChangeText={setTime}
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Format</Text>
              <View style={styles.chipRow}>
                {(['5v5', '6v6', '7v7', '8v8'] as MatchFormat[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.choiceChip,
                      { backgroundColor: format === f ? colors.primary : colors.surfaceLight },
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

              <Text style={[styles.label, { color: colors.textSecondary }]}>Saha Türü</Text>
              <View style={styles.chipRow}>
                {(['Açık Saha', 'Kapalı Saha'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.choiceChip,
                      { backgroundColor: pitchType === t ? colors.primary : colors.surfaceLight },
                    ]}
                    onPress={() => setPitchType(t)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        { color: pitchType === t ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Aranan Eksik Mevkiler *
              </Text>
              <View style={styles.chipRow}>
                {(
                  [
                    { pos: 'GK', label: 'Kaleci (GK)' },
                    { pos: 'DEF', label: 'Defans (DEF)' },
                    { pos: 'MID', label: 'Orta Saha (MID)' },
                    { pos: 'FWD', label: 'Forvet (FWD)' },
                  ] as const
                ).map(({ pos, label }) => {
                  const isSelected = missingPositions.includes(pos);
                  return (
                    <TouchableOpacity
                      key={pos}
                      style={[
                        styles.choiceChip,
                        {
                          backgroundColor: isSelected ? colors.danger : colors.surfaceLight,
                        },
                      ]}
                      onPress={() => toggleMissingPosition(pos)}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Notlar</Text>
              <TextInput
                style={[inputStyle, styles.textArea]}
                placeholder="Krampon kuralı, buluşma saati..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateMatch}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Yayınlanıyor...' : 'Maçı Yayınla'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* GEAR FORM */}
          {activeTab === 'GEAR' && (
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Ekipman Bilgileri</Text>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Ürün Başlığı *</Text>
              <TextInput
                style={inputStyle}
                placeholder="Örn: Nike Mercurial Vapor 15"
                placeholderTextColor={colors.textTertiary}
                value={gearTitle}
                onChangeText={setGearTitle}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori</Text>
              <View style={styles.chipRow}>
                {(
                  [
                    { key: 'Boots', label: 'Krampon' },
                    { key: 'Jerseys', label: 'Forma' },
                    { key: 'Gloves', label: 'Eldiven' },
                    { key: 'Equipment', label: 'Ekipman' },
                  ] as const
                ).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.choiceChip,
                      { backgroundColor: category === key ? colors.primary : colors.surfaceLight },
                    ]}
                    onPress={() => setCategory(key)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        { color: category === key ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Marka *</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="Nike, Adidas..."
                    placeholderTextColor={colors.textTertiary}
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Beden / No *</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="42 EU, L..."
                    placeholderTextColor={colors.textTertiary}
                    value={size}
                    onChangeText={setSize}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Fiyat (₺) *</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="1500"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Konum</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="Kadıköy"
                    placeholderTextColor={colors.textTertiary}
                    value={gearLocation}
                    onChangeText={setGearLocation}
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Durum</Text>
              <View style={styles.chipRow}>
                {(
                  [
                    'Sıfır (Etiketli)',
                    'Çok İyi (Az Kullanılmış)',
                    'İyi',
                    'Kullanılmış',
                  ] as GearCondition[]
                ).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.choiceChip,
                      { backgroundColor: condition === c ? colors.primary : colors.surfaceLight },
                    ]}
                    onPress={() => setCondition(c)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        { color: condition === c ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama *</Text>
              <TextInput
                style={[inputStyle, styles.textArea]}
                placeholder="Kullanım süresi ve ürün durumu hakkında detaylar..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                value={gearDescription}
                onChangeText={setGearDescription}
              />

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateGear}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  screenSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  tabText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
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
  sectionHeader: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 4,
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
