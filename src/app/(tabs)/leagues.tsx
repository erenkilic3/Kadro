import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { LeagueCard } from '../../components/LeagueCard';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { RegionalLeague } from '../../types';

export default function RegionalLeaguesScreen() {
  const { leagues, refreshData } = useApp();
  const { colors, isDark } = useTheme();

  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Distinct districts from leagues
  const districts = useMemo(() => {
    const set = new Set<string>();
    leagues.forEach((l) => set.add(l.district));
    return Array.from(set);
  }, [leagues]);

  const filteredLeagues = useMemo(() => {
    return leagues.filter((league) => {
      // Region filter
      if (selectedRegion !== 'ALL' && league.district !== selectedRegion) {
        return false;
      }
      // Status filter
      if (statusFilter === 'OPEN' && league.status !== 'REGISTRATION_OPEN') {
        return false;
      }
      if (statusFilter === 'IN_PROGRESS' && league.status !== 'IN_PROGRESS') {
        return false;
      }
      return true;
    });
  }, [leagues, selectedRegion, statusFilter]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.surfaceBorder,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.trophyIconWrap}>
            <Ionicons name="trophy" size={20} color="#F59E0B" />
          </View>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Bölgesel Ligler</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              Halı saha ligleri, fikstür ve turnuvalar
            </Text>
          </View>
        </View>

        {/* Quick New League Button */}
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/(tabs)/create', params: { tab: 'LEAGUE' } } as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Lig Kur</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLeagues}
        keyExtractor={(item) => item.id}
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
            {/* Callout Banner: Create League */}
            <View
              style={[
                styles.heroBanner,
                {
                  backgroundColor: isDark ? '#11221B' : '#E8FBF1',
                  borderColor: isDark ? 'rgba(0, 214, 100, 0.25)' : 'rgba(0, 214, 100, 0.4)',
                },
              ]}
            >
              <View style={styles.heroTextCol}>
                <View style={styles.heroTagRow}>
                  <Text style={styles.heroTag}>⭐ TOPLULUK ORGANİZASYONU</Text>
                </View>
                <Text style={[styles.heroHeading, { color: colors.text }]}>
                  Kendi Bölgesel Ligini Başlat
                </Text>
                <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
                  Semtindeki takımları topla, TFF kurallı puan durumu, fikstür ve kupa ödüllü ligini dakikalar içinde kur!
                </Text>

                <TouchableOpacity
                  style={[styles.heroActionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push({ pathname: '/(tabs)/create', params: { tab: 'LEAGUE' } } as any)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                  <Text style={styles.heroActionBtnText}>Yeni Bölgesel Lig Kur</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter Section */}
            <View style={styles.filterSection}>
              {/* Region Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedRegion === 'ALL'
                      ? [styles.chipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                      : [styles.chipInactive, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }],
                  ]}
                  onPress={() => setSelectedRegion('ALL')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selectedRegion === 'ALL' ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    📍 Tüm Bölgeler ({leagues.length})
                  </Text>
                </TouchableOpacity>

                {districts.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.chip,
                      selectedRegion === d
                        ? [styles.chipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                        : [styles.chipInactive, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }],
                    ]}
                    onPress={() => setSelectedRegion(d)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selectedRegion === d ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Status Tabs */}
              <View style={styles.statusTabsRow}>
                <TouchableOpacity
                  style={[
                    styles.statusTab,
                    statusFilter === 'ALL' && [styles.statusTabActive, { borderBottomColor: colors.primary }],
                  ]}
                  onPress={() => setStatusFilter('ALL')}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      { color: statusFilter === 'ALL' ? colors.text : colors.textTertiary },
                    ]}
                  >
                    Tüm Ligler
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusTab,
                    statusFilter === 'OPEN' && [styles.statusTabActive, { borderBottomColor: colors.primary }],
                  ]}
                  onPress={() => setStatusFilter('OPEN')}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      { color: statusFilter === 'OPEN' ? colors.primary : colors.textTertiary },
                    ]}
                  >
                    🟢 Kayıtlar Açık
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusTab,
                    statusFilter === 'IN_PROGRESS' && [styles.statusTabActive, { borderBottomColor: colors.primary }],
                  ]}
                  onPress={() => setStatusFilter('IN_PROGRESS')}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      { color: statusFilter === 'IN_PROGRESS' ? '#3B82F6' : colors.textTertiary },
                    ]}
                  >
                    ⚽ Devam Edenler
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => <LeagueCard league={item} />}
        ListEmptyComponent={
          <EmptyState
            title="Lig Bulunamadı"
            description="Seçtiğin kriterlere uygun lig bulunamadı. Kendi bölgesel halı saha ligini hemen kurabilirsin!"
            buttonText="🏆 Yeni Lig Oluştur"
            onPress={() => router.push({ pathname: '/(tabs)/create', params: { tab: 'LEAGUE' } } as any)}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  trophyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  heroBanner: {
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  heroTextCol: {
    gap: 6,
  },
  heroTagRow: {
    flexDirection: 'row',
  },
  heroTag: {
    color: '#00D664',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroHeading: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  heroDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 6,
    gap: 6,
    alignSelf: 'flex-start',
  },
  heroActionBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  filterSection: {
    marginBottom: SPACING.md,
  },
  chipScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipActive: {},
  chipInactive: {},
  chipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  statusTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 4,
    gap: 16,
  },
  statusTab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  statusTabActive: {},
  statusTabText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});
