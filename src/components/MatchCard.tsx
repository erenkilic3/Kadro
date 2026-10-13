import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Match } from '../types';
import { COLORS, FONT_SIZE, SPACING } from '../constants/theme';
import { PositionBadge } from './PositionBadge';

interface MatchCardProps {
  match: Match;
  currentUserId?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, currentUserId }) => {
  const isJoined = match.isJoined || match.roster.some((s) => s.assignedPlayer?.id === currentUserId);
  const filledCount = match.roster.filter((s) => s.isFilled).length;
  const missingCount = match.totalSlots - filledCount;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/match/${match.id}`)}
      activeOpacity={0.88}
    >
      {/* Top Row: Date Badge & Fee */}
      <View style={styles.topRow}>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.dateText}>{match.date}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.timeText}>{match.time}</Text>
        </View>

        <View style={styles.feeBadge}>
          <Text style={styles.feeText}>₺{match.feePerPlayer}</Text>
          <Text style={styles.feeSub}>/kişi</Text>
        </View>
      </View>

      {/* Match Title & Venue */}
      <Text style={styles.title} numberOfLines={1}>{match.title}</Text>

      <View style={styles.venueRow}>
        <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
        <Text style={styles.venueText} numberOfLines={1}>
          {match.venueName} — <Text style={styles.districtText}>{match.district}</Text>
        </Text>
      </View>

      {/* Missing Positions Tag Row */}
      <View style={styles.positionsRow}>
        <Text style={styles.positionsLabel}>Aranan:</Text>
        {match.missingPositions.length > 0 ? (
          match.missingPositions.map((pos, idx) => (
            <View key={`${pos}_${idx}`} style={{ marginRight: 6 }}>
              <PositionBadge position={pos} size="sm" />
            </View>
          ))
        ) : (
          <View style={styles.fullBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.fullText}>Kadro Dolu</Text>
          </View>
        )}
      </View>

      {/* Footer Info: Format, Capacity, and Status */}
      <View style={styles.footerRow}>
        <View style={styles.capacityContainer}>
          <View style={styles.formatPill}>
            <Text style={styles.formatText}>{match.format}</Text>
          </View>
          <Text style={styles.capacityText}>
            {filledCount}/{match.totalSlots} Oyuncu
            {missingCount > 0 && (
              <Text style={styles.missingHighlight}> ({missingCount} eksik)</Text>
            )}
          </Text>
        </View>

        {isJoined ? (
          <View style={styles.joinedPill}>
            <Ionicons name="football" size={14} color={COLORS.white} />
            <Text style={styles.joinedText}>Kadrodasın</Text>
          </View>
        ) : (
          <View style={styles.actionPill}>
            <Text style={styles.actionText}>Kadroya Bak</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
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
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  dotSeparator: {
    color: COLORS.textTertiary,
    marginHorizontal: 6,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  feeText: {
    color: COLORS.accent,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  feeSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginLeft: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  venueText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginLeft: 4,
    flex: 1,
  },
  districtText: {
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  positionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: SPACING.md,
  },
  positionsLabel: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginRight: 8,
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fullText: {
    color: COLORS.success,
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
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  formatText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  capacityText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  missingHighlight: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  joinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  joinedText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
