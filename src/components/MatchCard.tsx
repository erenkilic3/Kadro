import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Match, PredictionChoice } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../constants/theme';
import { PositionBadge } from './PositionBadge';
import { resolveMatchupStats } from '../utils/matchupStats';
import { generateAiMatchPrediction } from '../utils/aiPredictor';

interface MatchCardProps {
  match: Match;
  currentUserId?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, currentUserId }) => {
  const { colors } = useTheme();
  const { leagues, joinRequests, votePrediction, getVenueByMatch } = useApp();
  const venue = getVenueByMatch(match);

  const isJoined =
    match.isJoined || match.roster.some((s) => s.assignedPlayer?.id === currentUserId);
  const isCaptain = Boolean(currentUserId && match.organizerId === currentUserId);
  const incomingPendingCount = isCaptain
    ? joinRequests.filter((r) => r.matchId === match.id && r.status === 'PENDING').length
    : 0;
  const hasUserPendingRequest = Boolean(
    currentUserId &&
      joinRequests.some(
        (r) =>
          r.matchId === match.id &&
          r.requesterId === currentUserId &&
          r.status === 'PENDING'
      )
  );
  const filledCount = match.roster.filter((s) => s.isFilled).length;
  const missingCount = match.totalSlots - filledCount;

  const pred = match.prediction;
  const totalVotes = pred
    ? (pred.votesTeam1 || 0) + (pred.votesDraw || 0) + (pred.votesTeam2 || 0)
    : 0;
  const matchupStats = resolveMatchupStats(match, leagues);
  const aiPred = generateAiMatchPrediction(matchupStats, {
    format: match.format,
    roster: match.roster,
  });

  const handleQuickVote = (e: { stopPropagation: () => void }, choice: PredictionChoice) => {
    e.stopPropagation();
    votePrediction(match.id, choice);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
      ]}
      onPress={() => router.push(`/match/${match.id}`)}
      activeOpacity={0.85}
    >
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <Text style={[styles.dateText, { color: colors.primary }]}>{match.date}</Text>
          <Text style={[styles.metaSep, { color: colors.textTertiary }]}>·</Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{match.time}</Text>
          <View style={[styles.formatChip, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.formatText, { color: colors.textSecondary }]}>
              {match.format}
            </Text>
          </View>
        </View>

        <Text style={[styles.feeText, { color: colors.text }]}>
          ₺{match.feePerPlayer}
          <Text style={[styles.feeSub, { color: colors.textTertiary }]}> /kişi</Text>
        </Text>
      </View>

      {/* Title & Venue */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {match.title}
      </Text>

      <View style={styles.venueRow}>
        <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
        <Text style={[styles.venueText, { color: colors.textSecondary }]} numberOfLines={1}>
          {match.venueName} · {match.district}
        </Text>
        {venue && venue.evaluationsCount > 0 && (
          <View style={[styles.venueRatingBadge, { backgroundColor: `${colors.warning}18` }]}>
            <Ionicons name="star" size={10} color={colors.warning} />
            <Text style={[styles.venueRatingText, { color: colors.text }]}>
              {venue.overallRating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Matchup & Quick Vote Strip */}
      {pred && (
        <View
          style={[
            styles.matchupBox,
            {
              backgroundColor: colors.surfaceLight,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <View style={styles.matchupTop}>
            <Text style={[styles.matchupTeams, { color: colors.text }]} numberOfLines={1}>
              {pred.team1Name} — {pred.team2Name}
            </Text>
            <Text style={[styles.analysisHint, { color: colors.textTertiary }]}>
              Öngörü {aiPred.predictedScore1}-{aiPred.predictedScore2} · {totalVotes} oy
            </Text>
          </View>

          <View style={styles.quickVoteRow}>
            {(
              [
                { choice: '1' as const, label: '1 · Ev' },
                { choice: 'X' as const, label: 'X · Berabere' },
                { choice: '2' as const, label: '2 · Dep' },
              ]
            ).map(({ choice, label }) => {
              const selected = pred.userVote === choice;
              return (
                <TouchableOpacity
                  key={choice}
                  style={[
                    styles.quickBtn,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.surfaceBorder,
                    },
                  ]}
                  onPress={(e) => handleQuickVote(e, choice)}
                >
                  <Text
                    style={[
                      styles.quickBtnText,
                      { color: selected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Completed Match Inline Strip */}
      {match.isCompleted && (
        <View
          style={[
            styles.completedStrip,
            { borderColor: colors.surfaceBorder, backgroundColor: colors.surfaceLight },
          ]}
        >
          <Text style={[styles.completedText, { color: colors.text }]}>
            Maç Sonucu{match.finalScore ? `: ${match.finalScore.team1} - ${match.finalScore.team2}` : ''}
          </Text>
          <Text style={[styles.evaluateLink, { color: colors.primary }]}>
            Oyuncuları Puanla
          </Text>
        </View>
      )}

      {/* Footer: Missing Roles & Capacity */}
      <View style={[styles.footerRow, { borderTopColor: colors.surfaceBorder }]}>
        <View style={styles.positionsWrap}>
          {match.missingPositions.length > 0 ? (
            match.missingPositions.slice(0, 3).map((pos, idx) => (
              <PositionBadge key={`${pos}_${idx}`} position={pos} size="sm" />
            ))
          ) : (
            <Text style={[styles.fullText, { color: colors.success }]}>Kadro tamamlandı</Text>
          )}
        </View>

        <View style={styles.rightFooter}>
          <Text style={[styles.capacityText, { color: colors.textSecondary }]}>
            {filledCount}/{match.totalSlots}
            {missingCount > 0 ? (
              <Text style={{ color: colors.danger, fontWeight: '700' }}>
                {' '}
                ({missingCount} açık)
              </Text>
            ) : null}
          </Text>

          {incomingPendingCount > 0 ? (
            <View style={[styles.joinedDotPill, { backgroundColor: `${colors.warning}20` }]}>
              <Text style={[styles.joinedText, { color: colors.warning }]}>
                {incomingPendingCount} istek
              </Text>
            </View>
          ) : isJoined ? (
            <View style={[styles.joinedDotPill, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.joinedText, { color: colors.primary }]}>Kadrodasın</Text>
            </View>
          ) : hasUserPendingRequest ? (
            <View style={[styles.joinedDotPill, { backgroundColor: `${colors.warning}20` }]}>
              <Text style={[styles.joinedText, { color: colors.warning }]}>Onay Bekliyor</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    padding: SPACING.md + 2,
    marginBottom: SPACING.sm + 2,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  metaSep: {
    marginHorizontal: 5,
    fontSize: FONT_SIZE.xs,
  },
  timeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    ...NUMERIC_STYLE,
  },
  formatChip: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatText: {
    fontSize: 10,
    fontWeight: '700',
    ...NUMERIC_STYLE,
  },
  feeText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  feeSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.md,
  },
  venueText: {
    fontSize: FONT_SIZE.xs,
    flex: 1,
  },
  venueRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  venueRatingText: {
    fontSize: 10.5,
    fontWeight: '700',
    ...NUMERIC_STYLE,
  },
  matchupBox: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    padding: 9,
    marginBottom: SPACING.md,
  },
  matchupTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  matchupTeams: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  analysisHint: {
    fontSize: 10.5,
    fontWeight: '600',
    ...NUMERIC_STYLE,
  },
  quickVoteRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    ...NUMERIC_STYLE,
  },
  evaluateLink: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  positionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  fullText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  rightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '600',
    ...NUMERIC_STYLE,
  },
  joinedDotPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  joinedText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
