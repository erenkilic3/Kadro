import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { PositionBadge } from './PositionBadge';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';
import { PlayerPosition } from '../types';

export interface EvaluationTargetPlayer {
  id: string;
  name: string;
  position: PlayerPosition;
  isOpponent: boolean;
  currentRating?: number;
  currentFairPlay?: number;
}

interface PlayerEvaluationModalProps {
  visible: boolean;
  matchId: string;
  matchTitle: string;
  player: EvaluationTargetPlayer | null;
  onClose: () => void;
  onSubmit: (data: {
    matchId: string;
    matchTitle: string;
    targetPlayerId: string;
    targetPlayerName: string;
    targetPlayerPosition: PlayerPosition;
    isOpponent: boolean;
    skillRating: number;
    fairPlayRating: number;
    badges: string[];
    comment?: string;
  }) => Promise<boolean>;
}

const BADGES_LIST = [
  { id: 'mvp', label: 'Maçın Adamı (MVP)' },
  { id: 'fairplay', label: 'Centilmen Rakip' },
  { id: 'wall', label: 'Duvar Defans' },
  { id: 'panther', label: 'Panter Kaleci' },
  { id: 'maestro', label: 'Oyun Kurucu' },
  { id: 'engine', label: 'Yorulmaz Ciğer' },
  { id: 'speed', label: 'Hızlı Forvet' },
  { id: 'clean', label: 'Temiz Mücadele' },
];

const SKILL_LABELS: Record<number, string> = {
  1: 'Geliştirilmeli (1/5)',
  2: 'Ortalama (2/5)',
  3: 'İyi (3/5)',
  4: 'Çok İyi (4/5)',
  5: 'Maça Damga Vurdu (5/5)',
};

const FAIR_PLAY_LABELS: Record<number, string> = {
  1: 'Agresif (1/5)',
  2: 'Zaman Zaman Gergin (2/5)',
  3: 'Standart (3/5)',
  4: 'Saygılı (4/5)',
  5: 'Örnek Fair-Play (5/5)',
};

export const PlayerEvaluationModal: React.FC<PlayerEvaluationModalProps> = ({
  visible,
  matchId,
  matchTitle,
  player,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();

  const [skillRating, setSkillRating] = useState<number>(5);
  const [fairPlayRating, setFairPlayRating] = useState<number>(5);
  const [selectedBadges, setSelectedBadges] = useState<string[]>(['Centilmen Rakip']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!player) return null;

  const toggleBadge = (badgeLabel: string) => {
    if (selectedBadges.includes(badgeLabel)) {
      setSelectedBadges(selectedBadges.filter((b) => b !== badgeLabel));
    } else {
      setSelectedBadges([...selectedBadges, badgeLabel]);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const success = await onSubmit({
        matchId,
        matchTitle,
        targetPlayerId: player.id,
        targetPlayerName: player.name,
        targetPlayerPosition: player.position,
        isOpponent: player.isOpponent,
        skillRating,
        fairPlayRating,
        badges: selectedBadges,
        comment: comment.trim(),
      });

      if (success) {
        Alert.alert(
          'Değerlendirme Kaydedildi',
          `${player.name} için verdiğiniz puanlar oyuncu profiline işlendi.`,
          [{ text: 'Tamam', onPress: onClose }]
        );
      } else {
        Alert.alert('Bilgi', 'Bu oyuncuyu bu maç için zaten değerlendirdiniz.');
        onClose();
      }
    } catch {
      Alert.alert('Hata', 'Değerlendirme kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.playerName, { color: colors.text }]}>{player.name}</Text>
                <PositionBadge position={player.position} size="sm" />
              </View>
              <Text style={[styles.playerRoleText, { color: colors.textSecondary }]}>
                {player.isOpponent ? 'Rakip Oyuncu' : 'Takım Arkadaşı'} · {matchTitle}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={14}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Skill Rating */}
            <View style={[styles.ratingCard, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.ratingTitle, { color: colors.text }]}>
                Saha İçi Performans
              </Text>
              <Text style={[styles.ratingSubLabel, { color: colors.primary }]}>
                {SKILL_LABELS[skillRating]}
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={styles.starTouch}
                    onPress={() => setSkillRating(star)}
                  >
                    <Ionicons
                      name={star <= skillRating ? 'star' : 'star-outline'}
                      size={28}
                      color={star <= skillRating ? colors.warning : colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fair Play Rating */}
            <View style={[styles.ratingCard, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.ratingTitle, { color: colors.text }]}>
                Fair-Play ve Centilmenlik
              </Text>
              <Text style={[styles.ratingSubLabel, { color: colors.primary }]}>
                {FAIR_PLAY_LABELS[fairPlayRating]}
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={styles.starTouch}
                    onPress={() => setFairPlayRating(level)}
                  >
                    <Ionicons
                      name={level <= fairPlayRating ? 'heart' : 'heart-outline'}
                      size={28}
                      color={level <= fairPlayRating ? colors.primary : colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Badges */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Rozetler</Text>
            <View style={styles.badgesGrid}>
              {BADGES_LIST.map((b) => {
                const isSelected = selectedBadges.includes(b.label);
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.badgeChip,
                      {
                        backgroundColor: isSelected ? `${colors.primary}18` : colors.surfaceLight,
                        borderColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => toggleBadge(b.label)}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isSelected ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {b.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Comment */}
            <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 14 }]}>
              Not (Opsiyonel)
            </Text>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: colors.surfaceLight,
                  color: colors.text,
                },
              ]}
              placeholder="Maç içindeki oyun tarzı veya iletişim hakkında kısa not..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Kaydediliyor...' : 'Değerlendirmeyi Gönder'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  playerRoleText: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollBody: {
    padding: SPACING.lg,
  },
  ratingCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  ratingTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  ratingSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  starTouch: {
    padding: 4,
  },
  sectionHeading: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginBottom: 8,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentInput: {
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
    height: 76,
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
