import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MatchPrediction, PredictionChoice } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, SPACING } from '../constants/theme';

interface MatchPredictionCardProps {
  prediction: MatchPrediction;
  matchId: string;
  onVote: (choice: PredictionChoice) => void;
  compact?: boolean;
}

export const MatchPredictionCard: React.FC<MatchPredictionCardProps> = ({
  prediction,
  matchId,
  onVote,
  compact = false,
}) => {
  const { colors, isDark } = useTheme();

  const totalVotes =
    (prediction.votesTeam1 || 0) + (prediction.votesDraw || 0) + (prediction.votesTeam2 || 0);

  const pct1 = totalVotes > 0 ? Math.round((prediction.votesTeam1 / totalVotes) * 100) : 33;
  const pctX = totalVotes > 0 ? Math.round((prediction.votesDraw / totalVotes) * 100) : 34;
  const pct2 = totalVotes > 0 ? Math.max(0, 100 - pct1 - pctX) : 33;

  const hasVoted = Boolean(prediction.userVote);

  const getChoiceLabel = (choice?: PredictionChoice) => {
    if (choice === '1') return `${prediction.team1Name} Kazanır`;
    if (choice === 'X') return 'Beraberlik';
    if (choice === '2') return `${prediction.team2Name} Kazanır`;
    return '';
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.surfaceBorder : '#E2E8F0',
          shadowColor: colors.cardShadow,
        },
        compact && styles.cardCompact,
      ]}
    >
      {/* Header Badge & Stats */}
      <View style={styles.headerRow}>
        <View style={[styles.categoryBadge, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="flame" size={12} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {prediction.category === 'Derbi'
              ? 'Günün Derbisi Tahmini'
              : prediction.category === 'Haftanın Maçı'
              ? 'Haftanın Maçı Tahmini'
              : 'Topluluk Tahmini'}
          </Text>
        </View>

        <View style={styles.voteCountBadge}>
          <Ionicons name="people-outline" size={12} color={colors.textTertiary} style={{ marginRight: 3 }} />
          <Text style={[styles.voteCountText, { color: colors.textSecondary }]}>
            {totalVotes} Oy
          </Text>
        </View>
      </View>

      {/* Matchup Header */}
      <View style={styles.matchupRow}>
        <View style={styles.teamCol}>
          <View style={[styles.teamAvatar, { backgroundColor: isDark ? '#1E293B' : '#EEF2F6' }]}>
            <Ionicons name="shield" size={16} color={colors.primaryLight} />
          </View>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
            {prediction.team1Name}
          </Text>
        </View>

        <View style={[styles.vsBadge, { backgroundColor: isDark ? '#1E293B' : '#EEF2F6' }]}>
          <Text style={[styles.vsText, { color: colors.accent }]}>VS</Text>
        </View>

        <View style={styles.teamCol}>
          <View style={[styles.teamAvatar, { backgroundColor: isDark ? '#1E293B' : '#EEF2F6' }]}>
            <Ionicons name="shield-outline" size={16} color={colors.warning} />
          </View>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
            {prediction.team2Name}
          </Text>
        </View>
      </View>

      {/* Voting Options: 1 - X - 2 */}
      <View style={styles.buttonsRow}>
        {/* Team 1 (1) */}
        <TouchableOpacity
          style={[
            styles.voteBtn,
            {
              backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
              borderColor:
                prediction.userVote === '1'
                  ? colors.primary
                  : isDark
                  ? colors.surfaceBorder
                  : '#E2E8F0',
            },
            prediction.userVote === '1' && {
              backgroundColor: `${colors.primary}18`,
              borderWidth: 1.5,
            },
          ]}
          onPress={() => onVote('1')}
          activeOpacity={0.75}
        >
          <Text style={[styles.voteBtnCode, { color: colors.primary }]}>1</Text>
          <Text style={[styles.voteBtnLabel, { color: colors.text }]} numberOfLines={1}>
            Ev Sahibi
          </Text>
          {hasVoted && (
            <Text style={[styles.votePercentText, { color: colors.primaryLight }]}>
              %{pct1}
            </Text>
          )}
        </TouchableOpacity>

        {/* Draw (X) */}
        <TouchableOpacity
          style={[
            styles.voteBtn,
            {
              backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
              borderColor:
                prediction.userVote === 'X'
                  ? colors.warning
                  : isDark
                  ? colors.surfaceBorder
                  : '#E2E8F0',
            },
            prediction.userVote === 'X' && {
              backgroundColor: `${colors.warning}18`,
              borderWidth: 1.5,
            },
          ]}
          onPress={() => onVote('X')}
          activeOpacity={0.75}
        >
          <Text style={[styles.voteBtnCode, { color: colors.warning }]}>X</Text>
          <Text style={[styles.voteBtnLabel, { color: colors.text }]} numberOfLines={1}>
            Berabere
          </Text>
          {hasVoted && (
            <Text style={[styles.votePercentText, { color: colors.warning }]}>
              %{pctX}
            </Text>
          )}
        </TouchableOpacity>

        {/* Team 2 (2) */}
        <TouchableOpacity
          style={[
            styles.voteBtn,
            {
              backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
              borderColor:
                prediction.userVote === '2'
                  ? colors.info
                  : isDark
                  ? colors.surfaceBorder
                  : '#E2E8F0',
            },
            prediction.userVote === '2' && {
              backgroundColor: `${colors.info}18`,
              borderWidth: 1.5,
            },
          ]}
          onPress={() => onVote('2')}
          activeOpacity={0.75}
        >
          <Text style={[styles.voteBtnCode, { color: colors.info }]}>2</Text>
          <Text style={[styles.voteBtnLabel, { color: colors.text }]} numberOfLines={1}>
            Deplasman
          </Text>
          {hasVoted && (
            <Text style={[styles.votePercentText, { color: colors.info }]}>
              %{pct2}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Distribution Progress Bar */}
      {hasVoted && (
        <View style={styles.barContainer}>
          <View style={styles.progressBarWrapper}>
            <View style={[styles.barSegment, { width: `${pct1}%`, backgroundColor: colors.primary }]} />
            <View style={[styles.barSegment, { width: `${pctX}%`, backgroundColor: colors.warning }]} />
            <View style={[styles.barSegment, { width: `${pct2}%`, backgroundColor: colors.info }]} />
          </View>

          <View style={styles.userChoiceBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text style={[styles.userChoiceText, { color: colors.textSecondary }]}>
              Tahminin: <Text style={{ color: colors.text, fontWeight: '700' }}>{getChoiceLabel(prediction.userVote)}</Text> (+25 Puan)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardCompact: {
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  voteCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCountText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
  },
  teamAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  vsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginHorizontal: 8,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voteBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  voteBtnCode: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    marginBottom: 2,
  },
  voteBtnLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  votePercentText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  barContainer: {
    marginTop: SPACING.sm + 2,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  barSegment: {
    height: '100%',
  },
  userChoiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  userChoiceText: {
    fontSize: FONT_SIZE.xs,
  },
});
