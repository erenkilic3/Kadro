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
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';

export default function RegionalLeaguesScreen() {
  const { leagues, refreshData } = useApp();
  const { colors } = useTheme();

  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const districts = useMemo(() => {
    const set = new Set<string>();
    leagues.forEach((l) => set.add(l.district));
    return Array.from(set);
  }, [leagues]);

  const filteredLeagues = useMemo(() => {
    return leagues.filter((league) => {
      if (selectedRegion !== 'ALL' && league.district !== selectedRegion) {
        return false;
      }
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
      <View style={styles.header}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Ligler</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Bölgesel turnuvalar ve puan durumları
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() =>
            router.push({ pathname: '/(tabs)/create', params: { tab: 'LEAGUE' } } as any)
          }
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Lig Kur</Text>
        </TouchableOpacity>
      </View>

      {/* District Chips */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: selectedRegion === 'ALL' ? colors.text : colors.surface,
                borderColor: selectedRegion === 'ALL' ? colors.text : colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedRegion('ALL')}
          >
            <Text
              style={[
                styles.chipText,
                { color: selectedRegion === 'ALL' ? colors.background : colors.textSecondary },
              ]}
            >
              Tüm Bölgeler ({leagues.length})
            </Text>
          </TouchableOpacity>

          {districts.map((d) => {
            const isSelected = selectedRegion === d;
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.text : colors.surface,
                    borderColor: isSelected ? colors.text : colors.surfaceBorder,
                  },
                ]}
                onPress={() => setSelectedRegion(d)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? colors.background : colors.textSecondary },
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Status Underline Tabs */}
      <View style={[styles.statusTabsRow, { borderBottomColor: colors.surfaceBorder }]}>
        {(
          [
            { key: 'ALL' as const, label: 'Tümü' },
            { key: 'OPEN' as const, label: 'Kayıtlar Açık' },
            { key: 'IN_PROGRESS' as const, label: 'Devam Edenler' },
          ]
        ).map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.statusTab, isActive && { borderBottomColor: colors.primary }]}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text
                style={[
                  styles.statusTabText,
                  { color: isActive ? colors.text : colors.textTertiary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
        renderItem={({ item }) => <LeagueCard league={item} />}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title="Lig bulunamadı"
            description="Seçtiğiniz filtrelere uygun lig yok. Kendi bölgesel liginizi başlatabilirsiniz."
            buttonText="Yeni Lig Kur"
            onPress={() =>
              router.push({ pathname: '/(tabs)/create', params: { tab: 'LEAGUE' } } as any)
            }
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
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  screenSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
    fontWeight: '500',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  chipsWrap: {
    marginBottom: SPACING.xs,
  },
  chipScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  statusTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 20,
  },
  statusTab: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  statusTabText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
});
