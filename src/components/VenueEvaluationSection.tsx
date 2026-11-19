import React, { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../constants/theme';
import { Match } from '../types';
import { VenueEvaluationModal } from './VenueEvaluationModal';

interface VenueEvaluationSectionProps {
  match: Match;
  currentUserId: string;
}

export const VenueEvaluationSection: React.FC<VenueEvaluationSectionProps> = ({
  match,
  currentUserId,
}) => {
  const { colors } = useTheme();
  const {
    venueEvaluations,
    getVenueByMatch,
    hasUserEvaluatedVenue,
    submitVenueEvaluation,
    deleteVenueEvaluation,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);

  const venue = getVenueByMatch(match);
  const isCompleted = Boolean(match.isCompleted);
  const isParticipant =
    match.organizerId === currentUserId ||
    match.roster.some((slot) => slot.isFilled && slot.assignedPlayer?.id === currentUserId);
  const alreadyRated = hasUserEvaluatedVenue(match.id);

  const myMatchReview = useMemo(
    () =>
      venueEvaluations.find(
        (ev) => ev.matchId === match.id && ev.evaluatorId === currentUserId
      ),
    [venueEvaluations, match.id, currentUserId]
  );

  const handleDeleteOwnReview = () => {
    if (!myMatchReview) return;
    const performDelete = async () => {
      try {
        await deleteVenueEvaluation(myMatchReview.id);
      } catch (err) {
        Alert.alert(
          'Hata',
          err instanceof Error ? err.message : 'Değerlendirme silinemedi.'
        );
      }
    };

    if (Platform.OS === 'web') {
      void performDelete();
      return;
    }
    Alert.alert('Yorumu Sil', 'Tesis değerlendirmenizi kaldırmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void performDelete() },
    ]);
  };

  const metrics = venue
    ? [
        { label: 'Zemin', val: venue.turfRating },
        { label: 'Işık', val: venue.lightingRating },
        { label: 'Duş/Soyunma', val: venue.lockerRoomRating },
        { label: 'İşletme', val: venue.organizationRating },
      ]
    : [];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.sectionKicker, { color: colors.textTertiary }]}>
            HALI SAHA TESİSİ
          </Text>
          <Text style={[styles.venueTitle, { color: colors.text }]} numberOfLines={1}>
            {match.venueName}
          </Text>
          <Text style={[styles.venueSub, { color: colors.textSecondary }]}>
            {match.district}, {match.city} · {match.pitchType}
          </Text>
        </View>

        {venue && venue.evaluationsCount > 0 ? (
          <View style={[styles.ratingPill, { backgroundColor: `${colors.warning}1A` }]}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={[styles.ratingPillVal, { color: colors.text }]}>
              {venue.overallRating.toFixed(1)}
            </Text>
            <Text style={[styles.ratingPillCount, { color: colors.textSecondary }]}>
              ({venue.evaluationsCount})
            </Text>
          </View>
        ) : (
          <View style={[styles.ratingPill, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.ratingPillCount, { color: colors.textTertiary }]}>
              Henüz puansız
            </Text>
          </View>
        )}
      </View>

      {/* Breakdown Metrics when venue has ratings */}
      {venue && venue.evaluationsCount > 0 && (
        <View style={[styles.metricsGrid, { backgroundColor: colors.surfaceLight }]}>
          {metrics.map((m) => (
            <View key={m.label} style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                {m.val.toFixed(1)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textTertiary }]} numberOfLines={1}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* User's submitted review or evaluation action */}
      {isCompleted ? (
        alreadyRated && myMatchReview ? (
          <View style={[styles.myReviewBox, { backgroundColor: colors.surfaceLight }]}>
            <View style={styles.myReviewTop}>
              <View style={styles.ratedBadgeRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.ratedText, { color: colors.primary }]}>
                  Bu maç için tesisi puanladın ({myMatchReview.overallRating.toFixed(1)}/5)
                </Text>
              </View>
              <TouchableOpacity onPress={handleDeleteOwnReview} hitSlop={14}>
                <Ionicons name="trash-outline" size={15} color={colors.danger} />
              </TouchableOpacity>
            </View>
            {myMatchReview.comment ? (
              <Text style={[styles.myComment, { color: colors.textSecondary }]}>
                {`"${myMatchReview.comment}"`}
              </Text>
            ) : null}
          </View>
        ) : isParticipant ? (
          <TouchableOpacity
            style={[styles.evaluateBtn, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="star-outline" size={16} color="#FFFFFF" />
            <Text style={styles.evaluateBtnText}>Halı Saha Tesisini Değerlendir</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.infoMuted, { color: colors.textTertiary }]}>
            Tesisi yalnızca bu maçta oynayan oyuncular değerlendirebilir.
          </Text>
        )
      ) : (
        <Text style={[styles.infoMuted, { color: colors.textTertiary }]}>
          Maç tamamlandıktan sonra zemin, ışıklandırma, duş ve işletme için tesisi puanlayabilirsin.
        </Text>
      )}

      {venue && (
        <TouchableOpacity
          style={[styles.detailLink, { borderTopColor: colors.surfaceBorder }]}
          onPress={() => router.push(`/venue/${venue.id}` as any)}
          activeOpacity={0.75}
        >
          <Text style={[styles.detailLinkText, { color: colors.primary }]}>
            Tesis Profili ve Tüm Yorumlar ({venue.evaluationsCount})
          </Text>
          <Ionicons name="chevron-forward" size={15} color={colors.primary} />
        </TouchableOpacity>
      )}

      <VenueEvaluationModal
        visible={modalVisible}
        matchId={match.id}
        venueId={venue?.id}
        venueName={match.venueName}
        district={match.district}
        pitchType={match.pitchType}
        onClose={() => setModalVisible(false)}
        onSubmit={submitVenueEvaluation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  sectionKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  venueTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  venueSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  ratingPillVal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  ratingPillCount: {
    fontSize: 11,
    fontWeight: '600',
    ...NUMERIC_STYLE,
  },
  metricsGrid: {
    flexDirection: 'row',
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: SPACING.md,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  evaluateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
  },
  evaluateBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  myReviewBox: {
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
  },
  myReviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  ratedText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  myComment: {
    fontSize: FONT_SIZE.xs,
    marginTop: 6,
    lineHeight: 18,
  },
  infoMuted: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  detailLinkText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});
