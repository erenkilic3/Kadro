import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MatchupStats, TeamMatchStats } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, SPACING } from '../constants/theme';

interface PreMatchStatsCardProps {
  stats: MatchupStats;
  isCompleted?: boolean;
}

type StatsTab = 'OVERVIEW' | 'H2H' | 'RECENT';

const RESULT_META: Record<'W' | 'D' | 'L', { label: string; colorKey: 'win' | 'draw' | 'loss' }> = {
  W: { label: 'G', colorKey: 'win' },
  D: { label: 'B', colorKey: 'draw' },
  L: { label: 'M', colorKey: 'loss' },
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
    return `${team.teamName} henüz kayıtlı maç oynamadı.`;
  }
  const parts = [
    `${team.played} maçta`,
    `${team.won} galibiyet`,
    team.drawn > 0 ? `${team.drawn} beraberlik` : null,
    `${team.lost} mağlubiyet`,
  ].filter(Boolean);
  return `${parts.join(', ')} • ${team.goalsFor} gol attı, ${team.goalsAgainst} gol yedi`;
}

export const PreMatchStatsCard: React.FC<PreMatchStatsCardProps> = ({
  stats,
  isCompleted = false,
}) => {
  const { colors, isDark } = useTheme();
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
      return (
        <Text style={[styles.emptyFormText, { color: colors.textTertiary }]}>Veri yok</Text>
      );
    }
    return (
      <View style={styles.formDotsRow}>
        {form.slice(-5).map((res, idx) => (
          <View
            key={`${res}_${idx}`}
            style={[styles.formDot, { backgroundColor: getResultColor(res) }]}
          >
            <Text style={styles.formDotText}>{RESULT_META[res].label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const comparisonRows: {
    label: string;
    val1: string | number;
    val2: string | number;
    num1: number;
    num2: number;
    lowerIsBetter?: boolean;
  }[] = [
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
      label: 'Gol Averajı',
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
  const activeRecentColor = selectedRecentTeam === 'TEAM1' ? team1Color : team2Color;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: colors.surfaceBorder,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.headerIconBox, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="stats-chart" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isCompleted ? 'Karşılaşma Takım İstatistikleri' : 'Maç Öncesi Rakip İstatistikleri'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Rakiplerin daha önce oynadığı maçların performans özeti
          </Text>
        </View>
      </View>

      {/* Team 1 vs Team 2 Identity & Quick Record */}
      <View style={styles.teamsHeaderRow}>
        {[
          { team: team1, accent: team1Color, side: 'left' as const },
          { team: team2, accent: team2Color, side: 'right' as const },
        ].map(({ team, accent, side }, idx) => {
          const winRate = getWinRate(team);
          return (
            <React.Fragment key={`${team.teamName}_${side}`}>
              {idx === 1 && (
                <View
                  style={[
                    styles.vsCircle,
                    {
                      backgroundColor: isDark ? colors.surfaceLight : '#EEF2F6',
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.vsText, { color: colors.textSecondary }]}>VS</Text>
                </View>
              )}
              <View
                style={[
                  styles.teamBox,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                    borderColor: `${accent}40`,
                  },
                ]}
              >
                <View style={styles.teamBadgeRow}>
                  <View style={[styles.teamLogoWrap, { backgroundColor: `${accent}20` }]}>
                    {team.logoEmoji ? (
                      <Text style={styles.teamEmoji}>{team.logoEmoji}</Text>
                    ) : (
                      <Ionicons name="shield" size={15} color={accent} />
                    )}
                  </View>
                  <Text style={[styles.winRatePill, { color: accent, backgroundColor: `${accent}18` }]}>
                    %{winRate} Gal.
                  </Text>
                </View>

                <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
                  {team.teamName}
                </Text>

                <Text style={[styles.teamQuickStats, { color: colors.textSecondary }]}>
                  {team.won}G • {team.drawn}B • {team.lost}M
                </Text>
                <Text style={[styles.teamGoalsMini, { color: accent }]}>
                  {team.goalsFor} AG / {team.goalsAgainst} YG
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Readable Natural-Language Summaries */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        {[
          { team: team1, accent: team1Color },
          { team: team2, accent: team2Color },
        ].map(({ team, accent }, idx) => (
          <View
            key={`${team.teamName}_summary_${idx}`}
            style={[
              styles.summaryLineRow,
              idx === 0 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.surfaceBorder,
                paddingBottom: 7,
                marginBottom: 7,
              },
            ]}
          >
            <View style={[styles.summaryDot, { backgroundColor: accent }]} />
            <Text style={[styles.summaryLineText, { color: colors.textSecondary }]}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{team.teamName}: </Text>
              {buildTeamSummarySentence(team)}
            </Text>
          </View>
        ))}
      </View>

      {/* Segmented Tabs */}
      <View
        style={[
          styles.tabsBar,
          {
            backgroundColor: isDark ? colors.surfaceLight : '#EEF2F6',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        {(
          [
            { key: 'OVERVIEW', label: '📊 Karşılaştırma' },
            { key: 'H2H', label: '⚔️ Aralarındaki' },
            { key: 'RECENT', label: '🗓️ Son Maçlar' },
          ] as { key: StatsTab; label: string }[]
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                isActive && {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: colors.surfaceBorder,
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TAB 1: OVERVIEW COMPARISON */}
      {activeTab === 'OVERVIEW' && (
        <View>
          {!hasAnyHistory ? (
            <View
              style={[
                styles.emptyStateBox,
                {
                  backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Ionicons name="information-circle-outline" size={22} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Bu iki takım için henüz kayıtlı geçmiş maç istatistiği bulunmuyor. Maçlar tamamlandıkça gol, galibiyet ve form verileri burada görüntülenecektir.
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
                              fontWeight: team1Better ? '900' : '700',
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
                              fontWeight: team2Better ? '900' : '700',
                            },
                          ]}
                        >
                          {row.val2}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.dualBarTrack,
                          { backgroundColor: isDark ? colors.surfaceLight : '#E2E8F0' },
                        ]}
                      >
                        <View
                          style={[
                            styles.dualBarLeft,
                            {
                              width: `${pct1}%`,
                              backgroundColor: team1Color,
                              opacity: team1Better || !team2Better ? 1 : 0.45,
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
                              opacity: team2Better || !team1Better ? 1 : 0.45,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Recent Form Strip */}
              <View
                style={[
                  styles.formSection,
                  {
                    borderTopColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.formSectionTitle, { color: colors.textSecondary }]}>
                  Son 5 Maç Formu (G: Galibiyet • B: Berabere • M: Mağlubiyet)
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
              <View
                style={[
                  styles.h2hSummaryBox,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
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
                Toplam {headToHead.totalMatches} karşılaşmada goller:{' '}
                <Text style={{ color: team1Color, fontWeight: '800' }}>
                  {headToHead.team1Goals}
                </Text>{' '}
                -{' '}
                <Text style={{ color: team2Color, fontWeight: '800' }}>
                  {headToHead.team2Goals}
                </Text>
              </Text>

              {headToHead.recentMeetings && headToHead.recentMeetings.length > 0 && (
                <View style={styles.meetingsList}>
                  {headToHead.recentMeetings.map((m) => (
                    <View
                      key={m.id}
                      style={[
                        styles.meetingRow,
                        {
                          backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.meetingDate, { color: colors.text }]}>{m.date}</Text>
                        {m.venue ? (
                          <Text style={[styles.meetingVenue, { color: colors.textTertiary }]}>
                            📍 {m.venue}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.meetingScoreWrap}>
                        <Text style={[styles.meetingTeamShort, { color: team1Color }]} numberOfLines={1}>
                          {team1.teamName.split(' ')[0]}
                        </Text>
                        <View
                          style={[
                            styles.scorePill,
                            { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.surfaceBorder },
                          ]}
                        >
                          <Text style={[styles.scorePillText, { color: colors.text }]}>
                            {m.team1Goals} - {m.team2Goals}
                          </Text>
                        </View>
                        <Text style={[styles.meetingTeamShort, { color: team2Color }]} numberOfLines={1}>
                          {team2.teamName.split(' ')[0]}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.emptyStateBox,
                {
                  backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Ionicons name="git-compare-outline" size={22} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {team1.teamName} ve {team2.teamName} daha önce karşı karşıya gelmedi. Bu maç iki ekip arasındaki ilk randevu olacak!
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
                      backgroundColor: isSelected
                        ? `${accent}20`
                        : isDark
                        ? colors.surfaceLight
                        : '#F8FAFC',
                      borderColor: isSelected ? accent : colors.surfaceBorder,
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
              {activeRecentTeam.recentMatches.map((rm) => {
                const resColor = getResultColor(rm.result);
                return (
                  <View
                    key={rm.id}
                    style={[
                      styles.recentMatchRow,
                      {
                        backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                  >
                    <View style={[styles.resultBadge, { backgroundColor: resColor }]}>
                      <Text style={styles.resultBadgeText}>{RESULT_META[rm.result].label}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recentOpponent, { color: colors.text }]} numberOfLines={1}>
                        vs {rm.opponentName}
                      </Text>
                      <Text style={[styles.recentMeta, { color: colors.textTertiary }]}>
                        {rm.date}
                        {rm.competition ? ` • ${rm.competition}` : ''}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.scorePill,
                        {
                          backgroundColor: isDark ? colors.surface : '#FFFFFF',
                          borderColor: `${activeRecentColor}40`,
                        },
                      ]}
                    >
                      <Text style={[styles.scorePillText, { color: colors.text }]}>
                        {rm.goalsFor} - {rm.goalsAgainst}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View
              style={[
                styles.emptyStateBox,
                {
                  backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={22} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {activeRecentTeam.teamName} için henüz tamamlanmış maç detayı bulunmuyor.
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
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.md,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  teamsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  teamBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  teamBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamEmoji: {
    fontSize: 15,
  },
  winRatePill: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  teamName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    minHeight: 34,
  },
  teamQuickStats: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  teamGoalsMini: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 10,
    fontWeight: '900',
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: SPACING.md,
  },
  summaryLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 5,
  },
  summaryLineText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  tabsBar: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '800',
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
    height: 7,
    borderRadius: 4,
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
    borderTopWidth: 1,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  formSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  formTeamsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  formTeamCol: {
    flex: 1,
    gap: 5,
  },
  formTeamName: {
    fontSize: 11,
    fontWeight: '800',
  },
  formDotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  formDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyFormText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  h2hSummaryBox: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
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
    fontWeight: '900',
  },
  h2hLbl: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  h2hGoalsText: {
    fontSize: 11,
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
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  meetingDate: {
    fontSize: 11,
    fontWeight: '700',
  },
  meetingVenue: {
    fontSize: 10,
    marginTop: 2,
  },
  meetingScoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meetingTeamShort: {
    fontSize: 10,
    fontWeight: '800',
    maxWidth: 60,
  },
  scorePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  scorePillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
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
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  recentTeamChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recentList: {
    gap: 8,
  },
  recentMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  resultBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  recentOpponent: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  recentMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  emptyStateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  emptyStateText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
});

