import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GearItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../constants/theme';

interface GearCardProps {
  item: GearItem;
}

export const GearCard: React.FC<GearCardProps> = ({ item }) => {
  const { colors } = useTheme();
  const isSold = item.status === 'Sold';

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'Boots':
        return 'football-outline';
      case 'Jerseys':
        return 'shirt-outline';
      case 'Gloves':
        return 'hand-left-outline';
      default:
        return 'shield-outline';
    }
  };

  const getShortCondition = () => {
    if (item.condition.includes('Sıfır')) return 'Sıfır';
    if (item.condition.includes('Çok İyi')) return 'Çok İyi';
    return item.condition;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
        isSold && styles.cardSold,
      ]}
      onPress={() => router.push(`/gear/${item.id}`)}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.imageBox,
          {
            backgroundColor: colors.surfaceLight,
            borderBottomColor: colors.surfaceBorder,
          },
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name={getCategoryIcon()} size={34} color={colors.textSecondary} />
        )}

        <View
          style={[
            styles.conditionBadge,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Text style={[styles.conditionText, { color: colors.textSecondary }]} numberOfLines={1}>
            {getShortCondition()}
          </Text>
        </View>

        {isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>SATILDI</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandText, { color: colors.textTertiary }]}>{item.brand}</Text>
          <Text style={[styles.sizeText, { color: colors.textSecondary }]}>{item.size}</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.text }]}>
            ₺{item.price.toLocaleString('tr-TR')}
          </Text>
          <Text style={[styles.locationText, { color: colors.textTertiary }]} numberOfLines={1}>
            {item.location.split('/')[1]?.trim() || item.location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: SPACING.sm + 2,
    flex: 1,
    marginHorizontal: 4,
  },
  cardSold: {
    opacity: 0.6,
  },
  imageBox: {
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    letterSpacing: 1,
  },
  content: {
    padding: 10,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sizeText: {
    fontSize: 10,
    fontWeight: '600',
    ...NUMERIC_STYLE,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    minHeight: 36,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  price: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  locationText: {
    fontSize: 10,
    maxWidth: '48%',
  },
});
