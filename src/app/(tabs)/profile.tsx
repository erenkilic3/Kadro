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
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { PlayerPosition } from '../../types';

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
  const { colors, isDark, themeMode, setThemeMode, toggleTheme } = useTheme();

  const [profileTab, setProfileTab] = useState<
    'MATCHES' | 'PREDICTIONS' | 'REVIEWS' | 'LISTINGS' | 'SETTINGS'
  >('MATCHES');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [position, setPosition] = useState<PlayerPosition>(currentUser.position || 'MID');

  // Filter matches user has joined or created
  const myMatches = matches.filter(
    (m) =>
      m.organizerId === currentUser.id ||
      m.roster.some((s) => s.assignedPlayer?.id === currentUser.id)
  );

  // Filter matches user made predictions for
  const myPredictions = matches.filter((m) => Boolean(m.prediction?.userVote));

  // Filter gear items listed by user
  const myListings = gearItems.filter((g) => g.sellerId === currentUser.id);

  // Filter reviews received from opponents and teammates
  const myReviews = evaluations.filter((e) => e.targetPlayerId === currentUser.id);

  const handleSaveProfile = async () => {
    await updateUser({
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      position,
    });
    setIsEditing(false);
    Alert.alert('✅ Güncellendi', 'Profil bilgileriniz başarıyla kaydedildi.');
  };

  const handleResetData = () => {
    Alert.alert(
      'Demo Verilerini Sıfırla',
      'Tüm maç, tahmin ve pazar verileri orijinal başlangıç durumuna döndürülecek. Devam edilsin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await resetDemoData();
            Alert.alert('Başarılı', 'Demo verileri sıfırlandı.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Identity Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.surfaceBorder,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={38} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.text }]}>{currentUser.name}</Text>
                <TouchableOpacity
                  onPress={() => setIsEditing(!isEditing)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={isEditing ? 'close' : 'create-outline'}
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <PositionBadge position={currentUser.position || 'MID'} size="sm" />
                <View style={[styles.badgePill, { backgroundColor: `${colors.warning}20` }]}>
                  <Ionicons name="trophy" size={12} color={colors.warning} />
                  <Text style={[styles.badgePillText, { color: colors.warning }]}>
                    Usta Tahminci
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Bar */}
          <View
            style={[
              styles.statsBar,
              { backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC' },
            ]}
          >
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.text }]}>⭐ {currentUser.rating}</Text>
              <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Yetenek</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: '#EC4899' }]}>
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
              <Text style={[styles.statVal, { color: colors.primary }]}>
                {currentUser.evaluationsCount || myReviews.length || 22}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textTertiary }]}>Değerlendirme</Text>
            </View>
          </View>

          {/* Bio */}
          {currentUser.bio && !isEditing && (
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>
              "{currentUser.bio}"
            </Text>
          )}

          {/* Opponent Badges Showcase */}
          {!isEditing && (
            <View style={styles.badgesShowcase}>
              <Text style={[styles.badgesSectionHeading, { color: colors.textSecondary }]}>
                🏆 Rakiplerden Kazanılan Rozetler
              </Text>
              <View style={styles.badgesRow}>
                {(currentUser.badges || [
                  { id: 'mvp', label: 'Maçın Adamı', icon: '⚡', count: 6 },
                  { id: 'fairplay', label: 'Centilmen Rakip', icon: '🤝', count: 18 },
                  { id: 'maestro', label: 'Oyun Kurucu', icon: '🎯', count: 12 },
                  { id: 'engine', label: 'Yorulmaz Ciğer', icon: '🏃', count: 8 },
                ]).map((b) => (
                  <View
                    key={b.id}
                    style={[
                      styles.badgeCardPill,
                      {
                        backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9',
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 13 }}>{b.icon}</Text>
                    <Text style={[styles.badgeLabelText, { color: colors.text }]}>{b.label}</Text>
                    <View style={[styles.badgeCountBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeCountText}>{b.count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Edit Form */}
          {isEditing && (
            <View
              style={[
                styles.editForm,
                { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' },
              ]}
            >
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>İsim Soyisim</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9',
                    color: colors.text,
                    borderColor: colors.surfaceBorder,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Telefon</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9',
                    color: colors.text,
                    borderColor: colors.surfaceBorder,
                  },
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
                        backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9',
                        borderColor: colors.surfaceBorder,
                      },
                      position === p && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
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
                Hakkımda / Oyun Tarzı
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9',
                    color: colors.text,
                    borderColor: colors.surfaceBorder,
                    height: 60,
                  },
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

        {/* Tab Selection */}
        <View
          style={[
            styles.segmentContainer,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              profileTab === 'MATCHES' && {
                backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7',
              },
            ]}
            onPress={() => setProfileTab('MATCHES')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: profileTab === 'MATCHES' ? colors.primary : colors.textTertiary },
              ]}
            >
              ⚽ Maçlarım ({myMatches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              profileTab === 'PREDICTIONS' && {
                backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7',
              },
            ]}
            onPress={() => setProfileTab('PREDICTIONS')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: profileTab === 'PREDICTIONS' ? colors.warning : colors.textTertiary },
              ]}
            >
              🏆 Tahmin ({myPredictions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              profileTab === 'REVIEWS' && {
                backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7',
              },
            ]}
            onPress={() => setProfileTab('REVIEWS')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: profileTab === 'REVIEWS' ? '#EC4899' : colors.textTertiary },
              ]}
            >
              💬 Yorumlar ({myReviews.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              profileTab === 'LISTINGS' && {
                backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7',
              },
            ]}
            onPress={() => setProfileTab('LISTINGS')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: profileTab === 'LISTINGS' ? colors.primary : colors.textTertiary },
              ]}
            >
              🛍️ İlanlarım ({myListings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              profileTab === 'SETTINGS' && {
                backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7',
              },
            ]}
            onPress={() => setProfileTab('SETTINGS')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: profileTab === 'SETTINGS' ? colors.primary : colors.textTertiary },
              ]}
            >
              ⚙️ Ayarlar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content: MATCHES */}
        {profileTab === 'MATCHES' && (
          <View>
            {myMatches.length > 0 ? (
              myMatches.map((m) => (
                <MatchCard key={m.id} match={m} currentUserId={currentUser.id} />
              ))
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="Henüz Bir Maça Katılmadın"
                description="Maçlar sekmesinden sana uygun semtteki bir kadroya başvurabilirsin."
              />
            )}
          </View>
        )}

        {/* Tab Content: PREDICTIONS */}
        {profileTab === 'PREDICTIONS' && (
          <View>
            {myPredictions.length > 0 ? (
              myPredictions.map((m) => (
                <View key={m.id} style={{ marginBottom: SPACING.sm }}>
                  <MatchPredictionCard
                    prediction={m.prediction!}
                    matchId={m.id}
                    onVote={(choice) => votePrediction(m.id, choice)}
                  />
                </View>
              ))
            ) : (
              <EmptyState
                icon="trophy-outline"
                title="Henüz Tahmin Yapmadın"
                description="Maçlar sekmesinden oynanacak maçlar için kazananı tahmin et, topluluk puanı topla!"
              />
            )}
          </View>
        )}

        {/* Tab Content: REVIEWS (Oyuncu & Rakip Değerlendirmeleri) */}
        {profileTab === 'REVIEWS' && (
          <View>
            {myReviews.length > 0 ? (
              myReviews.map((rev) => (
                <View
                  key={rev.id}
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: colors.surfaceBorder,
                      shadowColor: colors.cardShadow,
                    },
                  ]}
                >
                  <View style={styles.reviewHeaderRow}>
                    <View
                      style={[
                        styles.reviewAvatarBox,
                        {
                          backgroundColor: rev.isOpponent
                            ? isDark
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(239, 68, 68, 0.1)'
                            : isDark
                            ? 'rgba(0, 214, 100, 0.15)'
                            : 'rgba(0, 214, 100, 0.1)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={rev.isOpponent ? 'shield' : 'people'}
                        size={18}
                        color={rev.isOpponent ? colors.danger : colors.primary}
                      />
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
                      <View style={styles.reviewScoreRow}>
                        <Ionicons name="star" size={13} color="#F59E0B" />
                        <Text style={[styles.reviewScoreVal, { color: colors.text }]}>
                          {rev.skillRating}/5
                        </Text>
                      </View>
                      <View style={styles.reviewScoreRow}>
                        <Ionicons name="heart" size={13} color="#EC4899" />
                        <Text style={[styles.reviewScoreVal, { color: colors.text }]}>
                          {rev.fairPlayRating}/5
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Badges Awarded */}
                  {rev.badges && rev.badges.length > 0 && (
                    <View style={styles.reviewBadgesWrap}>
                      {rev.badges.map((badge, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.reviewBadgePill,
                            {
                              backgroundColor: isDark
                                ? 'rgba(0, 214, 100, 0.12)'
                                : 'rgba(0, 214, 100, 0.08)',
                            },
                          ]}
                        >
                          <Text style={[styles.reviewBadgeText, { color: colors.primary }]}>
                            {badge}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Comment */}
                  {rev.comment ? (
                    <View
                      style={[
                        styles.reviewQuoteBox,
                        {
                          backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.reviewQuoteText, { color: colors.text }]}>
                        "{rev.comment}"
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <EmptyState
                icon="chatbubbles-outline"
                title="Henüz Değerlendirme Yok"
                description="Oynadığın maçlardan sonra rakiplerin seni değerlendirdiğinde yorumlar ve rozetler burada görünecektir."
              />
            )}
          </View>
        )}

        {/* Tab Content: LISTINGS */}
        {profileTab === 'LISTINGS' && (
          <View>
            {myListings.length > 0 ? (
              myListings.map((g) => (
                <View key={g.id} style={{ marginBottom: 8 }}>
                  <GearCard item={g} />
                  {g.status === 'Available' && (
                    <TouchableOpacity
                      style={styles.markSoldBtn}
                      onPress={() => markGearSold(g.id)}
                    >
                      <Ionicons name="checkmark-done" size={16} color={colors.warning} />
                      <Text style={[styles.markSoldText, { color: colors.warning }]}>
                        Satıldı Olarak İşaretle
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <EmptyState
                icon="pricetag-outline"
                title="Henüz Bir İlan Vermedin"
                description="İkinci el krampon, forma veya kaleci ekipmanlarını pazarda satmak için 'İlan / Maç' sekmesini kullanabilirsin."
              />
            )}
          </View>
        )}

        {/* Tab Content: SETTINGS */}
        {profileTab === 'SETTINGS' && (
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            {/* Theme Toggle Section */}
            <Text style={[styles.settingsHeader, { color: colors.text }]}>Görünüm ve Tema</Text>
            <Text style={[styles.settingsDesc, { color: colors.textSecondary }]}>
              Uygulamayı tercihinize göre Aydınlık veya Karanlık modda kullanabilirsiniz.
            </Text>

            <View style={styles.themeSwitchRow}>
              <TouchableOpacity
                style={[
                  styles.themeSelectBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9',
                    borderColor: !isDark ? colors.primary : colors.surfaceBorder,
                  },
                  !isDark && { backgroundColor: `${colors.primary}15`, borderWidth: 1.5 },
                ]}
                onPress={() => setThemeMode('light')}
              >
                <Ionicons
                  name="sunny"
                  size={20}
                  color={!isDark ? colors.primary : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.themeSelectText,
                    { color: !isDark ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Aydınlık Mod
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeSelectBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9',
                    borderColor: isDark ? colors.primary : colors.surfaceBorder,
                  },
                  isDark && { backgroundColor: `${colors.primary}20`, borderWidth: 1.5 },
                ]}
                onPress={() => setThemeMode('dark')}
              >
                <Ionicons
                  name="moon"
                  size={20}
                  color={isDark ? colors.primaryLight : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.themeSelectText,
                    { color: isDark ? colors.primaryLight : colors.textSecondary },
                  ]}
                >
                  Karanlık Mod
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.sectionDivider,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' },
              ]}
            />

            {/* Data & Reset */}
            <Text style={[styles.settingsHeader, { color: colors.text }]}>Veri Yönetimi</Text>
            <Text style={[styles.settingsDesc, { color: colors.textSecondary }]}>
              Örnek maç, pazar ve kullanıcı verilerini başlangıç durumuna sıfırlayabilirsiniz.
            </Text>

            <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
              <Ionicons name="refresh" size={18} color="#EF4444" />
              <Text style={styles.resetBtnText}>Demo Verilerini Sıfırla (Reset)</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.infoRow,
                { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' },
              ]}
            >
              <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Uygulama</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>Kadro Halı Saha & Pazar</Text>
            </View>
            <View
              style={[
                styles.infoRow,
                { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' },
              ]}
            >
              <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Tema Durumu</Text>
              <Text style={[styles.infoVal, { color: colors.primary }]}>
                {isDark ? 'Karanlık (Dark Carbon)' : 'Aydınlık (Light Arena)'}
              </Text>
            </View>
            <View
              style={[
                styles.infoRow,
                { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' },
              ]}
            >
              <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Versiyon</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>1.2.0 (Tahmin & Dark Mode Destekli)</Text>
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
  card: {
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    borderRadius: 12,
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
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  bioText: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.md,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  editForm: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    paddingTop: SPACING.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: FONT_SIZE.sm,
    borderWidth: 1,
  },
  posRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  posButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  posButtonText: {
    fontWeight: '700',
    fontSize: FONT_SIZE.xs,
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FONT_SIZE.sm,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '800',
  },
  markSoldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 8,
    gap: 4,
  },
  markSoldText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  settingsCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  settingsHeader: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  settingsDesc: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  themeSwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  themeSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  themeSelectText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  sectionDivider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
    marginBottom: SPACING.lg,
  },
  resetBtnText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: FONT_SIZE.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  infoKey: {
    fontSize: FONT_SIZE.xs,
  },
  infoVal: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  badgesShowcase: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  badgesSectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  badgeLabelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: 10,
    elevation: 2,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAuthorName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  reviewMatchTitle: {
    fontSize: 10,
    marginTop: 2,
  },
  reviewScoresCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  reviewScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewScoreVal: {
    fontSize: 11,
    fontWeight: '800',
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
    borderRadius: 6,
  },
  reviewBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reviewQuoteBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewQuoteText: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});


