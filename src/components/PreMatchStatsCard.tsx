import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MatchupStats, TeamMatchStats } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';
import { getInitials } from '../utils/formatters';

interface PreMatchStatsCardProps {
  stats: MatchupStats;
  isCompleted?: boolean;
}

type StatsTab = 'OVERVIEW' | 'H2H' | 'RECENT';

const RESULT_META: Record<'W' | 'D' | 'L', string> = {
  W: 'G',
  D: 'B',
  L: 'M',
};

function formatGoalDiff(diff: number): string {
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function getWinRate(team: TeamMatchStats): number {
  if (team.played <= 0) return 0;
  return Math.round((team.won / team.played) * 100);
}

function getGoalsPerMatch(team: TeamMatchStats): string {
  if (team.played <= 0) return '0.0';
  return (team.goalsFor / team.played).toFixed(1);
}

function buildTeamSummarySentence(team: TeamMatchStats): string {
  if (team.played === 0) {
    return 'Henüz kayıtlı maç bulunmuyor.';
  }
  const parts = [
    `${team.played} maçta`,
    `${team.won} galibiyet`,
    team.drawn > 0 ? `${team.drawn} beraberlik` : null,
    `${team.lost} mağlubiyet`,
  ].filter(Boolean);
  return `${parts.join(', ')} · ${team.goalsFor} gol attı, ${team.goalsAgainst} gol yedi`;
}

export const PreMatchStatsCard: React.FC<PreMatchStatsCardProps> = ({
  stats,
  isCompleted = false,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<StatsTab>('OVERVIEW');
  const [selectedRecentTeam, setSelectedRecentTeam] = useState<'TEAM1' | 'TEAM2'>('TEAM1');

  const { team1, team2, headToHead } = stats;
  const team1Color = colors.primary;
  const team2Color = colors.info;
  const hasAnyHistory = team1.played > 0 || team2.played > 0;

  const getResultColor = (res: 'W' | 'D' | 'L') => {
    if (res === 'W') return colors.primary;
    if (res === 'D') return colors.warning;
    return colors.danger;
  };

  const renderFormPills = (form: ('W' | 'D' | 'L')[]) => {
    if (form.length === 0) {
      return <Text style={[styles.emptyFormText, { color: colors.textTertiary }]}>Veri yok</Text>;
    }
    return (
      <View style={styles.formDotsRow}>
        {form.slice(-5).map((res, idx) => (
          <View
            key={`${res}_${idx}`}
            style={[styles.formDot, { backgroundColor: getResultColor(res) }]}
          >
            <Text style={styles.formDotText}>{RESULT_META[res]}</Text>
          </View>
        ))}
      </View>
    );
  };

  const comparisonRows = [
    {
      label: 'Oynanan Maç',
      val1: team1.played,
      val2: team2.played,
      num1: team1.played,
      num2: team2.played,
    },
    {
      label: 'Galibiyet',
      val1: team1.won,
      val2: team2.won,
      num1: team1.won,
      num2: team2.won,
    },
    {
      label: 'Beraberlik',
      val1: team1.drawn,
      val2: team2.drawn,
      num1: team1.drawn,
      num2: team2.drawn,
    },
    {
      label: 'Mağlubiyet',
      val1: team1.lost,
      val2: team2.lost,
      num1: team1.lost,
      num2: team2.lost,
      lowerIsBetter: true,
    },
    {
      label: 'Atılan Gol',
      val1: team1.goalsFor,
      val2: team2.goalsFor,
      num1: team1.goalsFor,
      num2: team2.goalsFor,
    },
    {
      label: 'Yenilen Gol',
      val1: team1.goalsAgainst,
      val2: team2.goalsAgainst,
      num1: team1.goalsAgainst,
      num2: team2.goalsAgainst,
      lowerIsBetter: true,
    },
    {
      label: 'Averaj',
      val1: formatGoalDiff(team1.goalsFor - team1.goalsAgainst),
      val2: formatGoalDiff(team2.goalsFor - team2.goalsAgainst),
      num1: Math.max(0, team1.goalsFor - team1.goalsAgainst + 20),
      num2: Math.max(0, team2.goalsFor - team2.goalsAgainst + 20),
    },
    {
      label: 'Maç Başı Gol',
      val1: getGoalsPerMatch(team1),
      val2: getGoalsPerMatch(team2),
      num1: team1.played > 0 ? team1.goalsFor / team1.played : 0,
      num2: team2.played > 0 ? team2.goalsFor / team2.played : 0,
    },
  ];

  const activeRecentTeam = selectedRecentTeam === 'TEAM1' ? team1 : team2;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isCompleted ? 'Takım İstatistikleri' : 'Maç Öncesi Rakip İstatistikleri'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
          Önceki maçlar
        </Text>
      </View>

      {/* Team 1 vs Team 2 Header */}
      <View style={styles.teamsHeaderRow}>
        {[
          { team: team1, accent: team1Color, side: 'left' as const },
          { team: team2, accent: team2Color, side: 'right' as const },
        ].map(({ team, accent, side }, idx) => (
          <React.Fragment key={`${team.teamName}_${side}`}>
            {idx === 1 && (
              <Text style={[styles.vsText, { color: colors.textTertiary }]}>VS</Text>
            )}
            <View style={[styles.teamBox, { backgroundColor: colors.surfaceLight }]}>
              <View style={styles.teamBadgeRow}>
                <View style={[styles.teamCrest, { backgroundColor: `${accent}20` }]}>
                  <Text style={[styles.teamCrestText, { color: accent }]}>
                    {getInitials(team.teamName)}
                  </Text>
                </View>
                <Text style={[styles.winRateText, { color: accent }]}>
                  %{getWinRate(team)} gal.
                </Text>
              </View>

              <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
                {team.teamName}
              </Text>
              <Text style={[styles.teamQuickStats, { color: colors.textSecondary }]}>
                {team.won}G · {team.drawn}B · {team.lost}M
              </Text>
              <Text style={[styles.teamGoalsMini, { color: colors.textTertiary }]}>
                {team.goalsFor} attı · {team.goalsAgainst} yedi
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Natural-Language Performance Summary */}
      <View style={[styles.summaryList, { borderColor: colors.surfaceBorder }]}>
        {[
          { team: team1, accent: team1Color },
          { team: team2, accent: team2Color },
        ].map(({ team, accent }, idx) => (
          <View
            key={`${team.teamName}_summary_${idx}`}
            style={[
              styles.summaryLineRow,
              idx === 0 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.surfaceBorder,
                paddingBottom: 7,
                marginBottom: 7,
              },
            ]}
          >
            <View style={[styles.summaryDot, { backgroundColor: accent }]} />
            <Text style={[styles.summaryLineText, { color: colors.textSecondary }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{team.teamName}: </Text>
              {buildTeamSummarySentence(team)}
            </Text>
          </View>
        ))}
      </View>

      {/* Clean Segmented Tabs */}
      <View style={[styles.tabsBar, { backgroundColor: colors.surfaceLight }]}>
        {(
          [
            { key: 'OVERVIEW', label: 'Karşılaştırma' },
            { key: 'H2H', label: 'Rekabet' },
            { key: 'RECENT', label: 'Son Maçlar' },
          ] as { key: StatsTab; label: string }[]
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                isActive && { backgroundColor: colors.surface },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: isActive ? colors.text : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TAB 1: COMPARISON */}
      {activeTab === 'OVERVIEW' && (
        <View>
          {!hasAnyHistory ? (
            <View style={[styles.emptyStateBox, { backgroundColor: colors.surfaceLight }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Bu eşleşme için henüz geçmiş maç istatistiği bulunmuyor.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.barsSection}>
                {comparisonRows.map((row) => {
                  const total = row.num1 + row.num2;
                  const pct1 = total > 0 ? Math.round((row.num1 / total) * 100) : 50;
                  const pct2 = total > 0 ? 100 - pct1 : 50;
                  const team1Better = row.lowerIsBetter
                    ? row.num1 < row.num2
                    : row.num1 > row.num2;
                  const team2Better = row.lowerIsBetter
                    ? row.num2 < row.num1
                    : row.num2 > row.num1;

                  return (
                    <View key={row.label} style={styles.statRow}>
                      <View style={styles.statValuesRow}>
                        <Text
                          style={[
                            styles.statValLeft,
                            {
                              color: team1Better ? team1Color : colors.text,
                              fontWeight: team1Better ? '800' : '600',
                            },
                          ]}
                        >
                          {row.val1}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          {row.label}
                        </Text>
                        <Text
                          style={[
                            styles.statValRight,
                            {
                              color: team2Better ? team2Color : colors.text,
                              fontWeight: team2Better ? '800' : '600',
                            },
                          ]}
                        >
                          {row.val2}
                        </Text>
                      </View>

                      <View style={[styles.dualBarTrack, { backgroundColor: colors.surfaceLight }]}>
                        <View
                          style={[
                            styles.dualBarLeft,
                            {
                              width: `${pct1}%`,
                              backgroundColor: team1Color,
                              opacity: team1Better || !team2Better ? 1 : 0.35,
                            },
                          ]}
                        />
                        <View style={styles.dualBarGap} />
                        <View
                          style={[
                            styles.dualBarRight,
                            {
                              width: `${pct2}%`,
                              backgroundColor: team2Color,
                              opacity: team2Better || !team1Better ? 1 : 0.35,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.formSection, { borderTopColor: colors.surfaceBorder }]}>
                <Text style={[styles.formSectionTitle, { color: colors.textTertiary }]}>
                  Son 5 Maç Formu (G: Galibiyet, B: Berabere, M: Mağlubiyet)
                </Text>
                <View style={styles.formTeamsGrid}>
                  <View style={styles.formTeamCol}>
                    <Text style={[styles.formTeamName, { color: colors.text }]} numberOfLines={1}>
                      {team1.teamName}
                    </Text>
                    {renderFormPills(team1.form)}
                  </View>
                  <View style={[styles.formTeamCol, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.formTeamName, { color: colors.text }]} numberOfLines={1}>
                      {team2.teamName}
                    </Text>
                    {renderFormPills(team2.form)}
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* TAB 2: HEAD TO HEAD */}
      {activeTab === 'H2H' && (
        <View>
          {headToHead && headToHead.totalMatches > 0 ? (
            <View>
              <View style={[styles.h2hSummaryBox, { backgroundColor: colors.surfaceLight }]}>
                <View style={styles.h2hStatCol}>
                  <Text style={[styles.h2hBigNum, { color: team1Color }]}>
                    {headToHead.team1Wins}
                  </Text>
                  <Text style={[styles.h2hLbl, { color: colors.textSecondary }]} numberOfLines={1}>
                    {team1.teamName}
                  </Text>
                </View>

                <View style={styles.h2hStatCol}>
                  <Text style={[styles.h2hBigNum, { color: colors.warning }]}>
                    {headToHead.draws}
                  </Text>
                  <Text style={[styles.h2hLbl, { color: colors.textSecondary }]}>Beraberlik</Text>
                </View>

                <View style={styles.h2hStatCol}>
                  <Text style={[styles.h2hBigNum, { color: team2Color }]}>
                    {headToHead.team2Wins}
                  </Text>
                  <Text style={[styles.h2hLbl, { color: colors.textSecondary }]} numberOfLines={1}>
                    {team2.teamName}
                  </Text>
                </View>
              </View>

              <Text style={[styles.h2hGoalsText, { color: colors.textSecondary }]}>
                {headToHead.totalMatches} maçta toplam gol: {headToHead.team1Goals} -{' '}
                {headToHead.team2Goals}
              </Text>

              {headToHead.recentMeetings && headToHead.recentMeetings.length > 0 && (
                <View style={styles.meetingsList}>
                  {headToHead.recentMeetings.map((m) => (
                    <View
                      key={m.id}
                      style={[styles.meetingRow, { backgroundColor: colors.surfaceLight }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.meetingDate, { color: colors.text }]}>{m.date}</Text>
                        {m.venue ? (
                          <Text style={[styles.meetingVenue, { color: colors.textTertiary }]}>
                            {m.venue}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.meetingScoreWrap}>
                        <Text
                          style={[styles.meetingTeamShort, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {team1.teamName.split(' ')[0]}
                        </Text>
                        <View style={[styles.scorePill, { backgroundColor: colors.surface }]}>
                          <Text style={[styles.scorePillText, { color: colors.text }]}>
                            {m.team1Goals} - {m.team2Goals}
                          </Text>
                        </View>
                        <Text
                          style={[styles.meetingTeamShort, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {team2.teamName.split(' ')[0]}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.emptyStateBox, { backgroundColor: colors.surfaceLight }]}>
              <Ionicons name="git-compare-outline" size={18} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {team1.teamName} ve {team2.teamName} arasında kayıtlı önceki maç bulunmuyor.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* TAB 3: RECENT MATCHES */}
      {activeTab === 'RECENT' && (
        <View>
          <View style={styles.recentTeamToggle}>
            {(
              [
                { key: 'TEAM1', team: team1, accent: team1Color },
                { key: 'TEAM2', team: team2, accent: team2Color },
              ] as const
            ).map(({ key, team, accent }) => {
              const isSelected = selectedRecentTeam === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.recentTeamChip,
                    {
                      backgroundColor: isSelected ? `${accent}18` : colors.surfaceLight,
                      borderColor: isSelected ? accent : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedRecentTeam(key)}
                >
                  <Text
                    style={[
                      styles.recentTeamChipText,
                      { color: isSelected ? accent : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {team.teamName} ({team.recentMatches?.length || 0})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {activeRecentTeam.recentMatches && activeRecentTeam.recentMatches.length > 0 ? (
            <View style={styles.recentList}>
              {activeRecentTeam.recentMatches.map((rm) => (
                <View
                  key={rm.id}
                  style={[styles.recentMatchRow, { backgroundColor: colors.surfaceLight }]}
                >
                  <View style={[styles.resultBadge, { backgroundColor: getResultColor(rm.result) }]}>
                    <Text style={styles.resultBadgeText}>{RESULT_META[rm.result]}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentOpponent, { color: colors.text }]} numberOfLines={1}>
                      {rm.opponentName}
                    </Text>
                    <Text style={[styles.recentMeta, { color: colors.textTertiary }]}>
                      {rm.date}
                      {rm.competition ? ` · ${rm.competition}` : ''}
                    </Text>
                  </View>

                  <View style={[styles.scorePill, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.scorePillText, { color: colors.text }]}>
                      {rm.goalsFor} - {rm.goalsAgainst}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyStateBox, { backgroundColor: colors.surfaceLight }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {activeRecentTeam.teamName} için kayıtlı önceki maç bulunmuyor.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  teamsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  teamBox: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  teamBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamCrest: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCrestText: {
    fontSize: 10,
    fontWeight: '800',
  },
  winRateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    minHeight: 34,
  },
  teamQuickStats: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  teamGoalsMini: {
    fontSize: 11,
    marginTop: 2,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 9,
    marginBottom: SPACING.md,
  },
  summaryLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  summaryDot: {
    width: 5,
    height: 5,
    borderRadius: 1,
    marginTop: 5,
  },
  summaryLineText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  tabsBar: {
    flexDirection: 'row',
    borderRadius: RADIUS.sm,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 4,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  barsSection: {
    gap: 10,
  },
  statRow: {
    gap: 4,
  },
  statValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValLeft: {
    fontSize: FONT_SIZE.xs,
    minWidth: 36,
    textAlign: 'left',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  statValRight: {
    fontSize: FONT_SIZE.xs,
    minWidth: 36,
    textAlign: 'right',
  },
  dualBarTrack: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  dualBarLeft: {
    height: '100%',
  },
  dualBarGap: {
    width: 2,
    backgroundColor: 'transparent',
  },
  dualBarRight: {
    height: '100%',
  },
  formSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm + 2,
  },
  formSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  formTeamsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  formTeamCol: {
    flex: 1,
    gap: 6,
  },
  formTeamName: {
    fontSize: 12,
    fontWeight: '700',
  },
  formDotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  formDot: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyFormText: {
    fontSize: 11,
  },
  h2hSummaryBox: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  h2hStatCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  h2hBigNum: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  h2hLbl: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  h2hGoalsText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  meetingsList: {
    gap: 8,
  },
  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 8,
  },
  meetingDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  meetingVenue: {
    fontSize: 11,
    marginTop: 2,
  },
  meetingScoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meetingTeamShort: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 60,
  },
  scorePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scorePillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  recentTeamToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  recentTeamChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  recentTeamChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recentList: {
    gap: 8,
  },
  recentMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 10,
  },
  resultBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  recentOpponent: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  recentMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyStateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    padding: 12,
    gap: 8,
  },
  emptyStateText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
