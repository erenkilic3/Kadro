import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { PitchLineup } from '../../components/PitchLineup';
import { PositionBadge } from '../../components/PositionBadge';
import { MatchPredictionCard } from '../../components/MatchPredictionCard';
import { PostMatchEvaluationSection } from '../../components/PostMatchEvaluationSection';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { RosterSlot } from '../../types';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matches, currentUser, joinMatchSlot, leaveMatch, votePrediction } = useApp();
  const { colors, isDark } = useTheme();

  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <View style={[styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Maç Bulunamadı"
          description="Aradığınız halı saha maçı kaldırılmış veya süresi dolmuş olabilir."
        />
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isUserJoined = match.roster.some((s) => s.assignedPlayer?.id === currentUser.id);
  const vacantSlots = match.roster.filter((s) => !s.isFilled);
  const filledCount = match.roster.filter((s) => s.isFilled).length;

  const handleSlotSelect = (slot: RosterSlot) => {
    if (slot.isFilled) {
      if (slot.assignedPlayer?.id === currentUser.id) {
        handleLeave();
      } else {
        Alert.alert(
          'Dolu Mevki',
          `Bu mevkide ${slot.assignedPlayer?.name} yer alıyor.`
        );
      }
      return;
    }

    // Vacant slot selected
    Alert.alert(
      'Kadroya Katıl',
      `${slot.position} mevkisine katılmak istediğinizi onaylıyor musunuz? (Ücret: ₺${match.feePerPlayer})`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Onayla ve Katıl',
          onPress: async () => {
            const ok = await joinMatchSlot(match.id, slot.id);
            if (ok) {
              Alert.alert('⚽ Hoş Geldin!', `${slot.position} olarak kadroya eklendin.`);
            }
          },
        },
      ]
    );
  };

  const handleQuickJoin = () => {
    if (vacantSlots.length === 0) {
      Alert.alert('Kadro Dolu', 'Bu maçta tüm mevkiler dolmuştur.');
      return;
    }

    const preferredSlot = vacantSlots.find((s) => s.position === currentUser.position) || vacantSlots[0];

    Alert.alert(
      'Hızlı Katılım',
      `${preferredSlot.position} mevkisine katılmak üzeresiniz. Onaylıyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kadroya Katıl',
          onPress: async () => {
            await joinMatchSlot(match.id, preferredSlot.id);
            Alert.alert('⚽ Başarılı', 'Kadroya başarıyla dahil oldunuz!');
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Kadrodan Ayrıl',
      'Bu maçtaki yerinizi boşaltmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            await leaveMatch(match.id);
            Alert.alert('Ayrıldınız', 'Mevkiniz boş bırakıldı.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Top Banner Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.surfaceBorder,
            shadowColor: colors.cardShadow,
          },
        ]}
      >
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.formatPill,
              { backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.formatText, { color: colors.primary }]}>{match.format}</Text>
          </View>
          <View
            style={[
              styles.pitchPill,
              { backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.pitchText, { color: colors.textSecondary }]}>{match.pitchType}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.feeBadge}>
            <Text style={[styles.feeNumber, { color: colors.accent }]}>₺{match.feePerPlayer}</Text>
            <Text style={[styles.feePer, { color: colors.textSecondary }]}>/kişi</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{match.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar" size={16} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{match.date}</Text>
          <Text style={[styles.metaDot, { color: colors.textTertiary }]}>•</Text>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{match.time}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location" size={16} color={colors.danger} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {match.venueName} ({match.address})
          </Text>
        </View>
      </View>

      {/* Match Prediction Widget Section */}
      {match.prediction && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="trophy" size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Topluluk Maç Tahmini</Text>
          </View>
          <MatchPredictionCard
            prediction={match.prediction}
            matchId={match.id}
            onVote={(choice) => votePrediction(match.id, choice)}
          />
        </View>
      )}

      {/* Organizer Info Box */}
      <View
        style={[
          styles.organizerBox,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <View style={[styles.orgAvatar, { backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7' }]}>
          <Ionicons name="person" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.orgLabel, { color: colors.textTertiary }]}>Kadro Kaptanı / Organizatör</Text>
          <Text style={[styles.orgName, { color: colors.text }]}>{match.organizerName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.accent }]}
          onPress={() => Alert.alert('İletişim', `Organizatör Tel: ${match.organizerPhone}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={15} color="#FFFFFF" />
          <Text style={styles.callBtnText}>İletişim</Text>
        </TouchableOpacity>
      </View>

      {/* Missing Positions Banner */}
      {vacantSlots.length > 0 ? (
        <View
          style={[
            styles.missingBanner,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
              borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
            },
          ]}
        >
          <View style={styles.missingBannerLeft}>
            <Ionicons name="alert-circle" size={18} color={colors.warning} />
            <Text style={[styles.missingBannerTitle, { color: colors.warning }]}>
              {vacantSlots.length} Boş Mevki:
            </Text>
          </View>
          <View style={styles.posChips}>
            {match.missingPositions.map((p, i) => (
              <View key={`${p}_${i}`} style={{ marginLeft: 4 }}>
                <PositionBadge position={p} size="sm" />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.missingBanner,
            {
              borderColor: colors.success,
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4',
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.missingBannerTitle, { color: colors.success, marginLeft: 6 }]}>
            Kadro Tamamlandı! Maça Hazır.
          </Text>
        </View>
      )}

      {/* Tactical Pitch View Section */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="football" size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>İnteraktif Saha Dizilimi</Text>
        <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>
          (Boş mevkiye dokunarak katıl)
        </Text>
      </View>

      <PitchLineup
        roster={match.roster}
        onSelectSlot={handleSlotSelect}
        currentUserId={currentUser.id}
      />

      {/* Roster Table Summary */}
      <View
        style={[
          styles.rosterCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <View
          style={[
            styles.rosterHeader,
            {
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.rosterTitle, { color: colors.text }]}>Oyuncu Listesi</Text>
          <Text style={[styles.rosterCount, { color: colors.primary }]}>
            {filledCount}/{match.totalSlots} Dolu
          </Text>
        </View>

        {match.roster.slice(0, Math.ceil(match.totalSlots / 2)).map((slot) => (
          <View
            key={slot.id}
            style={[
              styles.rosterRow,
              {
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
              },
            ]}
          >
            <View style={styles.slotPos}>
              <PositionBadge position={slot.position} size="sm" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text
                style={[
                  styles.slotName,
                  { color: slot.isFilled ? colors.text : colors.danger },
                  !slot.isFilled && styles.slotVacantText,
                ]}
              >
                {slot.isFilled
                  ? slot.assignedPlayer?.name
                  : '— Boş Mevki (Oyuncu Bekleniyor)'}
              </Text>
            </View>
            {slot.isFilled ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            ) : (
              <TouchableOpacity
                style={[styles.miniJoinBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleSlotSelect(slot)}
              >
                <Text style={styles.miniJoinText}>Katıl</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Notes / Rules */}
      {match.notes ? (
        <View
          style={[
            styles.notesBox,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Text style={[styles.notesTitle, { color: colors.textSecondary }]}>
            Kaptan Notu & Kurallar
          </Text>
          <Text style={[styles.notesBody, { color: colors.text }]}>{match.notes}</Text>
        </View>
      ) : null}

      {/* Post-Match Opponent & Teammate Evaluation Section */}
      <PostMatchEvaluationSection match={match} currentUserId={currentUser.id} />

      {/* Sticky Bottom Action Button */}
      <View style={styles.bottomBar}>
        {isUserJoined ? (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Ionicons name="exit-outline" size={20} color={colors.danger} />
            <Text style={[styles.leaveBtnText, { color: colors.danger }]}>Kadrodan Ayrıl</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.joinBtn,
              {
                backgroundColor: vacantSlots.length > 0 ? colors.primary : colors.surfaceBorder,
              },
              vacantSlots.length === 0 && styles.joinBtnDisabled,
            ]}
            onPress={handleQuickJoin}
            disabled={vacantSlots.length === 0}
          >
            <Ionicons name="football" size={20} color="#FFFFFF" />
            <Text style={styles.joinBtnText}>
              {vacantSlots.length > 0 ? 'Kadroya Hemen Katıl' : 'Kadro Tamamen Doldu'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  formatPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  formatText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  pitchPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pitchText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  feeNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  feePer: {
    fontSize: FONT_SIZE.xs,
    marginLeft: 2,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  metaDot: {
    marginHorizontal: 8,
  },
  sectionWrap: {
    marginBottom: SPACING.xs,
  },
  organizerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  orgAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  orgName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    marginTop: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 4,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  missingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  missingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  missingBannerTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  posChips: {
    flexDirection: 'row',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginLeft: 6,
  },
  sectionHint: {
    fontSize: FONT_SIZE.xs,
    marginLeft: 6,
    fontWeight: '500',
  },
  rosterCard: {
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  rosterTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  rosterCount: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  slotPos: {
    width: 65,
  },
  slotName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  slotVacantText: {
    fontStyle: 'italic',
  },
  miniJoinBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniJoinText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  notesBox: {
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
  },
  notesTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginBottom: 4,
  },
  notesBody: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  bottomBar: {
    marginTop: SPACING.xl,
  },
  joinBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  joinBtnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  leaveBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  leaveBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});

