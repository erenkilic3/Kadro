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
import { useApp } from '../../context/AppContext';
import { MatchCard } from '../../components/MatchCard';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, FONT_SIZE, SPACING } from '../../constants/theme';
import { PlayerPosition } from '../../types';

export default function MatchFeedScreen() {
  const { matches, currentUser, isLoading, refreshData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | PlayerPosition | 'DISTRICT_KADIKOY' | 'DISTRICT_BESIKTAS'>('ALL');
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
      if (selectedFilter === 'DISTRICT_KADIKOY') return m.district.toLowerCase().includes('kadıköy');
      if (selectedFilter === 'DISTRICT_BESIKTAS') return m.district.toLowerCase().includes('beşiktaş');

      // Position filter
      return m.missingPositions.includes(selectedFilter as PlayerPosition);
    });
  }, [matches, searchQuery, selectedFilter]);

  const totalMissingPlayers = useMemo(() => {
    return matches.reduce((acc, m) => acc + (m.totalSlots - m.roster.filter((s) => s.isFilled).length), 0);
  }, [matches]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="football" size={20} color={COLORS.black} />
            </View>
            <Text style={styles.brandTitle}>KADRO</Text>
          </View>
          <Text style={styles.locationSub}>
            <Ionicons name="location-sharp" size={12} color={COLORS.primaryLight} /> {currentUser.city || 'İstanbul'}, {currentUser.district || 'Kadıköy'}
          </Text>
        </View>

        <View style={styles.userBadge}>
          <Text style={styles.userGreeting}>Merhaba,</Text>
          <Text style={styles.userName}>{currentUser.name?.split(' ')[0] || 'Oyuncu'}</Text>
        </View>
      </View>

      {/* Missing Player Announcement Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Ionicons name="flame" size={20} color={COLORS.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Hemen Maça Çık!</Text>
          <Text style={styles.bannerText}>
            Çevrendeki maçlarda toplam <Text style={styles.boldText}>{totalMissingPlayers} eksik oyuncu</Text> aranıyor.
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Saha, semt veya maç ara..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips Scroll */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'ALL' && styles.filterChipTextActive]}>
              Tüm Maçlar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'GK' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('GK')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'GK' && styles.filterChipTextActive]}>
              🧤 Kaleci (GK)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'DEF' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('DEF')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'DEF' && styles.filterChipTextActive]}>
              🛡️ Defans (DEF)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'MID' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('MID')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'MID' && styles.filterChipTextActive]}>
              🎯 Orta Saha (MID)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'FWD' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('FWD')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'FWD' && styles.filterChipTextActive]}>
              ⚡ Forvet (FWD)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'DISTRICT_KADIKOY' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('DISTRICT_KADIKOY')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'DISTRICT_KADIKOY' && styles.filterChipTextActive]}>
              📍 Kadıköy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'DISTRICT_BESIKTAS' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('DISTRICT_BESIKTAS')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'DISTRICT_BESIKTAS' && styles.filterChipTextActive]}>
              📍 Beşiktaş
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Match List */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} currentUserId={currentUser.id} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
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
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  locationSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  userBadge: {
    alignItems: 'flex-end',
  },
  userGreeting: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.xs,
  },
  userName: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bannerTitle: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  bannerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  boldText: {
    color: COLORS.text,
    fontWeight: '700',
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
    marginBottom: SPACING.sm,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: COLORS.black,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxl,
  },
});
