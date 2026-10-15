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
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { GearCategory } from '../../types';

export default function MarketplaceScreen() {
  const { gearItems, refreshData } = useApp();
  const { colors, isDark } = useTheme();

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="cart" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>2. EL PAZAR</Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Futbolcular için güvenilir ekipman borsası
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.sellButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/create')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.sellButtonText}>İlan Ver</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
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
          placeholder="Krampon, forma, eldiven veya marka ara..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedCategory === 'ALL'
                    ? colors.primary
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedCategory === 'ALL' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedCategory('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedCategory === 'ALL' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Tümü ({gearItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedCategory === 'Boots'
                    ? colors.primary
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedCategory === 'Boots' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedCategory('Boots')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedCategory === 'Boots' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              👟 Kramponlar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedCategory === 'Jerseys'
                    ? colors.primary
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedCategory === 'Jerseys' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedCategory('Jerseys')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedCategory === 'Jerseys' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              👕 Formalar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedCategory === 'Gloves'
                    ? colors.primary
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedCategory === 'Gloves' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedCategory('Gloves')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedCategory === 'Gloves' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              🧤 Kaleci Eldiveni
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedCategory === 'Equipment'
                    ? colors.primary
                    : isDark
                    ? colors.surface
                    : '#FFFFFF',
                borderColor: selectedCategory === 'Equipment' ? colors.primary : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedCategory('Equipment')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedCategory === 'Equipment' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              🛡️ Ekipman & Top
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sort Row */}
      <View style={styles.sortRow}>
        <Text style={[styles.resultCount, { color: colors.textTertiary }]}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{filteredItems.length}</Text> ürün listeleniyor
        </Text>

        <View style={styles.sortToggle}>
          <TouchableOpacity
            onPress={() => setSortBy(sortBy === 'PRICE_LOW' ? 'PRICE_HIGH' : sortBy === 'PRICE_HIGH' ? 'NEWEST' : 'PRICE_LOW')}
            style={[
              styles.sortButton,
              {
                backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Ionicons name="swap-vertical" size={14} color={colors.primary} />
            <Text style={[styles.sortText, { color: colors.primary }]}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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
  titleIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
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
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
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
    fontWeight: '500',
  },
  sortToggle: {},
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 11,
    fontWeight: '800',
  },
  gridContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});

