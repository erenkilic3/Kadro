import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/EmptyState';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../constants/theme';
import { AppNotification } from '../types';

export default function NotificationsScreen() {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    refreshData,
    isLoading,
  } = useApp();
  const { colors } = useTheme();

  const handlePressNotification = async (item: AppNotification) => {
    if (!item.isRead) {
      await markNotificationRead(item.id);
    }

    if (item.entityType === 'MATCH' && item.entityId) {
      router.push(`/match/${item.entityId}` as any);
    } else if (item.entityType === 'LEAGUE' && item.entityId) {
      router.push(`/league/${item.entityId}` as any);
    } else if (item.entityType === 'GEAR' && item.entityId) {
      router.push(`/gear/${item.entityId}` as any);
    }
  };

  const getIconName = (type: AppNotification['type']) => {
    switch (type) {
      case 'JOIN_REQUEST_RECEIVED':
        return 'person-add-outline';
      case 'JOIN_REQUEST_APPROVED':
        return 'checkmark-circle-outline';
      case 'JOIN_REQUEST_REJECTED':
        return 'close-circle-outline';
      case 'LEAGUE_UPDATED':
        return 'trophy-outline';
      case 'GEAR_UPDATED':
        return 'pricetag-outline';
      default:
        return 'football-outline';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {unreadNotificationsCount > 0 && (
        <View
          style={[
            styles.topActionBar,
            { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder },
          ]}
        >
          <Text style={[styles.unreadText, { color: colors.textSecondary }]}>
            {unreadNotificationsCount} okunmamış bildirim
          </Text>
          <TouchableOpacity onPress={markAllNotificationsRead} hitSlop={14}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Tümünü Okundu İşaretle
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.rowCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
                borderLeftWidth: item.isRead ? 1 : 3,
                borderLeftColor: item.isRead ? colors.surfaceBorder : colors.primary,
              },
            ]}
            onPress={() => handlePressNotification(item)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: item.isRead
                    ? colors.surfaceLight
                    : `${colors.primary}18`,
                },
              ]}
            >
              <Ionicons
                name={getIconName(item.type)}
                size={18}
                color={item.isRead ? colors.textTertiary : colors.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.timeText, { color: colors.textTertiary }]}>
                  {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>
              </View>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{item.body}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="Bildirim bulunmuyor"
            description="Kadro başvuruları, maç değişiklikleri ve lig sonuçları burada görünür."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  unreadText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    ...NUMERIC_STYLE,
  },
  markAllText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm,
  },
  rowCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '600',
    ...NUMERIC_STYLE,
  },
  body: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
});
