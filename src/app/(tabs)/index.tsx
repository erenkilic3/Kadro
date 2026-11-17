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
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../../constants/theme';
import { PlayerPosition } from '../../types';
import { getInitials } from '../../utils/formatters';

type FeedFilter =
  | 'ALL'
  | 'PREDICTIONS'
  | PlayerPosition
  | 'DISTRICT_KADIKOY'
  | 'DISTRICT_BESIKTAS';

const FEED_FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'ALL', label: 'Tümü' },
  { key: 'PREDICTIONS', label: 'Tahminli' },
  { key: 'GK', label: 'Kaleci' },
  { key: 'DEF', label: 'Defans' },
  { key: 'MID', label: 'Orta Saha' },
  { key: 'FWD', label: 'Forvet' },
  { key: 'DISTRICT_KADIKOY', label: 'Kadıköy' },
  { key: 'DISTRICT_BESIKTAS', label: 'Beşiktaş' },
];

export default function MatchFeedScreen() {
  const {
    matches,
    currentUser,
    refreshData,
    votePrediction,
    unreadNotificationsCount,
    errorMessage,
    clearError,
  } = useApp();
  const { colors, isDark, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FeedFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        m.title.toLowerCase().includes(q) ||
        m.venueName.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedFilter === 'ALL') return true;
      if (selectedFilter === 'PREDICTIONS') return Boolean(m.prediction);
      if (selectedFilter === 'DISTRICT_KADIKOY') {
        return m.district.toLowerCase().includes('kadıköy');
      }
      if (selectedFilter === 'DISTRICT_BESIKTAS') {
        return m.district.toLowerCase().includes('beşiktaş');
      }

      return m.missingPositions.includes(selectedFilter as PlayerPosition);
    });
  }, [matches, searchQuery, selectedFilter]);

  const totalMissingPlayers = useMemo(() => {
    return matches.reduce(
      (acc, m) => acc + (m.totalSlots - m.roster.filter((s) => s.isFilled).length),
      0
    );
  }, [matches]);

  const featuredPredictionMatch = useMemo(() => {
    return (
      matches.find((m) => m.prediction?.category === 'Derbi') ||
      matches.find((m) => m.prediction)
    );
  }, [matches]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Clean Editorial Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>Kadro</Text>
          <Text style={[styles.locationSub, { color: colors.textSecondary }]}>
            {currentUser.district || 'Kadıköy'}, {currentUser.city || 'İstanbul'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.75}
            hitSlop={14}
            accessibilityLabel="Bildirimler"
          >
            <Ionicons name="notifications-outline" size={17} color={colors.text} />
            {unreadNotificationsCount > 0 && (
              <View style={[styles.notifDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.75}
            hitSlop={14}
            accessibilityLabel="Tema Değiştir"
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={17}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.avatarPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
            hitSlop={14}
          >
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {getInitials(currentUser.name || 'EK')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={17}
          color={colors.textTertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Saha, semt veya maç ara"
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={14}>
            <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FEED_FILTERS.map((chip) => {
            const isSelected = selectedFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.text : colors.surface,
                    borderColor: isSelected ? colors.text : colors.surfaceBorder,
                  },
                ]}
                onPress={() => setSelectedFilter(chip.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? colors.background : colors.textSecondary },
                  ]}
                >
                  {chip.label}
                  {chip.key === 'ALL' ? ` (${matches.length})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Match List */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} currentUserId={currentUser.id} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {errorMessage && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: `${colors.danger}12`,
                    borderColor: `${colors.danger}35`,
                  },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.errorBannerText, { color: colors.danger }]} numberOfLines={2}>
                  {errorMessage}
                </Text>
                <TouchableOpacity onPress={() => void refreshData()} hitSlop={14}>
                  <Text style={[styles.errorRetryText, { color: colors.danger }]}>Yenile</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearError} hitSlop={14}>
                  <Ionicons name="close" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}

            {/* Compact Status & Leagues Bar */}
            <View
              style={[
                styles.quickBar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <View style={styles.quickBarLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.quickBarText, { color: colors.textSecondary }]}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>
                    {totalMissingPlayers} eksik mevki
                  </Text>{' '}
                  oyuncu aranıyor
                </Text>
              </View>

              <View style={styles.quickBarLinks}>
                <TouchableOpacity
                  style={styles.leaguesShortcut}
                  onPress={() => router.push('/teams')}
                  activeOpacity={0.75}
                  hitSlop={14}
                >
                  <Text style={[styles.leaguesShortcutText, { color: colors.textSecondary }]}>
                    Takımlar
                  </Text>
                </TouchableOpacity>
                <View style={[styles.quickBarSep, { backgroundColor: colors.surfaceBorder }]} />
                <TouchableOpacity
                  style={styles.leaguesShortcut}
                  onPress={() => router.push('/(tabs)/leagues' as any)}
                  activeOpacity={0.75}
                  hitSlop={14}
                >
                  <Text style={[styles.leaguesShortcutText, { color: colors.primary }]}>
                    Ligler
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Featured Match Poll */}
            {selectedFilter !== 'PREDICTIONS' && featuredPredictionMatch?.prediction && (
              <View style={styles.featuredSection}>
                <View style={styles.featuredHeaderRow}>
                  <Text style={[styles.featuredSectionTitle, { color: colors.textTertiary }]}>
                    HAFTANIN ANKETİ
                  </Text>
                  <Text style={[styles.featuredSectionSub, { color: colors.textTertiary }]}>
                    {featuredPredictionMatch.district}
                  </Text>
                </View>

                <MatchPredictionCard
                  prediction={featuredPredictionMatch.prediction}
                  matchId={featuredPredictionMatch.id}
                  onVote={(choice) => votePrediction(featuredPredictionMatch.id, choice)}
                  compact
                />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="football-outline"
            title="Eşleşen maç bulunamadı"
            description="Arama filtresini temizleyebilir veya yeni bir maç ilanı oluşturabilirsiniz."
            buttonText="Maç İlanı Aç"
            onPress={() => router.push('/(tabs)/create' as any)}
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
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  locationSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPill: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 40,
    borderWidth: 1,
    marginBottom: SPACING.sm,
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
    marginBottom: SPACING.xs,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 6,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxl,
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    marginBottom: SPACING.md,
  },
  quickBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  quickBarText: {
    fontSize: FONT_SIZE.xs,
    ...NUMERIC_STYLE,
  },
  leaguesShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  leaguesShortcutText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  featuredSection: {
    marginBottom: SPACING.xs,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  featuredSectionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  featuredSectionSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: SPACING.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  errorRetryText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  quickBarLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickBarSep: {
    width: 1,
    height: 12,
  },
});
