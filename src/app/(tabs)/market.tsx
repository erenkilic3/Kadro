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
import { GearCard } from '../../components/GearCard';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';
import { GearCategory } from '../../types';

const MARKET_CATEGORIES: { key: 'ALL' | GearCategory; label: string }[] = [
  { key: 'ALL', label: 'Tümü' },
  { key: 'Boots', label: 'Krampon' },
  { key: 'Jerseys', label: 'Forma' },
  { key: 'Gloves', label: 'Eldiven' },
  { key: 'Equipment', label: 'Ekipman' },
];

export default function MarketplaceScreen() {
  const { gearItems, refreshData } = useApp();
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | GearCategory>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH'>('NEWEST');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const filteredItems = useMemo(() => {
    let items = gearItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      return true;
    });

    if (sortBy === 'PRICE_LOW') {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_HIGH') {
      items = [...items].sort((a, b) => b.price - a.price);
    }

    return items;
  }, [gearItems, searchQuery, selectedCategory, sortBy]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Pazar</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            İkinci el futbol ekipmanları
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.sellButton, { backgroundColor: colors.primary }]}
          onPress={() =>
            router.push({ pathname: '/(tabs)/create', params: { tab: 'GEAR' } } as any)
          }
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.sellButtonText}>İlan Ver</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
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
          placeholder="Krampon, forma, marka veya semt ara"
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {MARKET_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.text : colors.surface,
                    borderColor: isSelected ? colors.text : colors.surfaceBorder,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? colors.background : colors.textSecondary },
                  ]}
                >
                  {cat.label}
                  {cat.key === 'ALL' ? ` (${gearItems.length})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Row */}
      <View style={styles.sortRow}>
        <Text style={[styles.resultCount, { color: colors.textTertiary }]}>
          {filteredItems.length} ilan
        </Text>

        <TouchableOpacity
          onPress={() =>
            setSortBy(
              sortBy === 'PRICE_LOW'
                ? 'PRICE_HIGH'
                : sortBy === 'PRICE_HIGH'
                ? 'NEWEST'
                : 'PRICE_LOW'
            )
          }
          style={[styles.sortButton, { backgroundColor: colors.surfaceLight }]}
        >
          <Ionicons name="swap-vertical-outline" size={14} color={colors.text} />
          <Text style={[styles.sortText, { color: colors.text }]}>
            {sortBy === 'PRICE_LOW'
              ? 'Artan Fiyat'
              : sortBy === 'PRICE_HIGH'
              ? 'Azalan Fiyat'
              : 'En Yeniler'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2-Column Product Grid */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <GearCard item={item} />}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="pricetag-outline"
            title="Ürün bulunamadı"
            description="Arama filtrenizi temizleyebilir veya yeni bir ekipman ilanı verebilirsiniz."
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
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
    fontWeight: '500',
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
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
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    marginBottom: 4,
  },
  resultCount: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  sortText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
