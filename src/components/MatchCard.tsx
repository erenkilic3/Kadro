import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Match, PredictionChoice } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { FONT_SIZE, SPACING } from '../constants/theme';
import { PositionBadge } from './PositionBadge';

interface MatchCardProps {
  match: Match;
  currentUserId?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, currentUserId }) => {
  const { colors, isDark } = useTheme();
  const { votePrediction } = useApp();

  const isJoined = match.isJoined || match.roster.some((s) => s.assignedPlayer?.id === currentUserId);
  const filledCount = match.roster.filter((s) => s.isFilled).length;
  const missingCount = match.totalSlots - filledCount;

  const pred = match.prediction;
  const totalVotes = pred ? (pred.votesTeam1 || 0) + (pred.votesDraw || 0) + (pred.votesTeam2 || 0) : 0;

  const handleQuickVote = (e: any, choice: PredictionChoice) => {
    e.stopPropagation();
    votePrediction(match.id, choice);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.surfaceBorder : '#E2E8F0',
          shadowColor: colors.cardShadow,
        },
      ]}
      onPress={() => router.push(`/match/${match.id}`)}
      activeOpacity={0.88}
    >
      {/* Top Row: Date Badge, Urgency & Fee */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.dateBadge,
            { backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9' },
          ]}
        >
          <Ionicons name="calendar-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.dateText, { color: colors.primary }]}>{match.date}</Text>
          <Text style={[styles.dotSeparator, { color: colors.textTertiary }]}>•</Text>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{match.time}</Text>
        </View>

        <View style={styles.feeBadge}>
          <Text style={[styles.feeText, { color: colors.accent }]}>₺{match.feePerPlayer}</Text>
          <Text style={[styles.feeSub, { color: colors.textSecondary }]}>/kişi</Text>
        </View>
      </View>

      {/* Match Title */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {match.title}
      </Text>

      {/* Venue & District Row */}
      <View style={styles.venueRow}>
        <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
        <Text style={[styles.venueText, { color: colors.textSecondary }]} numberOfLines={1}>
          {match.venueName} —{' '}
          <Text style={[styles.districtText, { color: colors.primary }]}>{match.district}</Text>
        </Text>
      </View>

      {/* Prediction Teaser Box */}
      {pred && (
        <View
          style={[
            styles.predBox,
            {
              backgroundColor: isDark ? `${colors.surfaceLight}80` : '#F8FAFC',
              borderColor: isDark ? colors.surfaceBorder : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.predHeader}>
            <View style={styles.predTag}>
              <Ionicons name="flame" size={11} color={colors.warning} />
              <Text style={[styles.predTagText, { color: colors.warning }]}>
                {pred.category === 'Derbi' ? 'Derbi Tahmini' : 'Maç Tahmini'}
              </Text>
            </View>
            <Text style={[styles.predVotesText, { color: colors.textTertiary }]}>
              {totalVotes} oy • {pred.userVote ? `Tahminin: ${pred.userVote}` : 'Tahmin Yap'}
            </Text>
          </View>

          <View style={styles.predTeamsRow}>
            <Text style={[styles.predTeamText, { color: colors.text }]} numberOfLines={1}>
              {pred.team1Name}
            </Text>
            <View style={[styles.vsCircle, { backgroundColor: isDark ? colors.surface : '#E2E8F0' }]}>
              <Text style={[styles.vsText, { color: colors.accent }]}>vs</Text>
            </View>
            <Text style={[styles.predTeamText, { color: colors.text }]} numberOfLines={1}>
              {pred.team2Name}
            </Text>
          </View>

          {/* Quick 1 - X - 2 buttons */}
          <View style={styles.quickVoteRow}>
            <TouchableOpacity
              style={[
                styles.quickBtn,
                {
                  backgroundColor:
                    pred.userVote === '1'
                      ? `${colors.primary}25`
                      : isDark
                      ? colors.surface
                      : '#FFFFFF',
                  borderColor: pred.userVote === '1' ? colors.primary : colors.surfaceBorder,
                },
              ]}
              onPress={(e) => handleQuickVote(e, '1')}
            >
              <Text style={[styles.quickBtnText, { color: colors.primary }]}>1 (Ev)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickBtn,
                {
                  backgroundColor:
                    pred.userVote === 'X'
                      ? `${colors.warning}25`
                      : isDark
                      ? colors.surface
                      : '#FFFFFF',
                  borderColor: pred.userVote === 'X' ? colors.warning : colors.surfaceBorder,
                },
              ]}
              onPress={(e) => handleQuickVote(e, 'X')}
            >
              <Text style={[styles.quickBtnText, { color: colors.warning }]}>X (Berabere)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickBtn,
                {
                  backgroundColor:
                    pred.userVote === '2'
                      ? `${colors.info}25`
                      : isDark
                      ? colors.surface
                      : '#FFFFFF',
                  borderColor: pred.userVote === '2' ? colors.info : colors.surfaceBorder,
                },
              ]}
              onPress={(e) => handleQuickVote(e, '2')}
            >
              <Text style={[styles.quickBtnText, { color: colors.info }]}>2 (Dep)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Post-match evaluation teaser if finished */}
      {match.isCompleted && (
        <View
          style={[
            styles.completedTeaser,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.25)',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="checkmark-done-circle" size={15} color={colors.primary} />
            <Text style={[styles.completedTeaserText, { color: colors.text }]}>
              Maç Tamamlandı {match.finalScore ? `(${match.finalScore.team1} - ${match.finalScore.team2})` : ''}
            </Text>
          </View>
          <View style={[styles.rateTeaserBadge, { backgroundColor: colors.warning }]}>
            <Ionicons name="star" size={11} color="#FFFFFF" />
            <Text style={styles.rateTeaserText}>Rakipleri Puanla</Text>
          </View>
        </View>
      )}

      {/* Missing Positions Tag Row */}
      <View
        style={[
          styles.positionsRow,
          {
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <Text style={[styles.positionsLabel, { color: colors.textTertiary }]}>Aranan:</Text>
        {match.missingPositions.length > 0 ? (
          match.missingPositions.map((pos, idx) => (
            <View key={`${pos}_${idx}`} style={{ marginRight: 6 }}>
              <PositionBadge position={pos} size="sm" />
            </View>
          ))
        ) : (
          <View style={[styles.fullBadge, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.fullText, { color: colors.success }]}>Kadro Dolu</Text>
          </View>
        )}
      </View>

      {/* Footer Info: Format, Capacity, and Status */}
      <View style={styles.footerRow}>
        <View style={styles.capacityContainer}>
          <View
            style={[
              styles.formatPill,
              { backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.formatText, { color: colors.textSecondary }]}>
              {match.format}
            </Text>
          </View>
          <Text style={[styles.capacityText, { color: colors.textSecondary }]}>
            {filledCount}/{match.totalSlots} Oyuncu
            {missingCount > 0 && (
              <Text style={[styles.missingHighlight, { color: colors.danger }]}>
                {' '}
                ({missingCount} eksik)
              </Text>
            )}
          </Text>
        </View>

        {isJoined ? (
          <View style={[styles.joinedPill, { backgroundColor: colors.primary }]}>
            <Ionicons name="football" size={13} color={colors.white} />
            <Text style={styles.joinedText}>Kadrodasın</Text>
          </View>
        ) : (
          <View style={styles.actionPill}>
            <Text style={[styles.actionText, { color: colors.primary }]}>İncele</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  dotSeparator: {
    marginHorizontal: 6,
  },
  timeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  feeText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  feeSub: {
    fontSize: FONT_SIZE.xs,
    marginLeft: 2,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    marginBottom: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  venueText: {
    fontSize: FONT_SIZE.sm,
    marginLeft: 4,
    flex: 1,
  },
  districtText: {
    fontWeight: '700',
  },
  predBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: SPACING.sm,
  },
  predHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  predTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  predTagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  predVotesText: {
    fontSize: 10,
    fontWeight: '600',
  },
  predTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  predTeamText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  vsCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  vsText: {
    fontSize: 9,
    fontWeight: '900',
  },
  quickVoteRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  positionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  positionsLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginRight: 8,
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fullText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  formatText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  capacityText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  missingHighlight: {
    fontWeight: '700',
  },
  joinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  joinedText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  completedTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  completedTeaserText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rateTeaserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  rateTeaserText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});


