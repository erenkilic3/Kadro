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
import { GearCard } from '../../components/GearCard';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, FONT_SIZE, SPACING } from '../../constants/theme';
import { GearCategory } from '../../types';

export default function MarketplaceScreen() {
  const { gearItems, refreshData } = useApp();
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
      // Search
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'PRICE_LOW') {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_HIGH') {
      items = [...items].sort((a, b) => b.price - a.price);
    }

    return items;
  }, [gearItems, searchQuery, selectedCategory, sortBy]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Ionicons name="cart" size={22} color={COLORS.accent} style={{ marginRight: 6 }} />
            <Text style={styles.headerTitle}>2. EL PAZAR</Text>
          </View>
          <Text style={styles.headerSub}>Amatör futbolcular için ekipman borsası</Text>
        </View>

        <TouchableOpacity
          style={styles.sellButton}
          onPress={() => router.push('/(tabs)/create')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={COLORS.black} />
          <Text style={styles.sellButtonText}>İlan Ver</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Krampon, forma, eldiven veya marka ara..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('ALL')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'ALL' && styles.filterChipTextActive]}>
              Tümü ({gearItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'Boots' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('Boots')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'Boots' && styles.filterChipTextActive]}>
              👟 Kramponlar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'Jerseys' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('Jerseys')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'Jerseys' && styles.filterChipTextActive]}>
              👕 Formalar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'Gloves' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('Gloves')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'Gloves' && styles.filterChipTextActive]}>
              🧤 Kaleci Eldiveni
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'Equipment' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('Equipment')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'Equipment' && styles.filterChipTextActive]}>
              🛡️ Ekipman & Top
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sort Row */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>
          <Text style={{ color: COLORS.accent, fontWeight: '700' }}>{filteredItems.length}</Text> ürün listeleniyor
        </Text>

        <View style={styles.sortToggle}>
          <TouchableOpacity
            onPress={() => setSortBy(sortBy === 'PRICE_LOW' ? 'PRICE_HIGH' : sortBy === 'PRICE_HIGH' ? 'NEWEST' : 'PRICE_LOW')}
            style={styles.sortButton}
          >
            <Ionicons name="swap-vertical" size={14} color={COLORS.primaryLight} />
            <Text style={styles.sortText}>
              {sortBy === 'PRICE_LOW' ? 'Fiyat: Artan' : sortBy === 'PRICE_HIGH' ? 'Fiyat: Azalan' : 'En Yeniler'}
            </Text>
          </TouchableOpacity>
        </View>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="shirt-outline"
            title="Ürün Bulunamadı"
            description="Arama filtrenize uygun 2. el spor ekipmanı bulunamadı. Kendi ekipmanınızı satmak için hemen ilan verebilirsiniz."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  sellButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    height: '100%',
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
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: COLORS.black,
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
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.xs,
  },
  sortToggle: {},
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sortText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
