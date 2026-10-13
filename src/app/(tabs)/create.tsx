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
import { COLORS, FONT_SIZE, SPACING } from '../../constants/theme';
import { PlayerPosition, MatchFormat, GearCategory, GearCondition } from '../../types';

export default function CreateScreen() {
  const { createMatch, createGearItem } = useApp();
  const [activeTab, setActiveTab] = useState<'MATCH' | 'GEAR'>('MATCH');

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

  // Gear Form State
  const [gearTitle, setGearTitle] = useState('');
  const [category, setCategory] = useState<GearCategory>('Boots');
  const [brand, setBrand] = useState('Nike');
  const [size, setSize] = useState('42.5 EU');
  const [price, setPrice] = useState('1500');
  const [condition, setCondition] = useState<GearCondition>('Çok İyi (Az Kullanılmış)');
  const [gearLocation, setGearLocation] = useState('İstanbul / Kadıköy');
  const [description, setDescription] = useState('');

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

  const handleCreateMatch = async () => {
    setErrorMessage(null);

    // Validation
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
            // Reset form
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

  const handleCreateGear = async () => {
    setErrorMessage(null);

    // Validation
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
    if (!description.trim()) {
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
        description: description.trim(),
      });

      Alert.alert('🛍️ Tebrikler!', 'İkinci el futbol ekipmanı ilanınız başarıyla yayınlandı.', [
        {
          text: 'Pazara Git',
          onPress: () => {
            setGearTitle('');
            setDescription('');
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Title */}
          <Text style={styles.screenTitle}>Yeni İlan Oluştur</Text>
          <Text style={styles.screenSub}>
            Halı saha maçı organize et veya kullanmadığın futbol ekipmanını sat.
          </Text>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'MATCH' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('MATCH');
                setErrorMessage(null);
              }}
            >
              <Ionicons
                name="football"
                size={16}
                color={activeTab === 'MATCH' ? COLORS.black : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'MATCH' && styles.tabTextActive,
                ]}
              >
                ⚽ Maç Oluştur
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'GEAR' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('GEAR');
                setErrorMessage(null);
              }}
            >
              <Ionicons
                name="shirt"
                size={16}
                color={activeTab === 'GEAR' ? COLORS.black : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'GEAR' && styles.tabTextActive,
                ]}
              >
                🛍️ 2. El Eşya Sat
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {activeTab === 'MATCH' ? (
            /* ================= MATCH FORM ================= */
            <View style={styles.formCard}>
              <Text style={styles.sectionHeader}>Maç & Saha Detayları</Text>

              {/* Title */}
              <Text style={styles.label}>Maç Başlığı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Cuma Akşamı Kadıköy 7v7 Çekişmeli Maç"
                placeholderTextColor={COLORS.textTertiary}
                value={matchTitle}
                onChangeText={setMatchTitle}
              />

              {/* Venue */}
              <Text style={styles.label}>Halı Saha Tesis Adı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Kalamış Halı Saha Tesisleri"
                placeholderTextColor={COLORS.textTertiary}
                value={venueName}
                onChangeText={setVenueName}
              />

              {/* District & Address */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Semt / İlçe</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Kadıköy"
                    placeholderTextColor={COLORS.textTertiary}
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Kişi Başı Ücret (₺) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="200"
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="numeric"
                    value={fee}
                    onChangeText={setFee}
                  />
                </View>
              </View>

              {/* Date & Time */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Tarih</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="18 Ekim Cumartesi"
                    placeholderTextColor={COLORS.textTertiary}
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Saat Aralığı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="21:00 - 22:00"
                    placeholderTextColor={COLORS.textTertiary}
                    value={time}
                    onChangeText={setTime}
                  />
                </View>
              </View>

              {/* Format & Pitch Type */}
              <Text style={styles.label}>Maç Formatı</Text>
              <View style={styles.chipRow}>
                {(['5v5', '6v6', '7v7', '8v8'] as MatchFormat[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.choiceChip, format === f && styles.choiceChipActive]}
                    onPress={() => setFormat(f)}
                  >
                    <Text style={[styles.choiceChipText, format === f && styles.choiceChipTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Saha Türü</Text>
              <View style={styles.chipRow}>
                {(['Açık Saha', 'Kapalı Saha'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.choiceChip, pitchType === t && styles.choiceChipActive]}
                    onPress={() => setPitchType(t)}
                  >
                    <Text style={[styles.choiceChipText, pitchType === t && styles.choiceChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Missing Positions Selection */}
              <Text style={styles.label}>Aranan Eksik Mevkiler * (Çoklu Seçilebilir)</Text>
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
                      style={[styles.choiceChip, isSelected && styles.choiceChipMissing]}
                      onPress={() => toggleMissingPosition(pos)}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          isSelected && styles.choiceChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Notes */}
              <Text style={styles.label}>Açıklama / Katılım Kuralları</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Örn: Krampon serbesttir, lütfen zamanında tesiste bulunalım..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateMatch}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color={COLORS.black} />
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Oluşturuluyor...' : 'Maçı ve Kadroyu Yayınla'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= GEAR FORM ================= */
            <View style={styles.formCard}>
              <Text style={styles.sectionHeader}>2. El Ekipman Bilgileri</Text>

              {/* Title */}
              <Text style={styles.label}>Ürün Başlığı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Nike Zoom Mercurial Vapor 15 Halı Saha"
                placeholderTextColor={COLORS.textTertiary}
                value={gearTitle}
                onChangeText={setGearTitle}
              />

              {/* Category */}
              <Text style={styles.label}>Kategori</Text>
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
                    style={[styles.choiceChip, category === key && styles.choiceChipActive]}
                    onPress={() => setCategory(key)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        category === key && styles.choiceChipTextActive,
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
                  <Text style={styles.label}>Marka *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nike, Adidas, Puma..."
                    placeholderTextColor={COLORS.textTertiary}
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Beden / Numara *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="42 EU, L, 9..."
                    placeholderTextColor={COLORS.textTertiary}
                    value={size}
                    onChangeText={setSize}
                  />
                </View>
              </View>

              {/* Price & Location */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Fiyat (₺) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1250"
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Konum / İlçe</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Kadıköy"
                    placeholderTextColor={COLORS.textTertiary}
                    value={gearLocation}
                    onChangeText={setGearLocation}
                  />
                </View>
              </View>

              {/* Condition */}
              <Text style={styles.label}>Kullanım Durumu (Kondisyon)</Text>
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
                    style={[styles.choiceChip, condition === c && styles.choiceChipActive]}
                    onPress={() => setCondition(c)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        condition === c && styles.choiceChipTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description */}
              <Text style={styles.label}>Ürün Açıklaması *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ürünün kaç maç kullanıldığı, kusuru olup olmadığı gibi detayları belirtiniz..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: COLORS.accent }]}
                onPress={handleCreateGear}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Ionicons name="pricetag" size={20} color={COLORS.black} />
                <Text style={styles.submitButtonText}>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
  },
  screenSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  tabTextActive: {
    color: COLORS.black,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    flex: 1,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sectionHeader: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    color: COLORS.text,
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
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  choiceChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  choiceChipMissing: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  choiceChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  choiceChipTextActive: {
    color: COLORS.white,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: SPACING.xl,
    gap: 8,
  },
  submitButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
