import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MatchPrediction, PredictionChoice } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';
import { getInitials } from '../utils/formatters';

interface MatchPredictionCardProps {
  prediction: MatchPrediction;
  matchId: string;
  onVote: (choice: PredictionChoice) => void;
  compact?: boolean;
}

export const MatchPredictionCard: React.FC<MatchPredictionCardProps> = ({
  prediction,
  onVote,
  compact = false,
}) => {
  const { colors } = useTheme();

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
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
        compact && styles.cardCompact,
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
          {prediction.category === 'Derbi'
            ? 'Derbi Anketi'
            : prediction.category === 'Haftanın Maçı'
            ? 'Haftanın Maçı Anketi'
            : 'Topluluk Tahmini'}
        </Text>
        <Text style={[styles.voteCountText, { color: colors.textTertiary }]}>
          {totalVotes} oy
        </Text>
      </View>

      {/* Matchup Header */}
      <View style={styles.matchupRow}>
        <View style={styles.teamCol}>
          <View style={[styles.teamAvatar, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.teamInitials, { color: colors.primary }]}>
              {getInitials(prediction.team1Name)}
            </Text>
          </View>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
            {prediction.team1Name}
          </Text>
        </View>

        <Text style={[styles.vsText, { color: colors.textTertiary }]}>VS</Text>

        <View style={styles.teamCol}>
          <View style={[styles.teamAvatar, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.teamInitials, { color: colors.info }]}>
              {getInitials(prediction.team2Name)}
            </Text>
          </View>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
            {prediction.team2Name}
          </Text>
        </View>
      </View>

      {/* Voting Options: 1 - X - 2 */}
      <View style={styles.buttonsRow}>
        {(
          [
            { choice: '1' as const, label: 'Ev Sahibi', pct: pct1, accent: colors.primary },
            { choice: 'X' as const, label: 'Berabere', pct: pctX, accent: colors.warning },
            { choice: '2' as const, label: 'Deplasman', pct: pct2, accent: colors.info },
          ]
        ).map((opt) => {
          const isSelected = prediction.userVote === opt.choice;
          return (
            <TouchableOpacity
              key={opt.choice}
              style={[
                styles.voteBtn,
                {
                  backgroundColor: isSelected ? `${opt.accent}18` : colors.surfaceLight,
                  borderColor: isSelected ? opt.accent : 'transparent',
                },
              ]}
              onPress={() => onVote(opt.choice)}
              activeOpacity={0.8}
            >
              <Text style={[styles.voteBtnCode, { color: opt.accent }]}>{opt.choice}</Text>
              <Text style={[styles.voteBtnLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {opt.label}
              </Text>
              {hasVoted && (
                <Text style={[styles.votePercentText, { color: opt.accent }]}>%{opt.pct}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Distribution Bar */}
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
              Tahminin:{' '}
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {getChoiceLabel(prediction.userVote)}
              </Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.md,
  },
  cardCompact: {
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  voteCountText: {
    fontSize: 11,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  teamInitials: {
    fontSize: 11,
    fontWeight: '800',
  },
  teamName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voteBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  voteBtnCode: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
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
    marginTop: SPACING.md,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    gap: 2,
  },
  barSegment: {
    height: '100%',
  },
  userChoiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  userChoiceText: {
    fontSize: FONT_SIZE.xs,
  },
});
