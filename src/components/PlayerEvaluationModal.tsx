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
import { FONT_SIZE, SPACING } from '../constants/theme';
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
  { id: 'mvp', label: 'Maçın Adamı (MVP)', icon: '⚡' },
  { id: 'fairplay', label: 'Centilmen Rakip', icon: '🤝' },
  { id: 'wall', label: 'Duvar Defans', icon: '🛡️' },
  { id: 'panther', label: 'Panter Kaleci', icon: '🧤' },
  { id: 'maestro', label: 'Oyun Kurucu', icon: '🎯' },
  { id: 'engine', label: 'Yorulmaz Ciğer', icon: '🏃' },
  { id: 'speed', label: 'Hızlı & Çevik Forvet', icon: '🌪️' },
  { id: 'clean', label: 'Temiz İkili Mücadele', icon: '👟' },
];

const SKILL_LABELS: Record<number, string> = {
  1: 'Geliştirilmeli (1/5)',
  2: 'Ortalama (2/5)',
  3: 'İyi & Dengeli (3/5)',
  4: 'Çok Başarılı (4/5)',
  5: 'Sahaya Hükmetti (5/5)',
};

const FAIR_PLAY_LABELS: Record<number, string> = {
  1: 'Agresif / Centilmen Dışı (1/5)',
  2: 'Zaman Zaman Gergin (2/5)',
  3: 'Standart Halı Saha Fair-Play (3/5)',
  4: 'Saygılı & Centilmen (4/5)',
  5: 'Örnek Sporcu / Kusursuz Fair-Play (5/5)',
};

export const PlayerEvaluationModal: React.FC<PlayerEvaluationModalProps> = ({
  visible,
  matchId,
  matchTitle,
  player,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();

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
          '⭐ Değerlendirildi!',
          `${player.name} hakkında değerlendirmeniz kaydedildi ve oyuncu profiline işlendi. +15 Kadro puanı kazandınız!`,
          [{ text: 'Tamam', onPress: onClose }]
        );
      } else {
        Alert.alert('Bilgi', 'Bu oyuncuyu bu maç için zaten değerlendirdiniz.');
        onClose();
      }
    } catch (e) {
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.playerMetaRow}>
              <View
                style={[
                  styles.avatarBox,
                  {
                    backgroundColor: player.isOpponent
                      ? isDark
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(239, 68, 68, 0.1)'
                      : isDark
                      ? 'rgba(0, 214, 100, 0.15)'
                      : 'rgba(0, 214, 100, 0.1)',
                  },
                ]}
              >
                <Ionicons
                  name={player.isOpponent ? 'shield' : 'people'}
                  size={20}
                  color={player.isOpponent ? colors.danger : colors.primary}
                />
              </View>

              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.playerName, { color: colors.text }]}>{player.name}</Text>
                  <PositionBadge position={player.position} size="sm" />
                </View>
                <Text
                  style={[
                    styles.playerRoleText,
                    { color: player.isOpponent ? colors.danger : colors.primary },
                  ]}
                >
                  {player.isOpponent ? '⚔️ Rakip Oyuncu' : '🛡️ Takım Arkadaşı'} • {matchTitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* 1. Skill Rating */}
            <View style={[styles.ratingCard, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <View style={styles.ratingCardHeader}>
                <Ionicons name="football" size={16} color={colors.primary} />
                <Text style={[styles.ratingTitle, { color: colors.text }]}>
                  Saha İçi Yetenek & Performans
                </Text>
              </View>
              <Text style={[styles.ratingSubLabel, { color: colors.primary }]}>
                {SKILL_LABELS[skillRating]}
              </Text>

              {/* Star selector */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={styles.starTouch}
                    onPress={() => setSkillRating(star)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={star <= skillRating ? 'star' : 'star-outline'}
                      size={32}
                      color={star <= skillRating ? '#F59E0B' : colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Fair Play Rating */}
            <View style={[styles.ratingCard, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <View style={styles.ratingCardHeader}>
                <Ionicons name="heart" size={16} color="#EC4899" />
                <Text style={[styles.ratingTitle, { color: colors.text }]}>
                  Fair-Play, Saygı & Centilmenlik
                </Text>
              </View>
              <Text style={[styles.ratingSubLabel, { color: '#EC4899' }]}>
                {FAIR_PLAY_LABELS[fairPlayRating]}
              </Text>

              {/* Handshake/Heart selector */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={styles.starTouch}
                    onPress={() => setFairPlayRating(level)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={level <= fairPlayRating ? 'heart' : 'heart-outline'}
                      size={30}
                      color={level <= fairPlayRating ? '#EC4899' : colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Player Badges (Rozet Verme) */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Oyuncuya Rozet Hediye Et (Çoklu Seçilebilir)
            </Text>
            <View style={styles.badgesGrid}>
              {BADGES_LIST.map((b) => {
                const isSelected = selectedBadges.includes(b.label);
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.badgeChip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(0, 214, 100, 0.15)'
                            : 'rgba(0, 168, 77, 0.12)'
                          : colors.surfaceLight,
                        borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => toggleBadge(b.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 15 }}>{b.icon}</Text>
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

            {/* 4. Feedback Comment */}
            <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 14 }]}>
              {player.isOpponent ? 'Rakibe Not / Yorum (Opsiyonel)' : 'Oyuncuya Not (Opsiyonel)'}
            </Text>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Örn: Sert ama çok dürüst ve saygılı oynadı, rövanş maçına mutlaka bekliyoruz..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Kaydediliyor...' : 'Değerlendirmeyi Tamamla (+15 Kadro Puanı)'}
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  playerRoleText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 2,
  },
  scrollBody: {
    padding: SPACING.lg,
  },
  ratingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  ratingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ratingTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  ratingSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  starTouch: {
    padding: 6,
  },
  sectionHeading: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 4,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  commentInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
    height: 72,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
  },
});
