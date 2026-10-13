import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GearItem } from '../types';
import { COLORS, FONT_SIZE, SPACING } from '../constants/theme';

interface GearCardProps {
  item: GearItem;
}

export const GearCard: React.FC<GearCardProps> = ({ item }) => {
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
    if (item.condition.includes('Sıfır')) return COLORS.success;
    if (item.condition.includes('Çok İyi')) return COLORS.accent;
    return COLORS.warning;
  };

  return (
    <TouchableOpacity
      style={[styles.card, isSold && styles.cardSold]}
      onPress={() => router.push(`/gear/${item.id}`)}
      activeOpacity={0.88}
    >
      {/* Visual Product Box */}
      <View style={styles.imageBox}>
        <Ionicons name={getCategoryIcon()} size={42} color={COLORS.primaryLight} />
        
        {/* Condition Tag */}
        <View style={[styles.conditionBadge, { backgroundColor: getConditionColor() }]}>
          <Text style={styles.conditionText} numberOfLines={1}>{item.condition}</Text>
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
          <Text style={styles.brandText}>{item.brand}</Text>
          <View style={styles.sizePill}>
            <Text style={styles.sizeText}>{item.size}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>₺{item.price.toLocaleString('tr-TR')}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textTertiary} />
            <Text style={styles.locationText} numberOfLines={1}>
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
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cardSold: {
    opacity: 0.65,
  },
  imageBox: {
    height: 110,
    backgroundColor: COLORS.surfaceLight,
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
    color: COLORS.black,
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
    color: COLORS.danger,
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
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sizePill: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sizeText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
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
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  price: {
    color: COLORS.accent,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
  },
  locationText: {
    color: COLORS.textTertiary,
    fontSize: 10,
    marginLeft: 2,
  },
});
