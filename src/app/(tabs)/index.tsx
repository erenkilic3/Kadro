import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { MatchCard } from '../../components/MatchCard';
import { MatchPredictionCard } from '../../components/MatchPredictionCard';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { PlayerPosition } from '../../types';

export default function MatchFeedScreen() {
  const { matches, currentUser, refreshData, votePrediction } = useApp();
  const { colors, isDark, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'ALL' | 'PREDICTIONS' | PlayerPosition | 'DISTRICT_KADIKOY' | 'DISTRICT_BESIKTAS'
  >('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Search query filter
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.district.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter category
      if (selectedFilter === 'ALL') return true;
      if (selectedFilter === 'PREDICTIONS') return Boolean(m.prediction);
      if (selectedFilter === 'DISTRICT_KADIKOY') return m.district.toLowerCase().includes('kadıköy');
      if (selectedFilter === 'DISTRICT_BESIKTAS') return m.district.toLowerCase().includes('beşiktaş');

      // Position filter
      return m.missingPositions.includes(selectedFilter as PlayerPosition);
    });
  }, [matches, searchQuery, selectedFilter]);

  const totalMissingPlayers = useMemo(() => {
    return matches.reduce((acc, m) => acc + (m.totalSlots - m.roster.filter((s) => s.isFilled).length), 0);
  }, [matches]);

  const featuredPredictionMatch = useMemo(() => {
    return matches.find((m) => m.prediction?.category === 'Derbi') || matches.find((m) => m.prediction);
  }, [matches]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="football" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>KADRO</Text>
            <View style={[styles.livePill, { backgroundColor: `${colors.success}20` }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.liveText, { color: colors.success }]}>CANLI</Text>
            </View>
          </View>
          <Text style={[styles.locationSub, { color: colors.textSecondary }]}>
            <Ionicons name="location-sharp" size={12} color={colors.primary} />{' '}
            {currentUser.city || 'İstanbul'}, {currentUser.district || 'Kadıköy'}
          </Text>
        </View>

        {/* Right Header Actions: Theme Toggle & User Info */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7',
                borderColor: colors.surfaceBorder,
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel="Tema Değiştir"
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={18}
              color={isDark ? '#F59E0B' : '#4F46E5'}
            />
          </TouchableOpacity>

          <View style={styles.userBadge}>
            <Text style={[styles.userGreeting, { color: colors.textTertiary }]}>Merhaba,</Text>
            <Text style={[styles.userName, { color: colors.primary }]}>
              {currentUser.name?.split(' ')[0] || 'Oyuncu'}
            </Text>
          </View>
        </View>
      </View>

      {/* Match Search Input */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.surfaceBorder,
            shadowColor: colors.cardShadow,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Saha, semt veya maç ara..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips Scroll */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'ALL'
                    ? colors.primary
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedFilter === 'ALL' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === 'ALL' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Tüm Maçlar ({matches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'PREDICTIONS'
                    ? colors.warning
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedFilter === 'PREDICTIONS' ? colors.warning : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedFilter('PREDICTIONS')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === 'PREDICTIONS' ? '#000000' : colors.textSecondary },
              ]}
            >
              🏆 Maç Tahmini Yap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'GK'
                    ? colors.positionGK
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedFilter === 'GK' ? colors.positionGK : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedFilter('GK')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === 'GK' ? '#000000' : colors.textSecondary },
              ]}
            >
              🧤 Kaleci (GK)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'DEF'
                    ? colors.positionDEF
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedFilter === 'DEF' ? colors.positionDEF : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedFilter('DEF')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === 'DEF' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              🛡️ Defans (DEF)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'MID'
                    ? colors.positionMID
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedFilter === 'MID' ? colors.positionMID : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedFilter('MID')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === 'MID' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              🎯 Orta Saha (MID)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'FWD'
                    ? colors.positionFWD
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedFilter === 'FWD' ? colors.positionFWD : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedFilter('FWD')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === 'FWD' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              ⚡ Forvet (FWD)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'DISTRICT_KADIKOY'
                    ? colors.primary
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor:
                  selectedFilter === 'DISTRICT_KADIKOY' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedFilter('DISTRICT_KADIKOY')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === 'DISTRICT_KADIKOY' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              📍 Kadıköy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'DISTRICT_BESIKTAS'
                    ? colors.primary
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor:
                  selectedFilter === 'DISTRICT_BESIKTAS' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedFilter('DISTRICT_BESIKTAS')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedFilter === 'DISTRICT_BESIKTAS' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              📍 Beşiktaş
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Match List with Header Hero */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} currentUserId={currentUser.id} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
            {/* Live Match Finder Banner */}
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
                },
              ]}
            >
              <View style={[styles.bannerIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="flame" size={20} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: colors.warning }]}>
                  {totalMissingPlayers} Eksik Mevki Aranıyor!
                </Text>
                <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
                  Yakınındaki halı sahalarda boş mevkileri incele, kadroya adını yazdır.
                </Text>
              </View>
            </View>

            {/* Regional Leagues Highlight Banner */}
            <TouchableOpacity
              style={[
                styles.leagueBannerCard,
                {
                  backgroundColor: isDark ? '#10221B' : '#E8FBF1',
                  borderColor: isDark ? 'rgba(0, 214, 100, 0.25)' : 'rgba(0, 214, 100, 0.4)',
                },
              ]}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/leagues' as any)}
            >
              <View style={styles.leagueBannerIcon}>
                <Ionicons name="trophy" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.leagueBannerTagRow}>
                  <Text style={styles.leagueBannerTag}>🏆 BÖLGESEL LİGLER</Text>
                  <Text style={[styles.leagueBannerTagSub, { color: colors.primary }]}>YENİ</Text>
                </View>
                <Text style={[styles.leagueBannerTitle, { color: colors.text }]}>
                  Semtinin Halı Saha Ligini Kur veya Katıl!
                </Text>
                <Text style={[styles.leagueBannerDesc, { color: colors.textSecondary }]}>
                  Kadıköy, Beşiktaş ve Bakırköy liglerinde canlı puan durumu ve fikstür seni bekliyor.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>

            {/* Featured Prediction Hero Widget */}
            {selectedFilter !== 'PREDICTIONS' && featuredPredictionMatch?.prediction && (
              <View style={styles.featuredSection}>
                <View style={styles.featuredHeaderRow}>
                  <View style={styles.featuredTitleBadge}>
                    <Ionicons name="trophy" size={14} color={colors.warning} />
                    <Text style={[styles.featuredSectionTitle, { color: colors.text }]}>
                      Günün Maç Tahmini
                    </Text>
                  </View>
                  <Text style={[styles.featuredSectionSub, { color: colors.textTertiary }]}>
                    Doğru bil, +25 puan kazan!
                  </Text>
                </View>

                <MatchPredictionCard
                  prediction={featuredPredictionMatch.prediction}
                  matchId={featuredPredictionMatch.id}
                  onVote={(choice) => votePrediction(featuredPredictionMatch.id, choice)}
                />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="football-outline"
            title="Eşleşen Maç Bulunamadı"
            description="Arama kriterlerini temizleyebilir veya yeni bir halı saha maçı ilanı oluşturabilirsiniz."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  locationSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  userBadge: {
    alignItems: 'flex-end',
  },
  userGreeting: {
    fontSize: 10,
    fontWeight: '600',
  },
  userName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bannerTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  bannerText: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  featuredSection: {
    marginBottom: SPACING.sm,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredSectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  featuredSectionSub: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    height: '100%',
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: SPACING.sm,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxl,
  },
  leagueBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: 12,
  },
  leagueBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 214, 100, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueBannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  leagueBannerTag: {
    color: '#00D664',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  leagueBannerTagSub: {
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 214, 100, 0.15)',
  },
  leagueBannerTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  leagueBannerDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});

