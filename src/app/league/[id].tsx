import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../../components/EmptyState';
import { PreMatchStatsCard } from '../../components/PreMatchStatsCard';
import { AiPredictionBotCard } from '../../components/AiPredictionBotCard';
import { LeagueForm } from '../../components/LeagueForm';
import { ReportModal } from '../../components/ReportModal';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../../constants/theme';
import { LeagueFixture } from '../../types';
import { resolveLeagueFixtureMatchupStats } from '../../utils/matchupStats';
import { generateAiMatchPrediction } from '../../utils/aiPredictor';
import { getInitials, stripLeadingSymbols } from '../../utils/formatters';
import { validateMatchScores, validateTeamName } from '../../utils/validators';

type LeagueTab = 'STANDINGS' | 'FIXTURES' | 'TEAMS' | 'RULES';

const FORM_LABEL: Record<'W' | 'D' | 'L', string> = {
  W: 'G',
  D: 'B',
  L: 'M',
};

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    leagues,
    teams,
    joinLeague,
    updateLeague,
    deleteLeague,
    generateLeagueFixtures,
    recordFixtureResult,
    currentUser,
  } = useApp();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<LeagueTab>('STANDINGS');
  const [selectedWeek, setSelectedWeek] = useState<number>(6);
  const [selectedFixture, setSelectedFixture] = useState<LeagueFixture | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState(currentUser.name || '');
  const [captainPhone, setCaptainPhone] = useState(currentUser.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [generatingFixtures, setGeneratingFixtures] = useState(false);

  const [scoringFixture, setScoringFixture] = useState<LeagueFixture | null>(null);
  const [homeScoreText, setHomeScoreText] = useState('0');
  const [awayScoreText, setAwayScoreText] = useState('0');
  const [isSavingScore, setIsSavingScore] = useState(false);

  const myCaptainTeams = useMemo(
    () => teams.filter((t) => t.captainId === currentUser.id),
    [teams, currentUser.id]
  );

  const league = useMemo(() => leagues.find((l) => l.id === id), [leagues, id]);

  const sortedTeams = useMemo(() => {
    if (!league) return [];
    return [...league.teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  }, [league]);

  const weeks = useMemo(() => {
    if (!league) return [1];
    const wSet = new Set<number>();
    league.fixtures.forEach((f) => wSet.add(f.week));
    const arr = Array.from(wSet).sort((a, b) => b - a);
    return arr.length > 0 ? arr : [1];
  }, [league]);

  const activeWeek = weeks.includes(selectedWeek) ? selectedWeek : weeks[0];

  const activeWeekFixtures = useMemo(() => {
    if (!league) return [];
    return league.fixtures.filter((f) => f.week === activeWeek);
  }, [league, activeWeek]);

  const selectedFixtureStats = useMemo(() => {
    if (!league || !selectedFixture) return null;
    return resolveLeagueFixtureMatchupStats(selectedFixture, league);
  }, [league, selectedFixture]);

  const selectedFixtureAiPrediction = useMemo(() => {
    if (!league || !selectedFixtureStats) return null;
    return generateAiMatchPrediction(selectedFixtureStats, { format: league.format });
  }, [league, selectedFixtureStats]);

  if (!league) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Lig bulunamadı"
          description="Görüntülemek istediğiniz lig sistemde bulunamadı."
          buttonText="Liglere Dön"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const isOrganizer = league.organizerId === currentUser.id;
  const isRegistrationOpen = league.status === 'REGISTRATION_OPEN';
  const remainingSlots = Math.max(0, league.maxTeams - league.registeredTeamsCount);
  const accentColor = league.themeColor || colors.primary;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${league.title} (${league.season}) — ${league.venueName}, ${league.district}. Ödül: ${stripLeadingSymbols(league.prize)}`,
      });
    } catch {
      // Ignored
    }
  };

  const handleDeleteLeague = () => {
    const runDelete = async () => {
      try {
        await deleteLeague(league.id);
        router.back();
      } catch (err) {
        Alert.alert('Hata', err instanceof Error ? err.message : 'Lig silinemedi.');
      }
    };

    if (Platform.OS === 'web') {
      void runDelete();
      return;
    }
    Alert.alert('Ligi Sil', 'Bu ligi ve fikstür verilerini kalıcı olarak silmek istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Ligi Sil', style: 'destructive', onPress: () => void runDelete() },
    ]);
  };

  const handleGenerateFixtures = async () => {
    if (league.teams.length < 2) {
      Alert.alert('Yetersiz Takım', 'Fikstür oluşturmak için en az 2 takım kayıtlı olmalıdır.');
      return;
    }
    try {
      setGeneratingFixtures(true);
      await generateLeagueFixtures(league);
      Alert.alert('Fikstür Oluşturuldu', 'Tüm takımlar için devre fikstürü oluşturuldu.');
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Fikstür oluşturulamadı.');
    } finally {
      setGeneratingFixtures(false);
    }
  };

  const openScoreModal = (fixture: LeagueFixture) => {
    setScoringFixture(fixture);
    setHomeScoreText(typeof fixture.homeScore === 'number' ? String(fixture.homeScore) : '0');
    setAwayScoreText(typeof fixture.awayScore === 'number' ? String(fixture.awayScore) : '0');
  };

  const handleSaveFixtureScore = async () => {
    if (!scoringFixture) return;
    const h = Number(homeScoreText);
    const a = Number(awayScoreText);
    const validation = validateMatchScores(h, a);
    if (!validation.valid) {
      Alert.alert('Geçersiz Skor', validation.error || 'Skorlar tam sayı olmalıdır.');
      return;
    }

    try {
      setIsSavingScore(true);
      const ok = await recordFixtureResult(scoringFixture.id, h, a);
      if (ok) {
        setScoringFixture(null);
        Alert.alert('Kaydedildi', 'Maç skoru ve puan durumu güncellendi.');
      } else {
        Alert.alert('Hata', 'Skor kaydedilemedi.');
      }
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Skor kaydedilirken hata oluştu.');
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleRegisterTeam = async () => {
    const validation = validateTeamName(teamName, captainName);
    if (!validation.valid) {
      Alert.alert('Eksik Bilgi', validation.error || 'Lütfen takım ve kaptan adını kontrol edin.');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await joinLeague(
        league.id,
        teamName.trim(),
        captainName.trim(),
        captainPhone.trim(),
        selectedTeamId
      );
      if (success) {
        Alert.alert(
          'Kayıt Tamamlandı',
          `"${teamName.trim()}" takımı ${league.title} ligine kaydedildi.`,
          [{ text: 'Tamam', onPress: () => setModalVisible(false) }]
        );
        setTeamName('');
        setSelectedTeamId(undefined);
      } else {
        Alert.alert('Kayıt Başarısız', 'Lig kontenjanı dolmuş veya takım zaten kayıtlı.');
      }
    } catch (err) {
      Alert.alert(
        'Hata',
        err instanceof Error ? err.message : 'Kayıt sırasında bir problem oluştu.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.topAccent, { backgroundColor: accentColor }]} />

          <View style={styles.heroInner}>
            <View style={styles.heroBadgeRow}>
              <Text style={[styles.metaTag, { color: colors.textSecondary }]}>
                {league.district}, {league.city} · {league.format}
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

            <Text style={[styles.title, { color: colors.text }]}>{league.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {league.season} · {league.venueName}
            </Text>

            <View style={[styles.prizeRow, { backgroundColor: colors.surfaceLight }]}>
              <Ionicons name="trophy-outline" size={16} color={colors.warning} />
              <Text style={[styles.prizeValue, { color: colors.text }]}>
                {stripLeadingSymbols(league.prize)}
              </Text>
            </View>

            <View style={[styles.statsGrid, { borderTopColor: colors.surfaceBorder }]}>
              <View style={styles.statCol}>
                <Text style={[styles.statNum, { color: colors.text }]}>
                  {league.registeredTeamsCount}/{league.maxTeams}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Takım</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.statCol}>
                <Text style={[styles.statNum, { color: colors.text }]}>
                  {league.entryFee > 0 ? `₺${league.entryFee}` : 'Ücretsiz'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Katılım</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.statCol}>
                <Text style={[styles.statNum, { color: colors.text }]}>
                  {isRegistrationOpen ? `${remainingSlots} yer` : 'Dolu'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Kontenjan</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={15} color={colors.text} />
                <Text style={[styles.shareBtnText, { color: colors.text }]}>Paylaş</Text>
              </TouchableOpacity>

              <Text style={[styles.orgText, { color: colors.textTertiary }]} numberOfLines={1}>
                Yönetici: {league.organizerName.split(' ')[0]}
              </Text>
            </View>

            <View style={[styles.organizerToolbar, { borderTopColor: colors.surfaceBorder }]}>
              {isOrganizer ? (
                <>
                  <TouchableOpacity
                    style={[styles.toolbarBtn, { backgroundColor: colors.surfaceLight }]}
                    onPress={() => setEditModalVisible(true)}
                  >
                    <Ionicons name="create-outline" size={14} color={colors.text} />
                    <Text style={[styles.toolbarBtnText, { color: colors.text }]}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toolbarBtn, { backgroundColor: `${colors.danger}15` }]}
                    onPress={handleDeleteLeague}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    <Text style={[styles.toolbarBtnText, { color: colors.danger }]}>Ligi Sil</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.toolbarBtn, { backgroundColor: colors.surfaceLight }]}
                  onPress={() => setReportVisible(true)}
                >
                  <Ionicons name="flag-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.toolbarBtnText, { color: colors.textSecondary }]}>
                    Ligi Bildir
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Underline Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.surfaceBorder }]}>
          {(
            [
              { key: 'STANDINGS', label: 'Puan Durumu' },
              { key: 'FIXTURES', label: 'Fikstür' },
              { key: 'TEAMS', label: 'Takımlar' },
              { key: 'RULES', label: 'Kurallar' },
            ] as { key: LeagueTab; label: string }[]
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && { borderBottomColor: colors.primary }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? colors.text : colors.textTertiary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* STANDINGS */}
        {activeTab === 'STANDINGS' && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View
              style={[
                styles.tableHeaderRow,
                {
                  backgroundColor: colors.surfaceLight,
                  borderBottomColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.thRank, { color: colors.textTertiary }]}>#</Text>
              <Text style={[styles.thTeam, { color: colors.textTertiary }]}>TAKIM</Text>
              <Text style={[styles.thNum, { color: colors.textTertiary }]}>O</Text>
              <Text style={[styles.thNum, { color: colors.textTertiary }]}>G</Text>
              <Text style={[styles.thNum, { color: colors.textTertiary }]}>B</Text>
              <Text style={[styles.thNum, { color: colors.textTertiary }]}>M</Text>
              <Text style={[styles.thNum, { color: colors.textTertiary }]}>AV</Text>
              <Text style={[styles.thPoints, { color: colors.primary }]}>P</Text>
              <Text style={[styles.thForm, { color: colors.textTertiary }]}>FORM</Text>
            </View>

            {sortedTeams.map((team, index) => {
              const isLeader = index === 0 && team.played > 0;
              return (
                <View
                  key={team.id}
                  style={[
                    styles.tableRow,
                    {
                      borderBottomColor: colors.surfaceBorder,
                      borderLeftWidth: isLeader ? 3 : 0,
                      borderLeftColor: isLeader ? colors.primary : 'transparent',
                    },
                    index === sortedTeams.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      { color: isLeader ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {index + 1}
                  </Text>

                  <View style={styles.teamCell}>
                    <View style={[styles.miniCrest, { backgroundColor: colors.surfaceLight }]}>
                      <Text style={[styles.miniCrestText, { color: colors.text }]}>
                        {getInitials(team.name)}
                      </Text>
                    </View>
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                      {team.name}
                    </Text>
                  </View>

                  <Text style={[styles.tdNum, { color: colors.textSecondary }]}>{team.played}</Text>
                  <Text style={[styles.tdNum, { color: colors.textSecondary }]}>{team.won}</Text>
                  <Text style={[styles.tdNum, { color: colors.textSecondary }]}>{team.drawn}</Text>
                  <Text style={[styles.tdNum, { color: colors.textSecondary }]}>{team.lost}</Text>
                  <Text
                    style={[
                      styles.tdNum,
                      {
                        color:
                          team.goalDifference > 0
                            ? colors.primary
                            : team.goalDifference < 0
                            ? colors.danger
                            : colors.textSecondary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                  </Text>
                  <Text style={[styles.tdPoints, { color: colors.text }]}>{team.points}</Text>

                  <View style={styles.formCell}>
                    {team.form.length > 0 ? (
                      team.form.slice(-3).map((res, i) => (
                        <View
                          key={i}
                          style={[
                            styles.formDot,
                            {
                              backgroundColor:
                                res === 'W'
                                  ? colors.primary
                                  : res === 'D'
                                  ? colors.warning
                                  : colors.danger,
                            },
                          ]}
                        >
                          <Text style={styles.formDotText}>{FORM_LABEL[res]}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.formEmptyText, { color: colors.textTertiary }]}>-</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* FIXTURES */}
        {activeTab === 'FIXTURES' && (
          <View>
            {isOrganizer && league.teams.length >= 2 && (
              <TouchableOpacity
                style={[
                  styles.genFixtureBtn,
                  {
                    backgroundColor: `${colors.primary}15`,
                    borderColor: `${colors.primary}35`,
                  },
                ]}
                onPress={handleGenerateFixtures}
                disabled={generatingFixtures}
              >
                {generatingFixtures ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={[styles.genFixtureBtnText, { color: colors.primary }]}>
                      {league.fixtures.length > 0 ? 'Fikstürü Yenile' : 'Otomatik Fikstür Oluştur'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekChipsScroll}
            >
              {weeks.map((w) => {
                const isSelected = activeWeek === w;
                return (
                  <TouchableOpacity
                    key={w}
                    style={[
                      styles.weekChip,
                      {
                        backgroundColor: isSelected ? colors.text : colors.surface,
                        borderColor: isSelected ? colors.text : colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setSelectedWeek(w)}
                  >
                    <Text
                      style={[
                        styles.weekChipText,
                        { color: isSelected ? colors.background : colors.textSecondary },
                      ]}
                    >
                      Hafta {w}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {activeWeekFixtures.length > 0 ? (
              activeWeekFixtures.map((fixture) => (
                <TouchableOpacity
                  key={fixture.id}
                  style={[
                    styles.fixtureCard,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedFixture(fixture)}
                >
                  <View style={styles.fixtureMetaRow}>
                    <Text style={[styles.fixtureVenue, { color: colors.textSecondary }]}>
                      {fixture.venue}
                    </Text>
                    <Text style={[styles.fixtureDate, { color: colors.textTertiary }]}>
                      {fixture.date} · {fixture.time}
                    </Text>
                  </View>

                  <View style={styles.fixtureTeamsRow}>
                    <View style={styles.fixtureTeamCol}>
                      <Text style={[styles.fixtureTeamName, { color: colors.text }]} numberOfLines={1}>
                        {fixture.homeTeamName}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.fixtureScoreBox,
                        {
                          backgroundColor: fixture.isFinished
                            ? `${colors.primary}20`
                            : colors.surfaceLight,
                        },
                      ]}
                    >
                      {fixture.isFinished ? (
                        <Text style={[styles.fixtureScoreText, { color: colors.primary }]}>
                          {fixture.homeScore} - {fixture.awayScore}
                        </Text>
                      ) : (
                        <Text style={[styles.fixtureVsText, { color: colors.textSecondary }]}>
                          VS
                        </Text>
                      )}
                    </View>

                    <View style={[styles.fixtureTeamCol, { alignItems: 'flex-end' }]}>
                      <Text style={[styles.fixtureTeamName, { color: colors.text }]} numberOfLines={1}>
                        {fixture.awayTeamName}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.fixtureStatusRow, { borderTopColor: colors.surfaceBorder }]}>
                    <Text
                      style={[
                        styles.fixtureStatusBadge,
                        { color: fixture.isFinished ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {fixture.isFinished ? 'Tamamlandı' : 'Oynanacak'}
                    </Text>
                    <View style={styles.fixtureRightActions}>
                      {isOrganizer && (
                        <TouchableOpacity
                          style={[
                            styles.scoreEntryPill,
                            { backgroundColor: `${colors.primary}18` },
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            openScoreModal(fixture);
                          }}
                        >
                          <Text style={[styles.scoreEntryPillText, { color: colors.primary }]}>
                            {fixture.isFinished ? 'Skoru Güncelle' : 'Sonuç Gir'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <View style={styles.fixtureStatsLink}>
                        <Text style={[styles.fixtureStatsLinkText, { color: colors.primary }]}>
                          Analiz & İstatistik
                        </Text>
                        <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                title="Bu haftada maç yok"
                description="Fikstür eklendiğinde maçlar burada listelenecektir."
              />
            )}
          </View>
        )}

        {/* TEAMS */}
        {activeTab === 'TEAMS' && (
          <View>
            <Text style={[styles.teamsCountText, { color: colors.textSecondary }]}>
              {league.teams.length} kayıtlı takım ({remainingSlots} boş yer)
            </Text>

            {league.teams.map((t) => (
              <View
                key={t.id}
                style={[
                  styles.teamCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
              >
                <View style={styles.teamCardLeft}>
                  <View style={[styles.teamCardBadge, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.teamCardInitials, { color: colors.text }]}>
                      {getInitials(t.name)}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.teamCardTitle, { color: colors.text }]}>{t.name}</Text>
                    <Text style={[styles.teamCardSub, { color: colors.textSecondary }]}>
                      Kaptan: {t.captainName}
                    </Text>
                  </View>
                </View>

                <View style={[styles.teamPointsBadge, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.teamPointsVal, { color: colors.text }]}>{t.points}</Text>
                  <Text style={[styles.teamPointsLbl, { color: colors.textTertiary }]}>P</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* RULES */}
        {activeTab === 'RULES' && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text style={[styles.rulesHeader, { color: colors.text }]}>Lig Tüzüğü</Text>
            <Text style={[styles.rulesDesc, { color: colors.textSecondary }]}>
              {league.description}
            </Text>

            <View style={styles.rulesList}>
              {league.rules.map((rule, i) => (
                <View key={i} style={styles.ruleItem}>
                  <Ionicons name="checkmark-circle-outline" size={17} color={colors.primary} />
                  <Text style={[styles.ruleText, { color: colors.text }]}>{rule}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.contactBox, { backgroundColor: colors.surfaceLight }]}>
              <Ionicons name="call-outline" size={17} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactTitle, { color: colors.text }]}>
                  Lig Koordinatörü
                </Text>
                <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
                  {league.organizerName} · {league.organizerPhone}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {isRegistrationOpen && (
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
          ]}
        >
          <View>
            <Text style={[styles.bottomBarFee, { color: colors.text }]}>
              {league.entryFee > 0 ? `₺${league.entryFee}` : 'Ücretsiz'}
            </Text>
            <Text style={[styles.bottomBarSlots, { color: colors.textSecondary }]}>
              {remainingSlots} takım kontenjanı
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.joinButton,
              { backgroundColor: remainingSlots > 0 ? colors.primary : colors.surfaceLight },
            ]}
            disabled={remainingSlots === 0}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.joinButtonText}>
              {remainingSlots > 0 ? 'Takımını Kaydet' : 'Kontenjan Dolu'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Register Team Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Takımını Kaydet</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  {league.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={14}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {myCaptainTeams.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 0 }]}>
                  Takımlarımdan Seç
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.teamSelectPill,
                      {
                        backgroundColor: !selectedTeamId ? colors.primary : colors.surfaceLight,
                      },
                    ]}
                    onPress={() => setSelectedTeamId(undefined)}
                  >
                    <Text
                      style={[
                        styles.teamSelectPillText,
                        { color: !selectedTeamId ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      Yeni Takım
                    </Text>
                  </TouchableOpacity>
                  {myCaptainTeams.map((t) => {
                    const isPicked = selectedTeamId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          styles.teamSelectPill,
                          {
                            backgroundColor: isPicked ? colors.primary : colors.surfaceLight,
                          },
                        ]}
                        onPress={() => {
                          setSelectedTeamId(t.id);
                          setTeamName(t.name);
                          setCaptainName(currentUser.name || '');
                        }}
                      >
                        <Text
                          style={[
                            styles.teamSelectPillText,
                            { color: isPicked ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          {t.logoEmoji} {t.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Takım Adı *</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
              placeholder="Örn: Moda Sahil FK"
              placeholderTextColor={colors.textTertiary}
              value={teamName}
              onChangeText={setTeamName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kaptan Adı *</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
              placeholder="Adınız ve Soyadınız"
              placeholderTextColor={colors.textTertiary}
              value={captainName}
              onChangeText={setCaptainName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Telefon</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceLight, color: colors.text }]}
              placeholder="+90 5XX XXX XX XX"
              placeholderTextColor={colors.textTertiary}
              value={captainPhone}
              onChangeText={setCaptainPhone}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              onPress={handleRegisterTeam}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSubmitBtnText}>
                {isSubmitting ? 'Kaydediliyor...' : 'Başvuruyu Onayla'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fixture Pre-Match Stats & Prediction Modal */}
      <Modal
        visible={Boolean(selectedFixture)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFixture(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.statsModalSheet, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Maç Analizi</Text>
                {selectedFixture && (
                  <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                    Hafta {selectedFixture.week} · {selectedFixture.date} · {selectedFixture.time}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedFixture(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedFixtureStats && selectedFixtureAiPrediction && (
                <AiPredictionBotCard
                  stats={selectedFixtureStats}
                  prediction={selectedFixtureAiPrediction}
                  isCompleted={selectedFixture?.isFinished}
                  finalScore={
                    selectedFixture?.isFinished &&
                    typeof selectedFixture.homeScore === 'number' &&
                    typeof selectedFixture.awayScore === 'number'
                      ? {
                          team1: selectedFixture.homeScore,
                          team2: selectedFixture.awayScore,
                        }
                      : undefined
                  }
                />
              )}
              {selectedFixtureStats && (
                <PreMatchStatsCard
                  stats={selectedFixtureStats}
                  isCompleted={selectedFixture?.isFinished}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Organizer: Edit League Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.statsModalSheet, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Ligi Düzenle</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={14}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <LeagueForm
                isEdit
                initialValues={{
                  title: league.title,
                  season: league.season,
                  city: league.city,
                  district: league.district,
                  venueName: league.venueName,
                  format: league.format,
                  maxTeams: league.maxTeams,
                  entryFee: league.entryFee,
                  prize: league.prize,
                  rules: league.rules,
                  description: league.description,
                  themeColor: league.themeColor,
                }}
                submitLabel="Değişiklikleri Kaydet"
                onSubmit={async (values) => {
                  await updateLeague(league.id, {
                    title: values.title,
                    season: values.season,
                    city: values.city,
                    district: values.district,
                    venueName: values.venueName,
                    entryFee: values.entryFee,
                    prize: values.prize,
                    rules: values.rules,
                    description: values.description,
                    themeColor: values.themeColor,
                  });
                  setEditModalVisible(false);
                  Alert.alert('Güncellendi', 'Lig bilgileri kaydedildi.');
                }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Organizer: Fixture Score Entry Modal */}
      <Modal
        visible={Boolean(scoringFixture)}
        transparent
        animationType="slide"
        onRequestClose={() => setScoringFixture(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Fikstür Skoru Gir</Text>
                {scoringFixture && (
                  <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                    {scoringFixture.homeTeamName} vs {scoringFixture.awayTeamName}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setScoringFixture(null)} hitSlop={14}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.scoreEntryRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {scoringFixture?.homeTeamName || 'Ev Sahibi'}
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.scoreBigInput,
                    { backgroundColor: colors.surfaceLight, color: colors.text },
                  ]}
                  keyboardType="number-pad"
                  value={homeScoreText}
                  onChangeText={setHomeScoreText}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {scoringFixture?.awayTeamName || 'Deplasman'}
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.scoreBigInput,
                    { backgroundColor: colors.surfaceLight, color: colors.text },
                  ]}
                  keyboardType="number-pad"
                  value={awayScoreText}
                  onChangeText={setAwayScoreText}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                { backgroundColor: colors.primary, opacity: isSavingScore ? 0.7 : 1 },
              ]}
              onPress={handleSaveFixtureScore}
              disabled={isSavingScore}
            >
              {isSavingScore ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Skoru Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ReportModal
        visible={reportVisible}
        targetType="LEAGUE"
        targetId={league.id}
        targetLabel={league.title}
        onClose={() => setReportVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 110,
  },
  heroCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  topAccent: {
    height: 2,
    width: '100%',
  },
  heroInner: {
    padding: SPACING.lg,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaTag: {
    fontSize: 12,
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
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 3,
    marginBottom: 12,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.sm,
    gap: 8,
    marginBottom: 14,
  },
  prizeValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 6,
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 5,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orgText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
    gap: 16,
  },
  tabItem: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  thRank: { width: 20, fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  thTeam: { flex: 1, fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  thNum: { width: 23, fontSize: 10, fontWeight: '700', textAlign: 'center', letterSpacing: 0.4 },
  thPoints: { width: 24, fontSize: 10, fontWeight: '800', textAlign: 'center', letterSpacing: 0.4 },
  thForm: { width: 48, fontSize: 10, fontWeight: '700', textAlign: 'center', letterSpacing: 0.4 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rankText: { width: 20, fontSize: 12, fontWeight: '700', ...NUMERIC_STYLE },
  teamCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingRight: 4,
  },
  miniCrest: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCrestText: {
    fontSize: 9,
    fontWeight: '800',
  },
  teamName: { fontSize: 12, fontWeight: '600', flex: 1 },
  tdNum: { width: 23, fontSize: 11, textAlign: 'center', ...NUMERIC_STYLE },
  tdPoints: { width: 24, fontSize: 12, fontWeight: '800', textAlign: 'center', ...NUMERIC_STYLE },
  formCell: { width: 48, flexDirection: 'row', justifyContent: 'center', gap: 2 },
  formDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  formEmptyText: {
    fontSize: 10,
  },
  weekChipsScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  weekChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  weekChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fixtureCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: 10,
  },
  fixtureMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fixtureVenue: {
    fontSize: 11,
    fontWeight: '600',
  },
  fixtureDate: {
    fontSize: 11,
  },
  fixtureTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fixtureTeamCol: {
    flex: 1,
  },
  fixtureTeamName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  fixtureScoreBox: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginHorizontal: 10,
  },
  fixtureScoreText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  fixtureVsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fixtureStatusRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fixtureStatusBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  fixtureStatsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  fixtureStatsLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamsCountText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  teamCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginBottom: 8,
  },
  teamCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  teamCardBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCardInitials: {
    fontSize: 12,
    fontWeight: '800',
  },
  teamCardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  teamCardSub: {
    fontSize: 11,
    marginTop: 1,
  },
  teamPointsBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 3,
  },
  teamPointsVal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  teamPointsLbl: {
    fontSize: 10,
    fontWeight: '700',
  },
  rulesHeader: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 6,
  },
  rulesDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  rulesList: {
    gap: 9,
    marginBottom: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    fontSize: 12,
    flex: 1,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.sm,
    gap: 10,
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  contactSub: {
    fontSize: 11,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  bottomBarFee: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  bottomBarSlots: {
    fontSize: 11,
  },
  joinButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  statsModalSheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: SPACING.lg,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
  },
  modalSubmitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    marginTop: 20,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  organizerToolbar: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
  },
  toolbarBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  genFixtureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    marginBottom: SPACING.sm,
  },
  genFixtureBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  fixtureRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreEntryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  scoreEntryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  teamSelectPillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  scoreEntryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreBigInput: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
});
