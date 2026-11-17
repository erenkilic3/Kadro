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
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { LeagueForm } from '../../components/LeagueForm';
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';
import { PlayerPosition, MatchFormat, GearCategory, GearCondition } from '../../types';
import {
  PickedImageAsset,
  pickImageFromLibrary,
  uploadImageToBucket,
} from '../../services/mediaService';
import { validateGearInput, validateMatchInput } from '../../utils/validators';

export default function CreateScreen() {
  const { createMatch, createGearItem, createLeague, currentUser } = useApp();
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
  const [matchCity, setMatchCity] = useState(currentUser.city || 'İstanbul');
  const [district, setDistrict] = useState(currentUser.district || 'Kadıköy');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('18 Ekim Cumartesi');
  const [time, setTime] = useState('21:00 - 22:00');
  const [format, setFormat] = useState<MatchFormat>('7v7');
  const [pitchType, setPitchType] = useState<'Açık Saha' | 'Kapalı Saha'>('Açık Saha');
  const [fee, setFee] = useState('220');
  const [missingPositions, setMissingPositions] = useState<PlayerPosition[]>(['GK', 'DEF']);
  const [notes, setNotes] = useState('');

  // Gear Form State
  const [gearTitle, setGearTitle] = useState('');
  const [category, setCategory] = useState<GearCategory>('Boots');
  const [brand, setBrand] = useState('Nike');
  const [size, setSize] = useState('42.5 EU');
  const [price, setPrice] = useState('1500');
  const [condition, setCondition] = useState<GearCondition>('Çok İyi (Az Kullanılmış)');
  const [gearCity, setGearCity] = useState(currentUser.city || 'İstanbul');
  const [gearDistrict, setGearDistrict] = useState(currentUser.district || 'Kadıköy');
  const [gearDescription, setGearDescription] = useState('');
  const [pickedGearAsset, setPickedGearAsset] = useState<PickedImageAsset | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMissingPosition = (pos: PlayerPosition) => {
    setMissingPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  const handlePickGearImage = async () => {
    const res = await pickImageFromLibrary();
    if (res.error) {
      Alert.alert('Galeri Hatası', res.error);
      return;
    }
    if (res.asset) {
      setPickedGearAsset(res.asset);
    }
  };

  const handleCreateMatch = async () => {
    setErrorMessage(null);
    const parsedFee = Number(fee);
    const validation = validateMatchInput({
      title: matchTitle,
      venueName,
      district,
      city: matchCity,
      date,
      time,
      format,
      feePerPlayer: parsedFee,
      missingPositions,
    });
    if (!validation.valid) {
      return setErrorMessage(validation.error || 'Lütfen tüm zorunlu alanları kontrol edin.');
    }

    try {
      setIsSubmitting(true);
      await createMatch({
        title: matchTitle.trim(),
        venueName: venueName.trim(),
        city: matchCity.trim() || 'İstanbul',
        address: address.trim() || `${district.trim()}, ${matchCity.trim() || 'İstanbul'}`,
        district: district.trim(),
        date: date.trim(),
        time: time.trim(),
        format,
        pitchType,
        feePerPlayer: parsedFee,
        missingPositions,
        notes: notes.trim(),
      });

      Alert.alert('Maç Yayınlandı', 'Maç ilanınız oluşturuldu ve kadro yayına alındı.', [
        {
          text: 'Maçlara Dön',
          onPress: () => {
            setMatchTitle('');
            setVenueName('');
            setAddress('');
            setNotes('');
            router.push('/(tabs)');
          },
        },
      ]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Maç kaydedilirken bir hata oluştu.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGear = async () => {
    setErrorMessage(null);
    const parsedPrice = Number(price);
    const validation = validateGearInput({
      title: gearTitle,
      brand,
      size,
      price: parsedPrice,
      description: gearDescription,
      category,
      condition,
    });
    if (!validation.valid) {
      return setErrorMessage(validation.error || 'Lütfen ilan alanlarını kontrol edin.');
    }

    const cityVal = gearCity.trim() || currentUser.city || 'İstanbul';
    const districtVal = gearDistrict.trim() || currentUser.district || 'Kadıköy';

    try {
      setIsSubmitting(true);
      let uploadedImageUrl: string | undefined;
      if (pickedGearAsset) {
        uploadedImageUrl = await uploadImageToBucket(
          'gear-images',
          currentUser.id,
          pickedGearAsset
        );
      }

      await createGearItem({
        title: gearTitle.trim(),
        category,
        brand: brand.trim(),
        size: size.trim(),
        price: parsedPrice,
        condition,
        city: cityVal,
        district: districtVal,
        location: `${cityVal} / ${districtVal}`,
        description: gearDescription.trim(),
        imageUrl: uploadedImageUrl,
      });

      Alert.alert('İlan Yayınlandı', 'İkinci el ekipman ilanınız pazara eklendi.', [
        {
          text: 'Pazara Git',
          onPress: () => {
            setGearTitle('');
            setGearDescription('');
            setPickedGearAsset(null);
            router.push('/(tabs)/market');
          },
        },
      ]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'İlan oluşturulurken bir hata oluştu.'
      );
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
            <LeagueForm
              initialValues={{
                city: currentUser.city || 'İstanbul',
                district: currentUser.district || 'Kadıköy',
              }}
              submitLabel="Ligi Yayınla"
              onSubmit={async (values) => {
                const newLeague = await createLeague(values);
                Alert.alert('Lig Kuruldu', `"${newLeague.title}" oluşturuldu.`, [
                  {
                    text: 'Lige Git',
                    onPress: () => router.push(`/league/${newLeague.id}` as any),
                  },
                ]);
              }}
            />
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
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Şehir</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="İstanbul"
                    placeholderTextColor={colors.textTertiary}
                    value={matchCity}
                    onChangeText={setMatchCity}
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

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
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
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Açık Adres</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="Cadde / Mahalle"
                    placeholderTextColor={colors.textTertiary}
                    value={address}
                    onChangeText={setAddress}
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
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
                ]}
                onPress={handleCreateMatch}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Maçı Yayınla</Text>
                )}
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

              <Text style={[styles.label, { color: colors.textSecondary }]}>Ürün Fotoğrafı</Text>
              <View style={styles.gearPhotoRow}>
                {pickedGearAsset ? (
                  <Image source={{ uri: pickedGearAsset.uri }} style={styles.gearPreviewImg} />
                ) : (
                  <View
                    style={[
                      styles.gearPreviewPlaceholder,
                      { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Ionicons name="image-outline" size={22} color={colors.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.photoPickBtn,
                      { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder },
                    ]}
                    onPress={handlePickGearImage}
                  >
                    <Ionicons name="camera-outline" size={16} color={colors.text} />
                    <Text style={[styles.photoPickBtnText, { color: colors.text }]}>
                      {pickedGearAsset ? 'Fotoğrafı Değiştir' : 'Galeriden Fotoğraf Seç'}
                    </Text>
                  </TouchableOpacity>
                  {pickedGearAsset && (
                    <TouchableOpacity onPress={() => setPickedGearAsset(null)}>
                      <Text style={[styles.photoRemoveText, { color: colors.danger }]}>
                        Fotoğrafı Kaldır
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

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
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Şehir</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="İstanbul"
                    placeholderTextColor={colors.textTertiary}
                    value={gearCity}
                    onChangeText={setGearCity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>İlçe</Text>
                  <TextInput
                    style={inputStyle}
                    placeholder="Kadıköy"
                    placeholderTextColor={colors.textTertiary}
                    value={gearDistrict}
                    onChangeText={setGearDistrict}
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Fiyat (₺) *</Text>
              <TextInput
                style={inputStyle}
                placeholder="1500"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

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
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
                ]}
                onPress={handleCreateGear}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>İlanı Yayınla</Text>
                )}
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
    fontSize: 24,
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
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  sectionHeader: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: -0.2,
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
  gearPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  gearPreviewImg: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.sm,
  },
  gearPreviewPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  photoPickBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  photoRemoveText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
