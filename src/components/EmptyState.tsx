import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, SPACING } from '../constants/theme';

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
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <Ionicons name={icon} size={36} color={colors.textTertiary} />
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
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
});


