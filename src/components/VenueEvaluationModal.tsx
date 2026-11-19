import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../constants/theme';
import { SubmitVenueEvaluationInput } from '../types';

export const VENUE_HIGHLIGHT_OPTIONS = [
  'Yeni Suni Çim',
  'Güçlü Aydınlatma',
  'Temiz Duş & Soyunma',
  'Ücretsiz Otopark',
  'Kafeterya / Dinlenme',
  'Kaliteli Top & Yelek',
  'İyi Ulaşım',
  'Güler Yüzlü İşletme',
];

const SCORE_TEXT: Record<number, string> = {
  1: 'Yetersiz (1/5)',
  2: 'Zayıf (2/5)',
  3: 'Orta (3/5)',
  4: 'İyi (4/5)',
  5: 'Mükemmel (5/5)',
};

interface VenueEvaluationModalProps {
  visible: boolean;
  matchId: string;
  venueId?: string;
  venueName: string;
  district: string;
  pitchType: 'Açık Saha' | 'Kapalı Saha';
  onClose: () => void;
  onSubmit: (data: SubmitVenueEvaluationInput) => Promise<boolean>;
}

interface CriterionRowProps {
  title: string;
  subtitle: string;
  value: number;
  onChange: (val: number) => void;
}

const CriterionRow: React.FC<CriterionRowProps> = ({
  title,
  subtitle,
  value,
  onChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.ratingCard, { backgroundColor: colors.surfaceLight }]}>
      <View style={styles.ratingCardTop}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.ratingTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.ratingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        <Text style={[styles.ratingValueLabel, { color: colors.primary }]}>
          {SCORE_TEXT[value]}
        </Text>
      </View>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            style={styles.starTouch}
            onPress={() => onChange(star)}
            hitSlop={8}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={26}
              color={star <= value ? colors.warning : colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export const VenueEvaluationModal: React.FC<VenueEvaluationModalProps> = ({
  visible,
  matchId,
  venueId,
  venueName,
  district,
  pitchType,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();

  const [turfRating, setTurfRating] = useState(5);
  const [lightingRating, setLightingRating] = useState(5);
  const [lockerRoomRating, setLockerRoomRating] = useState(4);
  const [organizationRating, setOrganizationRating] = useState(5);
  const [highlights, setHighlights] = useState<string[]>(['Yeni Suni Çim']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const computedAverage = (
    (turfRating + lightingRating + lockerRoomRating + organizationRating) /
    4
  ).toFixed(2);

  const toggleHighlight = (tag: string) => {
    setHighlights((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const ok = await onSubmit({
        matchId,
        venueId,
        turfRating,
        lightingRating,
        lockerRoomRating,
        organizationRating,
        highlights,
        comment: comment.trim() || undefined,
      });

      if (ok) {
        setComment('');
        Alert.alert(
          'Tesis Puanlandı',
          `${venueName} değerlendirmeniz kaydedildi (+10 Kadro Puanı).`,
          [{ text: 'Tamam', onPress: onClose }]
        );
      } else {
        Alert.alert('Bilgi', 'Bu maç için tesis değerlendirmesini zaten gönderdiniz.');
        onClose();
      }
    } catch (err) {
      Alert.alert(
        'Hata',
        err instanceof Error ? err.message : 'Tesis değerlendirmesi kaydedilemedi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.modalSheet,
            { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.venueTitle, { color: colors.text }]} numberOfLines={1}>
                {venueName}
              </Text>
              <Text style={[styles.venueMeta, { color: colors.textSecondary }]}>
                {district} · {pitchType} · Ort: {computedAverage}/5
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={14}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            <CriterionRow
              title="Zemin Kalitesi"
              subtitle="Suni çim dokusu, esneklik ve saha düzgünlüğü"
              value={turfRating}
              onChange={setTurfRating}
            />

            <CriterionRow
              title="Işıklandırma & Görüş"
              subtitle="Gece aydınlatması ve saha içi görüş netliği"
              value={lightingRating}
              onChange={setLightingRating}
            />

            <CriterionRow
              title="Soyunma Odası & Duş"
              subtitle="Temizlik, sıcak su ve eşya dolapları"
              value={lockerRoomRating}
              onChange={setLockerRoomRating}
            />

            <CriterionRow
              title="Tesis İşletmesi"
              subtitle="Maç saati disiplini, ilgi, top & yelek desteği"
              value={organizationRating}
              onChange={setOrganizationRating}
            />

            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Öne Çıkan Özellikler
            </Text>
            <View style={styles.tagsGrid}>
              {VENUE_HIGHLIGHT_OPTIONS.map((tag) => {
                const selected = highlights.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: selected ? `${colors.primary}18` : colors.surfaceLight,
                        borderColor: selected ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => toggleHighlight(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: selected ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 14 }]}>
              Tesis Yorumu (Opsiyonel)
            </Text>
            <TextInput
              style={[
                styles.commentInput,
                { backgroundColor: colors.surfaceLight, color: colors.text },
              ]}
              placeholder="Zemin, duşlar, ulaşım veya işletme hakkında deneyimini paylaş..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
              value={comment}
              onChangeText={setComment}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Tesis Değerlendirmesini Gönder</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  venueTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  venueMeta: {
    fontSize: 12,
    marginTop: 2,
    ...NUMERIC_STYLE,
  },
  scrollBody: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  ratingCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
  },
  ratingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ratingTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  ratingSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingValueLabel: {
    fontSize: 11,
    fontWeight: '700',
    ...NUMERIC_STYLE,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  starTouch: {
    padding: 4,
  },
  sectionHeading: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentInput: {
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
    height: 82,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
