import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { RegionalLeague } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, SPACING } from '../constants/theme';

interface LeagueCardProps {
  league: RegionalLeague;
  onJoinPress?: (league: RegionalLeague) => void;
}

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, onJoinPress }) => {
  const { colors, isDark } = useTheme();

  const isRegistrationOpen = league.status === 'REGISTRATION_OPEN';
  const remainingSlots = Math.max(0, league.maxTeams - league.registeredTeamsCount);
  const fillPercentage = Math.min(100, Math.round((league.registeredTeamsCount / league.maxTeams) * 100));

  // Leader team (highest points)
  const leaderTeam = [...league.teams].sort((a, b) => b.points - a.points)[0];

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          shadowColor: colors.cardShadow,
        },
      ]}
      activeOpacity={0.9}
      onPress={() => router.push(`/league/${league.id}` as any)}
    >
      {/* Top Banner Accent */}
      <View style={[styles.topAccent, { backgroundColor: league.themeColor || colors.primary }]} />

      <View style={styles.cardContent}>
        {/* Header Row: Region & Status */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.locationBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EEF2F6' }]}>
              <Ionicons name="location-sharp" size={12} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                {league.district}, {league.city}
              </Text>
            </View>

            <View style={[styles.formatBadge, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.formatText, { color: colors.text }]}>{league.format}</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isRegistrationOpen
                  ? isDark
                    ? 'rgba(0, 214, 100, 0.15)'
                    : 'rgba(0, 168, 77, 0.12)'
                  : isDark
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(59, 130, 246, 0.12)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isRegistrationOpen ? colors.primary : '#3B82F6' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isRegistrationOpen ? colors.primary : '#3B82F6' },
              ]}
            >
              {isRegistrationOpen ? 'Kayıtlar Açık' : 'Devam Ediyor'}
            </Text>
          </View>
        </View>

        {/* Title & Season */}
        <View style={styles.titleSection}>
          <Text style={[styles.leagueTitle, { color: colors.text }]} numberOfLines={1}>
            {league.title}
          </Text>
          <Text style={[styles.leagueSeason, { color: colors.textSecondary }]}>
            {league.season} • {league.venueName}
          </Text>
        </View>

        {/* Prize Box */}
        <View
          style={[
            styles.prizeBox,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.25)',
            },
          ]}
        >
          <Ionicons name="trophy" size={16} color="#F59E0B" />
          <Text style={styles.prizeText} numberOfLines={1}>
            {league.prize}
          </Text>
        </View>

        {/* Teams Capacity Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Takım Kontenjanı
            </Text>
            <Text style={[styles.progressCount, { color: colors.text }]}>
              {league.registeredTeamsCount} / {league.maxTeams} Takım
              {isRegistrationOpen && remainingSlots > 0 ? (
                <Text style={{ color: colors.primary, fontWeight: '800' }}>
                  {' '}({remainingSlots} Kontenjan)
                </Text>
              ) : null}
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1C2633' : '#E2E8F0' }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${fillPercentage}%`,
                  backgroundColor: league.themeColor || colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Leader Highlight or Fee Row */}
        <View style={[styles.metaFooter, { borderTopColor: colors.surfaceBorder }]}>
          {leaderTeam && leaderTeam.played > 0 ? (
            <View style={styles.leaderRow}>
              <Text style={styles.leaderMedal}>🥇</Text>
              <Text style={[styles.leaderText, { color: colors.textSecondary }]}>
                Lider:{' '}
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {leaderTeam.name}
                </Text>{' '}
                ({leaderTeam.points} Puan)
              </Text>
            </View>
          ) : (
            <View style={styles.feeRow}>
              <Ionicons name="pricetag-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.feeText, { color: colors.textSecondary }]}>
                Katılım:{' '}
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {league.entryFee > 0 ? `${league.entryFee} ₺ / Takım` : 'Ücretsiz Katılım'}
                </Text>
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.detailBtn, { backgroundColor: colors.surfaceLight }]}
            onPress={() => router.push(`/league/${league.id}` as any)}
          >
            <Text style={[styles.detailBtnText, { color: colors.text }]}>Puan Durumu</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topAccent: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  locationText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  formatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  formatText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  titleSection: {
    marginBottom: 10,
  },
  leagueTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  leagueSeason: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    marginBottom: 12,
  },
  prizeText: {
    color: '#D97706',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    flex: 1,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  metaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  leaderMedal: {
    fontSize: 14,
  },
  leaderText: {
    fontSize: 12,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  feeText: {
    fontSize: 12,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  detailBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
