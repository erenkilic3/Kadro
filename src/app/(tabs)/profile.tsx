import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { MatchCard } from '../../components/MatchCard';
import { MatchPredictionCard } from '../../components/MatchPredictionCard';
import { GearCard } from '../../components/GearCard';
import { PositionBadge } from '../../components/PositionBadge';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';
import { PlayerPosition } from '../../types';
import { getInitials, stripLeadingSymbols } from '../../utils/formatters';

type ProfileTab = 'MATCHES' | 'PREDICTIONS' | 'REVIEWS' | 'LISTINGS' | 'SETTINGS';

export default function ProfileScreen() {
  const {
    currentUser,
    matches,
    gearItems,
    evaluations,
    updateUser,
    resetDemoData,
    markGearSold,
    votePrediction,
  } = useApp();
  const { colors, isDark, setThemeMode } = useTheme();

  const [profileTab, setProfileTab] = useState<ProfileTab>('MATCHES');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [position, setPosition] = useState<PlayerPosition>(currentUser.position || 'MID');

  const myMatches = matches.filter(
    (m) =>
      m.organizerId === currentUser.id ||
      m.roster.some((s) => s.assignedPlayer?.id === currentUser.id)
  );
  const myPredictions = matches.filter((m) => Boolean(m.prediction?.userVote));
  const myListings = gearItems.filter((g) => g.sellerId === currentUser.id);
  const myReviews = evaluations.filter((e) => e.targetPlayerId === currentUser.id);

  const handleSaveProfile = async () => {
    await updateUser({
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      position,
    });
    setIsEditing(false);
    Alert.alert('Güncellendi', 'Profil bilgileriniz kaydedildi.');
  };

  const handleResetData = () => {
    Alert.alert(
      'Demo Verilerini Sıfırla',
      'Tüm maç, lig, tahmin ve pazar verileri başlangıç durumuna döndürülecek. Devam edilsin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await resetDemoData();
            Alert.alert('Tamamlandı', 'Demo verileri sıfırlandı.');
          },
        },
      ]
    );
  };

  const profileTabs: { key: ProfileTab; label: string }[] = [
    { key: 'MATCHES', label: `Maçlar (${myMatches.length})` },
    { key: 'PREDICTIONS', label: `Tahminler (${myPredictions.length})` },
    { key: 'REVIEWS', label: `Yorumlar (${myReviews.length})` },
    { key: 'LISTINGS', label: `İlanlar (${myListings.length})` },
    { key: 'SETTINGS', label: 'Ayarlar' },
  ];

  const userBadges = currentUser.badges || [
    { id: 'mvp', label: 'Maçın Adamı', icon: '', count: 6 },
    { id: 'fairplay', label: 'Centilmen Rakip', icon: '', count: 18 },
    { id: 'maestro', label: 'Oyun Kurucu', icon: '', count: 12 },
    { id: 'engine', label: 'Yorulmaz Ciğer', icon: '', count: 8 },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Title */}
        <Text style={[styles.screenTitle, { color: colors.text }]}>Profil</Text>

        {/* Identity Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitials}>
                {getInitials(currentUser.name || 'EK')}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {currentUser.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditing(!isEditing)}
                  hitSlop={8}
                  style={[styles.editIconBtn, { backgroundColor: colors.surfaceLight }]}
                >
                  <Ionicons
                    name={isEditing ? 'close' : 'pencil-outline'}
                    size={16}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.metaRow}>
                <PositionBadge position={currentUser.position || 'MID'} size="sm" />
                <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                  {currentUser.district || 'Kadıköy'}, {currentUser.city || 'İstanbul'}
                </Text>
              </View>
            </View>
          </View>

          {/* 4-Column Stats */}
          <View style={[styles.statsBar, { backgroundColor: colors.surfaceLight }]}>
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.text }]}>{currentUser.rating}</Text>
              <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Yetenek</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.primary }]}>
                %{Math.round(((currentUser.fairPlayRating || 4.95) / 5) * 100)}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Fair-Play</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.text }]}>
                {currentUser.matchesPlayed}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Maç</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.text }]}>
                {currentUser.evaluationsCount || myReviews.length || 22}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Değerlendirme</Text>
            </View>
          </View>

          {currentUser.bio && !isEditing && (
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>
              {currentUser.bio}
            </Text>
          )}

          {!isEditing && (
            <View style={[styles.badgesShowcase, { borderTopColor: colors.surfaceBorder }]}>
              <Text style={[styles.badgesSectionHeading, { color: colors.textTertiary }]}>
                Kazanılan Rozetler
              </Text>
              <View style={styles.badgesRow}>
                {userBadges.map((b) => (
                  <View
                    key={b.id}
                    style={[styles.badgeCardPill, { backgroundColor: colors.surfaceLight }]}
                  >
                    <Text style={[styles.badgeLabelText, { color: colors.text }]}>
                      {stripLeadingSymbols(b.label)}
                    </Text>
                    <Text style={[styles.badgeCountText, { color: colors.primary }]}>
                      {b.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {isEditing && (
            <View style={[styles.editForm, { borderTopColor: colors.surfaceBorder }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>İsim Soyisim</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceLight, color: colors.text },
                ]}
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Telefon</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceLight, color: colors.text },
                ]}
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ana Mevki</Text>
              <View style={styles.posRow}>
                {(['GK', 'DEF', 'MID', 'FWD'] as PlayerPosition[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.posButton,
                      {
                        backgroundColor: position === p ? colors.primary : colors.surfaceLight,
                      },
                    ]}
                    onPress={() => setPosition(p)}
                  >
                    <Text
                      style={[
                        styles.posButtonText,
                        { color: position === p ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Oyun Tarzı / Hakkımda
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceLight, color: colors.text, height: 64 },
                ]}
                value={bio}
                onChangeText={setBio}
                multiline
                placeholderTextColor={colors.textTertiary}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Scrollable Underline Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabsScrollRow,
            { borderBottomColor: colors.surfaceBorder },
          ]}
          style={styles.tabsScroll}
        >
          {profileTabs.map((tab) => {
            const isActive = profileTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && { borderBottomColor: colors.primary }]}
                onPress={() => setProfileTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    { color: isActive ? colors.text : colors.textTertiary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TAB: MATCHES */}
        {profileTab === 'MATCHES' && (
          <View>
            {myMatches.length > 0 ? (
              myMatches.map((m) => (
                <MatchCard key={m.id} match={m} currentUserId={currentUser.id} />
              ))
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="Henüz maça katılmadın"
                description="Maçlar sekmesinden sana uygun kadrolara başvurabilirsin."
              />
            )}
          </View>
        )}

        {/* TAB: PREDICTIONS */}
        {profileTab === 'PREDICTIONS' && (
          <View>
            {myPredictions.length > 0 ? (
              myPredictions.map((m) => (
                <MatchPredictionCard
                  key={m.id}
                  prediction={m.prediction!}
                  matchId={m.id}
                  onVote={(choice) => votePrediction(m.id, choice)}
                />
              ))
            ) : (
              <EmptyState
                icon="stats-chart-outline"
                title="Henüz tahmin yapmadın"
                description="Maç kartlarından veya maç detayından tahmin oyunu kullanabilirsin."
              />
            )}
          </View>
        )}

        {/* TAB: REVIEWS */}
        {profileTab === 'REVIEWS' && (
          <View>
            {myReviews.length > 0 ? (
              myReviews.map((rev) => (
                <View
                  key={rev.id}
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={styles.reviewHeaderRow}>
                    <View style={[styles.reviewAvatarBox, { backgroundColor: colors.surfaceLight }]}>
                      <Text style={[styles.reviewInitials, { color: colors.text }]}>
                        {getInitials(rev.evaluatorName)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reviewAuthorName, { color: colors.text }]}>
                        {rev.evaluatorName}
                      </Text>
                      <Text style={[styles.reviewMatchTitle, { color: colors.textSecondary }]}>
                        {rev.matchTitle}
                      </Text>
                    </View>

                    <View style={styles.reviewScoresCol}>
                      <Text style={[styles.reviewScoreVal, { color: colors.text }]}>
                        Yetenek {rev.skillRating}/5
                      </Text>
                      <Text style={[styles.reviewScoreVal, { color: colors.primary }]}>
                        Fair-Play {rev.fairPlayRating}/5
                      </Text>
                    </View>
                  </View>

                  {rev.badges && rev.badges.length > 0 && (
                    <View style={styles.reviewBadgesWrap}>
                      {rev.badges.map((badge, idx) => (
                        <View
                          key={idx}
                          style={[styles.reviewBadgePill, { backgroundColor: colors.surfaceLight }]}
                        >
                          <Text style={[styles.reviewBadgeText, { color: colors.textSecondary }]}>
                            {stripLeadingSymbols(badge)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {rev.comment ? (
                    <Text style={[styles.reviewQuoteText, { color: colors.textSecondary }]}>
                      {`"${rev.comment}"`}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <EmptyState
                icon="chatbubble-outline"
                title="Henüz değerlendirme yok"
                description="Oynadığın maçlardan sonra yapılan değerlendirmeler burada listelenir."
              />
            )}
          </View>
        )}

        {/* TAB: LISTINGS */}
        {profileTab === 'LISTINGS' && (
          <View>
            {myListings.length > 0 ? (
              myListings.map((g) => (
                <View key={g.id} style={{ marginBottom: 8 }}>
                  <GearCard item={g} />
                  {g.status === 'Available' && (
                    <TouchableOpacity
                      style={[styles.markSoldBtn, { backgroundColor: colors.surfaceLight }]}
                      onPress={() => markGearSold(g.id)}
                    >
                      <Ionicons name="checkmark-done-outline" size={16} color={colors.text} />
                      <Text style={[styles.markSoldText, { color: colors.text }]}>
                        Satıldı Olarak İşaretle
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <EmptyState
                icon="pricetag-outline"
                title="Henüz ilanın yok"
                description="Ekipmanlarını satmak için Oluştur sekmesinden ilan yayınlayabilirsin."
              />
            )}
          </View>
        )}

        {/* TAB: SETTINGS */}
        {profileTab === 'SETTINGS' && (
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Text style={[styles.settingsHeader, { color: colors.text }]}>Görünüm</Text>
            <View style={styles.themeSwitchRow}>
              <TouchableOpacity
                style={[
                  styles.themeSelectBtn,
                  {
                    backgroundColor: !isDark ? `${colors.primary}18` : colors.surfaceLight,
                    borderColor: !isDark ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => setThemeMode('light')}
              >
                <Ionicons
                  name="sunny-outline"
                  size={18}
                  color={!isDark ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeSelectText,
                    { color: !isDark ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Aydınlık
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeSelectBtn,
                  {
                    backgroundColor: isDark ? `${colors.primary}18` : colors.surfaceLight,
                    borderColor: isDark ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => setThemeMode('dark')}
              >
                <Ionicons
                  name="moon-outline"
                  size={18}
                  color={isDark ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeSelectText,
                    { color: isDark ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Karanlık
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: colors.surfaceBorder }]} />

            <Text style={[styles.settingsHeader, { color: colors.text }]}>Veri Yönetimi</Text>
            <Text style={[styles.settingsDesc, { color: colors.textSecondary }]}>
              Tüm örnek maç, lig ve ilan verilerini başlangıç durumuna döndürür.
            </Text>

            <TouchableOpacity
              style={[styles.resetBtn, { backgroundColor: `${colors.danger}15` }]}
              onPress={handleResetData}
            >
              <Ionicons name="refresh-outline" size={17} color={colors.danger} />
              <Text style={[styles.resetBtnText, { color: colors.danger }]}>
                Demo Verilerini Sıfırla
              </Text>
            </TouchableOpacity>

            <View style={[styles.infoRow, { borderTopColor: colors.surfaceBorder }]}>
              <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Uygulama</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>Kadro</Text>
            </View>
            <View style={[styles.infoRow, { borderTopColor: colors.surfaceBorder }]}>
              <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Tema</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {isDark ? 'Karanlık' : 'Aydınlık'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderTopColor: colors.surfaceBorder }]}>
              <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Sürüm</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>1.0.0</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  editIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    paddingVertical: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  bioText: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.md,
    lineHeight: 18,
  },
  badgesShowcase: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  badgesSectionHeading: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
  },
  badgeLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  editForm: {
    marginTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: FONT_SIZE.sm,
  },
  posRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  posButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  posButtonText: {
    fontWeight: '700',
    fontSize: FONT_SIZE.xs,
  },
  saveBtn: {
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  tabsScroll: {
    marginBottom: SPACING.md,
  },
  tabsScrollRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 18,
    paddingRight: SPACING.lg,
  },
  tabItem: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  reviewCard: {
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    marginBottom: 10,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInitials: {
    fontSize: 12,
    fontWeight: '800',
  },
  reviewAuthorName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  reviewMatchTitle: {
    fontSize: 11,
    marginTop: 1,
  },
  reviewScoresCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  reviewScoreVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reviewBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewQuoteText: {
    fontSize: 12,
    lineHeight: 17,
  },
  markSoldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    marginTop: -6,
    marginBottom: 10,
    gap: 6,
  },
  markSoldText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  settingsCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  settingsHeader: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: 8,
  },
  settingsDesc: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  themeSwitchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 8,
  },
  themeSelectText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: SPACING.lg,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    gap: 6,
    marginBottom: SPACING.lg,
  },
  resetBtnText: {
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoKey: {
    fontSize: FONT_SIZE.xs,
  },
  infoVal: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});
