import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerPosition } from '../types';
import { POSITION_COLORS, POSITION_LABELS, FONT_SIZE } from '../constants/theme';

interface PositionBadgeProps {
  position: PlayerPosition;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const PositionBadge: React.FC<PositionBadgeProps> = ({
  position,
  size = 'md',
  showLabel = true,
}) => {
  const color = POSITION_COLORS[position] || '#10B981';
  const label = POSITION_LABELS[position] || position;

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: color,
          backgroundColor: `${color}20`,
          paddingHorizontal: isSmall ? 6 : isLarge ? 12 : 8,
          paddingVertical: isSmall ? 2 : isLarge ? 5 : 3,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.text,
          {
            color: color,
            fontSize: isSmall ? FONT_SIZE.xs : isLarge ? FONT_SIZE.md : FONT_SIZE.sm,
            fontWeight: '700',
          },
        ]}
      >
        {position} {showLabel && !isSmall ? `• ${label}` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    letterSpacing: 0.3,
  },
});
