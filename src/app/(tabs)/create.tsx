import React, { useState, useEffect } from 'react';
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
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { PlayerPosition, MatchFormat, GearCategory, GearCondition } from '../../types';

export default function CreateScreen() {
  const { createMatch, createGearItem, createLeague } = useApp();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<'MATCH' | 'LEAGUE' | 'GEAR'>('MATCH');

  useEffect(() => {
    if (params.tab === 'LEAGUE') {
      setActiveTab('LEAGUE');
    } else if (params.tab === 'GEAR') {
      setActiveTab('GEAR');
    } else if (params.tab === 'MATCH') {
      setActiveTab('MATCH');
    }
  }, [params.tab]);

  // Match Form State
  const [matchTitle, setMatchTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [district, setDistrict] = useState('Kadıköy');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('18 Ekim Cumartesi');
  const [time, setTime] = useState('21:00 - 22:00');
  const [format, setFormat] = useState<MatchFormat>('7v7');
  const [pitchType, setPitchType] = useState<'Açık Saha' | 'Kapalı Saha'>('Açık Saha');
  const [fee, setFee] = useState('220');
  const [missingPositions, setMissingPositions] = useState<PlayerPosition[]>(['GK', 'DEF']);
  const [notes, setNotes] = useState('');

  // Regional League Form State
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

  // Gear Form State
  const [gearTitle, setGearTitle] = useState('');
  const [category, setCategory] = useState<GearCategory>('Boots');
  const [brand, setBrand] = useState('Nike');
  const [size, setSize] = useState('42.5 EU');
  const [price, setPrice] = useState('1500');
  const [condition, setCondition] = useState<GearCondition>('Çok İyi (Az Kullanılmış)');
  const [gearLocation, setGearLocation] = useState('İstanbul / Kadıköy');
  const [gearDescription, setGearDescription] = useState('');

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMissingPosition = (pos: PlayerPosition) => {
    if (missingPositions.includes(pos)) {
      setMissingPositions(missingPositions.filter((p) => p !== pos));
    } else {
      setMissingPositions([...missingPositions, pos]);
    }
  };

  const toggleRule = (rule: string) => {
    if (selectedRules.includes(rule)) {
      setSelectedRules(selectedRules.filter((r) => r !== rule));
    } else {
      setSelectedRules([...selectedRules, rule]);
    }
  };

  const handleCreateMatch = async () => {
    setErrorMessage(null);

    if (!matchTitle.trim()) {
      setErrorMessage('Lütfen maç başlığını giriniz.');
      return;
    }
    if (!venueName.trim()) {
      setErrorMessage('Lütfen halı saha tesis adını giriniz.');
      return;
    }
    if (!fee.trim() || isNaN(Number(fee)) || Number(fee) <= 0) {
      setErrorMessage('Lütfen geçerli bir kişi başı ücret giriniz.');
      return;
    }
    if (missingPositions.length === 0) {
      setErrorMessage('Lütfen en az bir aranan eksik mevki seçiniz.');
      return;
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

      Alert.alert('⚽ Başarılı!', 'Halı saha maç ilanınız oluşturuldu ve kadro yayına alındı.', [
        {
          text: 'Maçları Gör',
          onPress: () => {
            setMatchTitle('');
            setVenueName('');
            setNotes('');
            router.push('/(tabs)');
          },
        },
      ]);
    } catch (e) {
      setErrorMessage('Maç kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLeague = async () => {
    setErrorMessage(null);

    if (!leagueTitle.trim()) {
      setErrorMessage('Lütfen lig adını giriniz (Örn: Kadıköy Süper Halı Saha Ligi).');
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
        maxTeams: maxTeams,
        entryFee: Number(leagueEntryFee) || 0,
        prize: prize.trim(),
        rules: selectedRules,
        description: leagueDescription.trim() || `${leagueDistrict} bölgesinde ${leagueFormat} formatında amatör bölgesel halı saha turnuvası.`,
        themeColor,
      });

      Alert.alert('🏆 Lig Başarıyla Kuruldu!', `"${newLeague.title}" bölgesel ligi oluşturuldu. Şimdi puan durumu ve fikstürü inceleyebilir, diğer takımları davet edebilirsiniz.`, [
        {
          text: 'Lige Git',
          onPress: () => {
            setLeagueTitle('');
            setLeagueVenue('');
            router.push(`/league/${newLeague.id}` as any);
          },
        },
      ]);
    } catch (e) {
      setErrorMessage('Lig oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGear = async () => {
    setErrorMessage(null);

    if (!gearTitle.trim()) {
      setErrorMessage('Lütfen ürün başlığını giriniz.');
      return;
    }
    if (!brand.trim()) {
      setErrorMessage('Lütfen marka bilgisini giriniz.');
      return;
    }
    if (!size.trim()) {
      setErrorMessage('Lütfen beden veya numara bilgisini giriniz.');
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      setErrorMessage('Lütfen geçerli bir satış fiyatı giriniz.');
      return;
    }
    if (!gearDescription.trim()) {
      setErrorMessage('Lütfen ürünün kullanım durumu hakkında kısa bir açıklama yazınız.');
      return;
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

      Alert.alert('🛍️ Tebrikler!', 'İkinci el futbol ekipmanı ilanınız başarıyla yayınlandı.', [
        {
          text: 'Pazara Git',
          onPress: () => {
            setGearTitle('');
            setGearDescription('');
            router.push('/(tabs)/market');
          },
        },
      ]);
    } catch (e) {
      setErrorMessage('İlan oluşturulurken bir hata meydana geldi.');
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
          {/* Header Title */}
          <Text style={[styles.screenTitle, { color: colors.text }]}>Yeni Oluştur</Text>
          <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
            Halı saha maçı organize et, bölgesel lig kur veya 2. el futbol ekipmanını sat.
          </Text>

          {/* Segmented Tab Switcher (3 Options) */}
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            {/* MATCH TAB */}
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'MATCH' && [styles.tabButtonActive, { backgroundColor: colors.primaryLight }],
              ]}
              onPress={() => {
                setActiveTab('MATCH');
                setErrorMessage(null);
              }}
            >
              <Ionicons
                name="football"
                size={15}
                color={activeTab === 'MATCH' ? colors.black : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'MATCH' ? colors.black : colors.textSecondary },
                  activeTab === 'MATCH' && styles.tabTextActive,
                ]}
              >
                Maç Aç
              </Text>
            </TouchableOpacity>

            {/* LEAGUE TAB */}
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'LEAGUE' && [styles.tabButtonActive, { backgroundColor: colors.primaryLight }],
              ]}
              onPress={() => {
                setActiveTab('LEAGUE');
                setErrorMessage(null);
              }}
            >
              <Ionicons
                name="trophy"
                size={15}
                color={activeTab === 'LEAGUE' ? colors.black : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'LEAGUE' ? colors.black : colors.textSecondary },
                  activeTab === 'LEAGUE' && styles.tabTextActive,
                ]}
              >
                Lig Kur 🏆
              </Text>
            </TouchableOpacity>

            {/* GEAR TAB */}
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'GEAR' && [styles.tabButtonActive, { backgroundColor: colors.primaryLight }],
              ]}
              onPress={() => {
                setActiveTab('GEAR');
                setErrorMessage(null);
              }}
            >
              <Ionicons
                name="shirt"
                size={15}
                color={activeTab === 'GEAR' ? colors.black : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'GEAR' ? colors.black : colors.textSecondary },
                  activeTab === 'GEAR' && styles.tabTextActive,
                ]}
              >
                2. El Sat
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
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

          {/* ================= 1. REGIONAL LEAGUE FORM ================= */}
          {activeTab === 'LEAGUE' && (
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.formHeaderRow}>
                <Ionicons name="trophy" size={20} color="#F59E0B" />
                <Text style={[styles.sectionHeader, { color: colors.text }]}>
                  Bölgesel Halı Saha Ligi Kur
                </Text>
              </View>
              <Text style={[styles.sectionNotice, { color: colors.textSecondary }]}>
                Semtindeki takımları bir araya getir! Otomatik puan durumu, fikstür ve kupa ödüllü amatör ligini hemen başlat.
              </Text>

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
                placeholder="Örn: Kadıköy Süper Halı Saha Ligi"
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
                    placeholder="Kadıköy"
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
                placeholder="Örn: Kalamış Sahil Spor Tesisleri"
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
                placeholder="Örn: 🏆 15.000₺ Şampiyonluk Kupası & Özel Forma Seti"
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
                Lig Standartları & Kuralları (Seçiniz)
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
                placeholder="Örn: Maçlar her Cumartesi 20:00 - 23:00 arası oynanacaktır. Takımlar en az 10 oyuncu bildirmelidir..."
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
          )}

          {/* ================= 2. MATCH FORM ================= */}
          {activeTab === 'MATCH' && (
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Maç & Saha Detayları</Text>

              {/* Title */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Maç Başlığı *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.surfaceBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Örn: Cuma Akşamı Kadıköy 7v7 Çekişmeli Maç"
                placeholderTextColor={colors.textTertiary}
                value={matchTitle}
                onChangeText={setMatchTitle}
              />

              {/* Venue */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Halı Saha Tesis Adı *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.surfaceBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Örn: Kalamış Halı Saha Tesisleri"
                placeholderTextColor={colors.textTertiary}
                value={venueName}
                onChangeText={setVenueName}
              />

              {/* District & Fee */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Semt / İlçe</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Örn: Kadıköy"
                    placeholderTextColor={colors.textTertiary}
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Kişi Başı Ücret (₺) *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="220"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={fee}
                    onChangeText={setFee}
                  />
                </View>
              </View>

              {/* Date & Time */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Tarih</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="18 Ekim Cumartesi"
                    placeholderTextColor={colors.textTertiary}
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Saat Aralığı</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="21:00 - 22:00"
                    placeholderTextColor={colors.textTertiary}
                    value={time}
                    onChangeText={setTime}
                  />
                </View>
              </View>

              {/* Format & Pitch Type */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Maç Formatı</Text>
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

              <Text style={[styles.label, { color: colors.textSecondary }]}>Saha Türü</Text>
              <View style={styles.chipRow}>
                {(['Açık Saha', 'Kapalı Saha'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: pitchType === t ? colors.primary : colors.surfaceLight,
                        borderColor: pitchType === t ? colors.primary : colors.surfaceBorder,
                      },
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

              {/* Missing Positions Selection */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Aranan Eksik Mevkiler * (Çoklu Seçilebilir)
              </Text>
              <View style={styles.chipRow}>
                {(
                  [
                    { pos: 'GK', label: '🧤 Kaleci (GK)' },
                    { pos: 'DEF', label: '🛡️ Defans (DEF)' },
                    { pos: 'MID', label: '🎯 Orta Saha (MID)' },
                    { pos: 'FWD', label: '⚡ Forvet (FWD)' },
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
                          borderColor: isSelected ? colors.danger : colors.surfaceBorder,
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

              {/* Notes */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Açıklama / Katılım Kuralları
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
                placeholder="Örn: Krampon serbesttir, lütfen zamanında tesiste bulunalım..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primaryLight }]}
                onPress={handleCreateMatch}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.black} />
                <Text style={[styles.submitButtonText, { color: colors.black }]}>
                  {isSubmitting ? 'Oluşturuluyor...' : 'Maçı ve Kadroyu Yayınla'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ================= 3. GEAR FORM ================= */}
          {activeTab === 'GEAR' && (
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: colors.text }]}>2. El Ekipman Bilgileri</Text>

              {/* Title */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Ürün Başlığı *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.surfaceBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Örn: Nike Zoom Mercurial Vapor 15 Halı Saha"
                placeholderTextColor={colors.textTertiary}
                value={gearTitle}
                onChangeText={setGearTitle}
              />

              {/* Category */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori</Text>
              <View style={styles.chipRow}>
                {(
                  [
                    { key: 'Boots', label: '👟 Krampon' },
                    { key: 'Jerseys', label: '👕 Forma' },
                    { key: 'Gloves', label: '🧤 Eldiven' },
                    { key: 'Equipment', label: '🛡️ Ekipman' },
                  ] as const
                ).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: category === key ? colors.primary : colors.surfaceLight,
                        borderColor: category === key ? colors.primary : colors.surfaceBorder,
                      },
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

              {/* Brand & Size */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Marka *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Nike, Adidas, Puma..."
                    placeholderTextColor={colors.textTertiary}
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Beden / Numara *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="42 EU, L, 9..."
                    placeholderTextColor={colors.textTertiary}
                    value={size}
                    onChangeText={setSize}
                  />
                </View>
              </View>

              {/* Price & Location */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Fiyat (₺) *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="1250"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Konum / İlçe</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Kadıköy"
                    placeholderTextColor={colors.textTertiary}
                    value={gearLocation}
                    onChangeText={setGearLocation}
                  />
                </View>
              </View>

              {/* Condition */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Kullanım Durumu</Text>
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
                      {
                        backgroundColor: condition === c ? colors.primary : colors.surfaceLight,
                        borderColor: condition === c ? colors.primary : colors.surfaceBorder,
                      },
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

              {/* Description */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Ürün Açıklaması *</Text>
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
                placeholder="Ürünün kaç maç kullanıldığı, kusuru olup olmadığı gibi detayları belirtiniz..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                value={gearDescription}
                onChangeText={setGearDescription}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.accent }]}
                onPress={handleCreateGear}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Ionicons name="pricetag" size={20} color={colors.black} />
                <Text style={[styles.submitButtonText, { color: colors.black }]}>
                  {isSubmitting ? 'Kaydediliyor...' : 'İlanı Pazarda Yayınla'}
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
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
  },
  screenSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  tabButtonActive: {},
  tabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    fontWeight: '800',
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
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  sectionNotice: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: SPACING.md,
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
