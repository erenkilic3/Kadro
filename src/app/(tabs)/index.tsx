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
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';
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
  const { matches, currentUser, refreshData, votePrediction } = useApp();
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
            style={[styles.iconButton, { backgroundColor: colors.surfaceLight }]}
            onPress={toggleTheme}
            activeOpacity={0.75}
            accessibilityLabel="Tema Değiştir"
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.avatarPill, { backgroundColor: colors.surfaceLight }]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
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
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
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

              <TouchableOpacity
                style={styles.leaguesShortcut}
                onPress={() => router.push('/(tabs)/leagues' as any)}
                activeOpacity={0.75}
              >
                <Text style={[styles.leaguesShortcutText, { color: colors.primary }]}>
                  Ligler
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Featured Match Poll */}
            {selectedFilter !== 'PREDICTIONS' && featuredPredictionMatch?.prediction && (
              <View style={styles.featuredSection}>
                <View style={styles.featuredHeaderRow}>
                  <Text style={[styles.featuredSectionTitle, { color: colors.text }]}>
                    Günün Maç Anketi
                  </Text>
                  <Text style={[styles.featuredSectionSub, { color: colors.textTertiary }]}>
                    {featuredPredictionMatch.district}
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
            title="Eşleşen maç bulunamadı"
            description="Arama filtresini temizleyebilir veya yeni bir maç ilanı oluşturabilirsiniz."
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
    fontSize: 26,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 42,
    borderWidth: StyleSheet.hairlineWidth,
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
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    marginBottom: SPACING.md,
  },
  quickBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  quickBarText: {
    fontSize: FONT_SIZE.xs,
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
    marginBottom: 8,
  },
  featuredSectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  featuredSectionSub: {
    fontSize: 11,
    fontWeight: '600',
  },
});
