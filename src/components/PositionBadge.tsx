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
  const color = POSITION_COLORS[position] || '#16A34A';
  const label = POSITION_LABELS[position] || position;

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}18`,
          paddingHorizontal: isSmall ? 7 : isLarge ? 12 : 9,
          paddingVertical: isSmall ? 3 : isLarge ? 5 : 4,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: isSmall ? 11 : isLarge ? FONT_SIZE.sm : FONT_SIZE.xs,
          },
        ]}
      >
        {position}
        {showLabel && !isSmall ? ` · ${label}` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
