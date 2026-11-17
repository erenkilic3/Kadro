import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { RegionalLeague } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../constants/theme';
import { getInitials, stripLeadingSymbols } from '../utils/formatters';

interface LeagueCardProps {
  league: RegionalLeague;
}

export const LeagueCard: React.FC<LeagueCardProps> = ({ league }) => {
  const { colors } = useTheme();

  const isRegistrationOpen = league.status === 'REGISTRATION_OPEN';
  const remainingSlots = Math.max(0, league.maxTeams - league.registeredTeamsCount);
  const fillPercentage = Math.min(
    100,
    Math.round((league.registeredTeamsCount / league.maxTeams) * 100)
  );

  const leaderTeam = [...league.teams].sort((a, b) => b.points - a.points)[0];
  const accentColor = league.themeColor || colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
      ]}
      activeOpacity={0.85}
      onPress={() => router.push(`/league/${league.id}` as any)}
    >
      <View style={[styles.topAccent, { backgroundColor: accentColor }]} />

      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={[styles.locationMeta, { color: colors.textSecondary }]}>
            {league.district} · {league.format}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isRegistrationOpen
                  ? `${colors.primary}18`
                  : `${colors.info}18`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isRegistrationOpen ? colors.primary : colors.info },
              ]}
            >
              {isRegistrationOpen ? 'Kayıtlar Açık' : 'Devam Ediyor'}
            </Text>
          </View>
        </View>

        <Text style={[styles.leagueTitle, { color: colors.text }]} numberOfLines={1}>
          {league.title}
        </Text>
        <Text style={[styles.leagueSeason, { color: colors.textSecondary }]} numberOfLines={1}>
          {league.season} · {league.venueName}
        </Text>

        {/* Prize Strip */}
        <View style={styles.prizeRow}>
          <Ionicons name="trophy-outline" size={14} color={colors.warning} />
          <Text style={[styles.prizeText, { color: colors.textSecondary }]} numberOfLines={1}>
            {stripLeadingSymbols(league.prize)}
          </Text>
        </View>

        {/* Teams Capacity Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>
              {league.registeredTeamsCount} / {league.maxTeams} Takım
            </Text>
            {isRegistrationOpen && remainingSlots > 0 ? (
              <Text style={[styles.progressRemaining, { color: colors.primary }]}>
                {remainingSlots} boş yer
              </Text>
            ) : null}
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceLight }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${fillPercentage}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.metaFooter, { borderTopColor: colors.surfaceBorder }]}>
          {leaderTeam && leaderTeam.played > 0 ? (
            <View style={styles.leaderRow}>
              <View style={[styles.leaderCrest, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.leaderCrestText, { color: colors.text }]}>
                  {getInitials(leaderTeam.name)}
                </Text>
              </View>
              <Text style={[styles.leaderText, { color: colors.textSecondary }]} numberOfLines={1}>
                Lider: <Text style={{ color: colors.text, fontWeight: '700' }}>{leaderTeam.name}</Text>{' '}
                ({leaderTeam.points} P)
              </Text>
            </View>
          ) : (
            <Text style={[styles.feeText, { color: colors.textSecondary }]}>
              Katılım:{' '}
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {league.entryFee > 0 ? `₺${league.entryFee} / takım` : 'Ücretsiz'}
              </Text>
            </Text>
          )}

          <View style={styles.detailLink}>
            <Text style={[styles.detailBtnText, { color: colors.primary }]}>Detay</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm + 2,
    overflow: 'hidden',
  },
  topAccent: {
    height: 2,
    width: '100%',
  },
  cardContent: {
    padding: SPACING.md + 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  leagueTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  leagueSeason: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    marginBottom: 10,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  prizeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
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
    ...NUMERIC_STYLE,
  },
  progressRemaining: {
    fontSize: 11,
    fontWeight: '700',
    ...NUMERIC_STYLE,
  },
  progressBarBg: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  metaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    paddingRight: 8,
  },
  leaderCrest: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderCrestText: {
    fontSize: 9,
    fontWeight: '800',
  },
  leaderText: {
    fontSize: 12,
    flex: 1,
  },
  feeText: {
    fontSize: 12,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
