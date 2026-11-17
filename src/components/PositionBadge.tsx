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
          backgroundColor: `${color}14`,
          borderColor: `${color}38`,
          paddingHorizontal: isSmall ? 6 : isLarge ? 10 : 8,
          paddingVertical: isSmall ? 2.5 : isLarge ? 4.5 : 3.5,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: isSmall ? 10.5 : isLarge ? FONT_SIZE.sm : FONT_SIZE.xs,
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
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 1,
    marginRight: 5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
