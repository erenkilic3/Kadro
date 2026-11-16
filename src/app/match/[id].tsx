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
import { PreMatchStatsCard } from '../../components/PreMatchStatsCard';
import { AiPredictionBotCard } from '../../components/AiPredictionBotCard';
import { PostMatchEvaluationSection } from '../../components/PostMatchEvaluationSection';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';
import { RosterSlot } from '../../types';
import { resolveMatchupStats } from '../../utils/matchupStats';
import { generateAiMatchPrediction } from '../../utils/aiPredictor';
import { getInitials } from '../../utils/formatters';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matches, leagues, currentUser, joinMatchSlot, leaveMatch, votePrediction } = useApp();
  const { colors } = useTheme();

  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <View style={[styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Maç bulunamadı"
          description="Aradığınız maç ilanı kaldırılmış veya süresi dolmuş olabilir."
          buttonText="Geri Dön"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const isUserJoined = match.roster.some((s) => s.assignedPlayer?.id === currentUser.id);
  const vacantSlots = match.roster.filter((s) => !s.isFilled);
  const filledCount = match.roster.filter((s) => s.isFilled).length;
  const matchupStats = resolveMatchupStats(match, leagues);
  const aiPrediction = generateAiMatchPrediction(matchupStats, {
    format: match.format,
    roster: match.roster,
  });

  const handleSlotSelect = (slot: RosterSlot) => {
    if (slot.isFilled) {
      if (slot.assignedPlayer?.id === currentUser.id) {
        handleLeave();
      } else {
        Alert.alert('Dolu Mevki', `Bu mevkide ${slot.assignedPlayer?.name} yer alıyor.`);
      }
      return;
    }

    Alert.alert(
      'Kadroya Katıl',
      `${slot.position} mevkisine katılmak istediğinizi onaylıyor musunuz? (Ücret: ₺${match.feePerPlayer})`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            const ok = await joinMatchSlot(match.id, slot.id);
            if (ok) {
              Alert.alert('Kadroya Eklendiniz', `${slot.position} olarak kadroya katıldınız.`);
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

    const preferredSlot =
      vacantSlots.find((s) => s.position === currentUser.position) || vacantSlots[0];

    Alert.alert(
      'Kadroya Katıl',
      `${preferredSlot.position} mevkisine katılmak üzeresiniz. Onaylıyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Katıl',
          onPress: async () => {
            await joinMatchSlot(match.id, preferredSlot.id);
            Alert.alert('Katılım Başarılı', 'Kadroya başarıyla dahil oldunuz.');
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert('Kadrodan Ayrıl', 'Bu maçtaki yerinizi boşaltmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Ayrıl',
        style: 'destructive',
        onPress: async () => {
          await leaveMatch(match.id);
          Alert.alert('Ayrıldınız', 'Mevkiniz boş bırakıldı.');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Hero Card */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.badgeRow}>
          <View style={[styles.formatPill, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.formatText, { color: colors.primary }]}>{match.format}</Text>
          </View>
          <View style={[styles.formatPill, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.pitchText, { color: colors.textSecondary }]}>
              {match.pitchType}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={[styles.feeNumber, { color: colors.text }]}>
            ₺{match.feePerPlayer}
            <Text style={[styles.feePer, { color: colors.textTertiary }]}> /kişi</Text>
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{match.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={15} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {match.date} · {match.time}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {match.venueName} ({match.address})
          </Text>
        </View>
      </View>

      {/* Pre-Match Opponent Statistics */}
      <PreMatchStatsCard stats={matchupStats} isCompleted={match.isCompleted} />

      {/* Score & Outcome Prediction */}
      <AiPredictionBotCard
        stats={matchupStats}
        prediction={aiPrediction}
        userVote={match.prediction?.userVote}
        isCompleted={match.isCompleted}
        finalScore={match.finalScore}
        onApplyOutcome={
          match.prediction ? (choice) => votePrediction(match.id, choice) : undefined
        }
      />

      {/* Community Prediction Poll */}
      {match.prediction && (
        <MatchPredictionCard
          prediction={match.prediction}
          matchId={match.id}
          onVote={(choice) => votePrediction(match.id, choice)}
        />
      )}

      {/* Organizer Info */}
      <View
        style={[
          styles.organizerBox,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={[styles.orgAvatar, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.orgInitials, { color: colors.text }]}>
            {getInitials(match.organizerName)}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.orgLabel, { color: colors.textTertiary }]}>Organizatör</Text>
          <Text style={[styles.orgName, { color: colors.text }]}>{match.organizerName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.surfaceLight }]}
          onPress={() => Alert.alert('İletişim', `Organizatör Tel: ${match.organizerPhone}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="call-outline" size={15} color={colors.text} />
          <Text style={[styles.callBtnText, { color: colors.text }]}>İletişim</Text>
        </TouchableOpacity>
      </View>

      {/* Missing Positions Summary */}
      <View
        style={[
          styles.missingBanner,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        {vacantSlots.length > 0 ? (
          <>
            <Text style={[styles.missingBannerTitle, { color: colors.text }]}>
              {vacantSlots.length} Boş Mevki
            </Text>
            <View style={styles.posChips}>
              {match.missingPositions.map((p, i) => (
                <PositionBadge key={`${p}_${i}`} position={p} size="sm" />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.readyRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.missingBannerTitle, { color: colors.success }]}>
              Kadro tamamlandı
            </Text>
          </View>
        )}
      </View>

      {/* Tactical Pitch */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Saha Dizilimi</Text>
        <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>
          Boş mevkiye dokunarak katıl
        </Text>
      </View>

      <PitchLineup
        roster={match.roster}
        onSelectSlot={handleSlotSelect}
        currentUserId={currentUser.id}
      />

      {/* Roster Table */}
      <View
        style={[
          styles.rosterCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={[styles.rosterHeader, { borderBottomColor: colors.surfaceBorder }]}>
          <Text style={[styles.rosterTitle, { color: colors.text }]}>Oyuncu Listesi</Text>
          <Text style={[styles.rosterCount, { color: colors.primary }]}>
            {filledCount}/{match.totalSlots}
          </Text>
        </View>

        {match.roster.slice(0, Math.ceil(match.totalSlots / 2)).map((slot, idx, arr) => (
          <View
            key={slot.id}
            style={[
              styles.rosterRow,
              { borderBottomColor: colors.surfaceBorder },
              idx === arr.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.slotPos}>
              <PositionBadge position={slot.position} size="sm" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text
                style={[
                  styles.slotName,
                  { color: slot.isFilled ? colors.text : colors.textTertiary },
                ]}
              >
                {slot.isFilled ? slot.assignedPlayer?.name : 'Boş mevki'}
              </Text>
            </View>
            {slot.isFilled ? (
              <Ionicons name="checkmark" size={16} color={colors.success} />
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

      {match.notes ? (
        <View
          style={[
            styles.notesBox,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <Text style={[styles.notesTitle, { color: colors.textSecondary }]}>Kaptan Notu</Text>
          <Text style={[styles.notesBody, { color: colors.text }]}>{match.notes}</Text>
        </View>
      ) : null}

      {/* Post-Match Evaluation */}
      <PostMatchEvaluationSection match={match} currentUserId={currentUser.id} />

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {isUserJoined ? (
          <TouchableOpacity
            style={[styles.leaveBtn, { backgroundColor: `${colors.danger}15` }]}
            onPress={handleLeave}
          >
            <Text style={[styles.leaveBtnText, { color: colors.danger }]}>Kadrodan Ayrıl</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.joinBtn,
              {
                backgroundColor: vacantSlots.length > 0 ? colors.primary : colors.surfaceLight,
              },
            ]}
            onPress={handleQuickJoin}
            disabled={vacantSlots.length === 0}
          >
            <Text
              style={[
                styles.joinBtnText,
                { color: vacantSlots.length > 0 ? '#FFFFFF' : colors.textTertiary },
              ]}
            >
              {vacantSlots.length > 0 ? 'Kadroya Hemen Katıl' : 'Kadro Doldu'}
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
  },
  heroCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  formatPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  formatText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pitchText: {
    fontSize: 11,
    fontWeight: '600',
  },
  feeNumber: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  feePer: {
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 6,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    flex: 1,
  },
  organizerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.md,
  },
  orgAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgInitials: {
    fontSize: 12,
    fontWeight: '800',
  },
  orgLabel: {
    fontSize: 11,
  },
  orgName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginTop: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    gap: 5,
  },
  callBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  missingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  missingBannerTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  posChips: {
    flexDirection: 'row',
    gap: 5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: SPACING.xs,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  sectionHint: {
    fontSize: 11,
  },
  rosterCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.sm,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
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
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  slotPos: {
    width: 60,
  },
  slotName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  miniJoinBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniJoinText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  notesBox: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notesTitle: {
    fontSize: 11,
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
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  leaveBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
