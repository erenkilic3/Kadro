import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  buttonText?: string;
  onPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'football-outline',
  title,
  description,
  buttonText,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceLight }]}>
        <Ionicons name={icon} size={28} color={colors.textTertiary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

      {buttonText && onPress && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 270,
  },
  actionBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
