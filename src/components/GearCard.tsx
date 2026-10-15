import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GearItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, SPACING } from '../constants/theme';

interface GearCardProps {
  item: GearItem;
}

export const GearCard: React.FC<GearCardProps> = ({ item }) => {
  const { colors, isDark } = useTheme();
  const isSold = item.status === 'Sold';

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'Boots':
        return 'football';
      case 'Jerseys':
        return 'shirt';
      case 'Gloves':
        return 'hand-left';
      default:
        return 'shield-checkmark';
    }
  };

  const getConditionColor = () => {
    if (item.condition.includes('Sıfır')) return colors.success;
    if (item.condition.includes('Çok İyi')) return colors.primary;
    return colors.warning;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: colors.surfaceBorder,
          shadowColor: colors.cardShadow,
        },
        isSold && styles.cardSold,
      ]}
      onPress={() => router.push(`/gear/${item.id}`)}
      activeOpacity={0.88}
    >
      {/* Visual Product Box */}
      <View
        style={[
          styles.imageBox,
          { backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9' },
        ]}
      >
        <Ionicons name={getCategoryIcon()} size={42} color={colors.primary} />

        {/* Condition Tag */}
        <View style={[styles.conditionBadge, { backgroundColor: getConditionColor() }]}>
          <Text style={styles.conditionText} numberOfLines={1}>
            {item.condition}
          </Text>
        </View>

        {isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>SATILDI</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandText, { color: colors.textTertiary }]}>{item.brand}</Text>
          <View
            style={[
              styles.sizePill,
              { backgroundColor: isDark ? colors.surfaceLight : '#EEF2F6' },
            ]}
          >
            <Text style={[styles.sizeText, { color: colors.primary }]}>{item.size}</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        <View
          style={[
            styles.footer,
            {
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.price, { color: colors.accent }]}>
            ₺{item.price.toLocaleString('tr-TR')}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.locationText, { color: colors.textTertiary }]} numberOfLines={1}>
              {item.location.split('/')[1]?.trim() || item.location}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: SPACING.md,
    flex: 1,
    marginHorizontal: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardSold: {
    opacity: 0.65,
  },
  imageBox: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: '85%',
  },
  conditionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    color: '#EF4444',
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  content: {
    padding: SPACING.sm + 2,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sizePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sizeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    minHeight: 36,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
  },
  price: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
  },
  locationText: {
    fontSize: 10,
    marginLeft: 2,
  },
});

