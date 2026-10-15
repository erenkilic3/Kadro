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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { RegionalLeague, LeagueTeam } from '../../types';

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leagues, joinLeague, currentUser } = useApp();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'STANDINGS' | 'FIXTURES' | 'TEAMS' | 'RULES'>('STANDINGS');
  const [selectedWeek, setSelectedWeek] = useState<number>(6);

  // Register Team Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState(currentUser.name || '');
  const [captainPhone, setCaptainPhone] = useState(currentUser.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const league = useMemo(() => {
    return leagues.find((l) => l.id === id);
  }, [leagues, id]);

  if (!league) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Lig Bulunamadı"
          description="Görüntülemek istediğin bölgesel lig sistemde bulunamadı veya kaldırılmış olabilir."
          buttonText="Liglere Geri Dön"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const isRegistrationOpen = league.status === 'REGISTRATION_OPEN';
  const remainingSlots = Math.max(0, league.maxTeams - league.registeredTeamsCount);

  // Sorted teams for Standings
  const sortedTeams = useMemo(() => {
    return [...league.teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  }, [league.teams]);

  // Distinct weeks from fixtures
  const weeks = useMemo(() => {
    const wSet = new Set<number>();
    league.fixtures.forEach((f) => wSet.add(f.week));
    const arr = Array.from(wSet).sort((a, b) => b - a);
    return arr.length > 0 ? arr : [1];
  }, [league.fixtures]);

  const activeWeekFixtures = useMemo(() => {
    return league.fixtures.filter((f) => f.week === selectedWeek);
  }, [league.fixtures, selectedWeek]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `⚽ ${league.title} (${league.season})\n🏆 Ödül: ${league.prize}\n📍 Konum: ${league.venueName}, ${league.district}\nKadro uygulaması üzerinden takımını lige kaydet veya fikstürü takip et!`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleRegisterTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen takımınızın adını giriniz.');
      return;
    }
    if (!captainName.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen takım kaptanının adını giriniz.');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await joinLeague(league.id, teamName.trim(), captainName.trim(), captainPhone.trim());
      if (success) {
        Alert.alert(
          '🎉 Tebrikler!',
          `"${teamName}" takımı ${league.title}'ne başarıyla kaydedildi. Lig fikstürü ve maç saatleri hazırlandığında bilgilendirileceksiniz.`,
          [{ text: 'Harika', onPress: () => setModalVisible(false) }]
        );
        setTeamName('');
      } else {
        Alert.alert('Kayıt Başarısız', 'Lig kontenjanı dolmuş olabilir.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Kayıt sırasında bir problem oluştu.');
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
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          {/* Accent Line */}
          <View style={[styles.topAccent, { backgroundColor: league.themeColor || colors.primary }]} />

          <View style={styles.heroInner}>
            {/* Badges */}
            <View style={styles.heroBadgeRow}>
              <View
                style={[
                  styles.pillBadge,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EEF2F6' },
                ]}
              >
                <Ionicons name="location" size={13} color={colors.primary} />
                <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                  {league.district}, {league.city}
                </Text>
              </View>

              <View style={[styles.pillBadge, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.pillText, { color: colors.text, fontWeight: '800' }]}>
                  {league.format}
                </Text>
              </View>

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

            {/* League Title */}
            <Text style={[styles.title, { color: colors.text }]}>{league.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {league.season} • {league.venueName}
            </Text>

            {/* Prize Callout Box */}
            <View
              style={[
                styles.prizeBox,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                },
              ]}
            >
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={styles.prizeLabel}>BÜYÜK ŞAMPİYONLUK ÖDÜLÜ</Text>
                <Text style={styles.prizeValue}>{league.prize}</Text>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={[styles.statsGrid, { borderTopColor: colors.surfaceBorder }]}>
              <View style={styles.statCol}>
                <Text style={[styles.statNum, { color: colors.text }]}>{league.registeredTeamsCount}/{league.maxTeams}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kayıtlı Takım</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.statCol}>
                <Text style={[styles.statNum, { color: colors.text }]}>
                  {league.entryFee > 0 ? `${league.entryFee} ₺` : 'Ücretsiz'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Takım Katılımı</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.statCol}>
                <Text style={[styles.statNum, { color: colors.text }]}>
                  {isRegistrationOpen ? `${remainingSlots} Açık` : 'Dolu'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kontenjan</Text>
              </View>
            </View>

            {/* Share & Organizer row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={16} color={colors.text} />
                <Text style={[styles.shareBtnText, { color: colors.text }]}>Ligi Paylaş</Text>
              </TouchableOpacity>

              <View style={styles.orgTag}>
                <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.orgText, { color: colors.textSecondary }]} numberOfLines={1}>
                  Yönetici: {league.organizerName.split(' ')[0]}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View
          style={[
            styles.tabsContainer,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'STANDINGS' && [styles.tabItemActive, { backgroundColor: colors.primaryLight }]]}
            onPress={() => setActiveTab('STANDINGS')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'STANDINGS' ? colors.black : colors.textSecondary },
              ]}
            >
              📊 Puan Durumu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'FIXTURES' && [styles.tabItemActive, { backgroundColor: colors.primaryLight }]]}
            onPress={() => setActiveTab('FIXTURES')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'FIXTURES' ? colors.black : colors.textSecondary },
              ]}
            >
              🗓️ Fikstür
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'TEAMS' && [styles.tabItemActive, { backgroundColor: colors.primaryLight }]]}
            onPress={() => setActiveTab('TEAMS')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'TEAMS' ? colors.black : colors.textSecondary },
              ]}
            >
              🛡️ Takımlar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'RULES' && [styles.tabItemActive, { backgroundColor: colors.primaryLight }]]}
            onPress={() => setActiveTab('RULES')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'RULES' ? colors.black : colors.textSecondary },
              ]}
            >
              📜 Kurallar
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= TAB 1: STANDINGS ================= */}
        {activeTab === 'STANDINGS' && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.tableHeaderRow}>
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
              const isTopThree = index < 3;

              return (
                <View
                  key={team.id}
                  style={[
                    styles.tableRow,
                    {
                      borderBottomColor: colors.surfaceBorder,
                      backgroundColor: isLeader
                        ? isDark
                          ? 'rgba(0, 214, 100, 0.08)'
                          : 'rgba(0, 214, 100, 0.05)'
                        : 'transparent',
                    },
                  ]}
                >
                  {/* Rank */}
                  <View style={styles.rankCell}>
                    <Text
                      style={[
                        styles.rankText,
                        {
                          color: isLeader ? colors.primary : isTopThree ? colors.text : colors.textSecondary,
                          fontWeight: isTopThree ? '900' : '600',
                        },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  {/* Team */}
                  <View style={styles.teamCell}>
                    <Text style={styles.teamEmoji}>{team.logoEmoji}</Text>
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                      {team.name}
                    </Text>
                  </View>

                  {/* Stats */}
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

                  {/* Points */}
                  <Text style={[styles.tdPoints, { color: colors.text }]}>{team.points}</Text>

                  {/* Form */}
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
                                  ? '#F59E0B'
                                  : colors.danger,
                            },
                          ]}
                        >
                          <Text style={styles.formDotText}>{res}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.formEmptyText, { color: colors.textTertiary }]}>-</Text>
                    )}
                  </View>
                </View>
              );
            })}

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSquare, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  1. Şampiyonluk & Kupa
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSquare, { backgroundColor: '#3B82F6' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  2-3. Madalya Etabı
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 2: FIXTURES ================= */}
        {activeTab === 'FIXTURES' && (
          <View>
            {/* Week Selector Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekChipsScroll}
            >
              {weeks.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[
                    styles.weekChip,
                    selectedWeek === w
                      ? [styles.weekChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                      : [styles.weekChipInactive, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }],
                  ]}
                  onPress={() => setSelectedWeek(w)}
                >
                  <Text
                    style={[
                      styles.weekChipText,
                      { color: selectedWeek === w ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    Hafta {w}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {activeWeekFixtures.length > 0 ? (
              activeWeekFixtures.map((fixture) => (
                <View
                  key={fixture.id}
                  style={[
                    styles.fixtureCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={styles.fixtureMetaRow}>
                    <Text style={[styles.fixtureVenue, { color: colors.textSecondary }]}>
                      📍 {fixture.venue}
                    </Text>
                    <Text style={[styles.fixtureDate, { color: colors.textSecondary }]}>
                      {fixture.date} • {fixture.time}
                    </Text>
                  </View>

                  <View style={styles.fixtureTeamsRow}>
                    {/* Home */}
                    <View style={styles.fixtureTeamCol}>
                      <Text style={[styles.fixtureTeamName, { color: colors.text }]} numberOfLines={1}>
                        {fixture.homeTeamName}
                      </Text>
                    </View>

                    {/* Score / VS */}
                    <View
                      style={[
                        styles.fixtureScoreBox,
                        {
                          backgroundColor: fixture.isFinished
                            ? colors.primaryLight
                            : colors.surfaceLight,
                        },
                      ]}
                    >
                      {fixture.isFinished ? (
                        <Text style={[styles.fixtureScoreText, { color: colors.black }]}>
                          {fixture.homeScore} - {fixture.awayScore}
                        </Text>
                      ) : (
                        <Text style={[styles.fixtureVsText, { color: colors.textSecondary }]}>
                          VS
                        </Text>
                      )}
                    </View>

                    {/* Away */}
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
                        {
                          color: fixture.isFinished ? colors.primary : '#3B82F6',
                        },
                      ]}
                    >
                      {fixture.isFinished ? '✅ Maç Tamamlandı' : '⏳ Oynanacak'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState
                title="Bu Haftada Maç Bulunmuyor"
                description="Lig koordinatörü fikstürü hazırladığında maçlar burada listelenecektir."
              />
            )}
          </View>
        )}

        {/* ================= TAB 3: TEAMS ================= */}
        {activeTab === 'TEAMS' && (
          <View>
            <View style={styles.teamsHeaderRow}>
              <Text style={[styles.teamsCountText, { color: colors.textSecondary }]}>
                Toplam {league.teams.length} Takım Kayıtlı ({remainingSlots} Boş Kontenjan)
              </Text>
            </View>

            {league.teams.map((t, idx) => (
              <View
                key={t.id}
                style={[
                  styles.teamCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.teamCardLeft}>
                  <View style={styles.teamCardBadge}>
                    <Text style={{ fontSize: 24 }}>{t.logoEmoji}</Text>
                  </View>
                  <View>
                    <Text style={[styles.teamCardTitle, { color: colors.text }]}>{t.name}</Text>
                    <Text style={[styles.teamCardSub, { color: colors.textSecondary }]}>
                      Kaptan: {t.captainName}
                    </Text>
                  </View>
                </View>

                <View style={styles.teamCardRight}>
                  <View style={[styles.teamPointsBadge, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.teamPointsVal, { color: colors.primary }]}>{t.points}</Text>
                    <Text style={[styles.teamPointsLbl, { color: colors.textSecondary }]}>Puan</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= TAB 4: RULES ================= */}
        {activeTab === 'RULES' && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text style={[styles.rulesHeader, { color: colors.text }]}>Lig Tüzüğü & Katılım Şartları</Text>
            <Text style={[styles.rulesDesc, { color: colors.textSecondary }]}>
              {league.description}
            </Text>

            <View style={styles.rulesList}>
              {league.rules.map((rule, i) => (
                <View key={i} style={styles.ruleItem}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={[styles.ruleText, { color: colors.text }]}>{rule}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.contactBox, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <Ionicons name="call" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactTitle, { color: colors.text }]}>Lig Koordinatörü & İletişim</Text>
                <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
                  {league.organizerName} • {league.organizerPhone}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Footer for Joining League */}
      {isRegistrationOpen && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.surfaceBorder,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          <View style={styles.bottomBarInfo}>
            <Text style={[styles.bottomBarFee, { color: colors.text }]}>
              {league.entryFee > 0 ? `${league.entryFee} ₺` : 'Ücretsiz'}
            </Text>
            <Text style={[styles.bottomBarSlots, { color: colors.primary }]}>
              {remainingSlots} Takım Kontenjanı Kaldı
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
            <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.joinButtonText}>
              {remainingSlots > 0 ? 'Takımını Lige Kaydet' : 'Kontenjan Doldu'}
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
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Takımını Lige Kaydet</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  {league.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Takım Adı *</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Örn: Moda Sahil FK"
              placeholderTextColor={colors.textTertiary}
              value={teamName}
              onChangeText={setTeamName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kaptan Adı *</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Adınız ve Soyadınız"
              placeholderTextColor={colors.textTertiary}
              value={captainName}
              onChangeText={setCaptainName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kaptan Telefonu</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
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
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.modalSubmitBtnText}>
                {isSubmitting ? 'Kaydediliyor...' : 'Lige Başvurumu Onayla'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: SPACING.lg,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 110,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    elevation: 3,
  },
  topAccent: {
    height: 5,
    width: '100%',
  },
  heroInner: {
    padding: SPACING.md,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  pillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    marginTop: 3,
    marginBottom: 12,
  },
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
  },
  prizeLabel: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  prizeValue: {
    color: '#D97706',
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
    marginTop: 1,
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
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
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
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orgTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orgText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabItemActive: {},
  tabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: SPACING.md,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  thRank: { width: 22, fontSize: 10, fontWeight: '800' },
  thTeam: { flex: 1, fontSize: 10, fontWeight: '800' },
  thNum: { width: 24, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  thPoints: { width: 26, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  thForm: { width: 50, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  rankCell: { width: 22 },
  rankText: { fontSize: 12 },
  teamCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
  teamEmoji: { fontSize: 14 },
  teamName: { fontSize: 12, fontWeight: '700' },
  tdNum: { width: 24, fontSize: 11, textAlign: 'center' },
  tdPoints: { width: 26, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  formCell: { width: 50, flexDirection: 'row', justifyContent: 'center', gap: 2 },
  formDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  formEmptyText: {
    fontSize: 10,
  },
  legendRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  weekChipsScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  weekChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  weekChipActive: {},
  weekChipInactive: {},
  weekChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fixtureCard: {
    borderRadius: 12,
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
    fontWeight: '800',
  },
  fixtureScoreBox: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  fixtureScoreText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  fixtureVsText: {
    fontSize: 11,
    fontWeight: '800',
  },
  fixtureStatusRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 6,
    alignItems: 'center',
  },
  fixtureStatusBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamsHeaderRow: {
    marginBottom: 8,
  },
  teamsCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  teamCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  teamCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  teamCardRight: {},
  teamPointsBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  teamPointsVal: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  teamPointsLbl: {
    fontSize: 9,
    fontWeight: '700',
  },
  rulesHeader: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    marginBottom: 6,
  },
  rulesDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  rulesList: {
    gap: 8,
    marginBottom: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: '800',
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
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  bottomBarInfo: {},
  bottomBarFee: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  bottomBarSlots: {
    fontSize: 11,
    fontWeight: '700',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    gap: 8,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
