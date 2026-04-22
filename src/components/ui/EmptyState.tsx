import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, radius } from '../../theme/tokens';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: EmptyStateSize;
  style?: ViewStyle;
}

const SIZES = {
  sm: {
    iconBox: 48,
    iconSize: 24,
    titleSize: 16,
    subtitleSize: 13,
    paddingVertical: spacing('8'),
  },
  md: {
    iconBox: 68,
    iconSize: 32,
    titleSize: 18,
    subtitleSize: 14,
    paddingVertical: spacing('12'),
  },
  lg: {
    iconBox: 80,
    iconSize: 40,
    titleSize: 20,
    subtitleSize: 15,
    paddingVertical: spacing('10'),
  },
};

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  size = 'md',
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const dimensions = SIZES[size];

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: dimensions.paddingVertical,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            width: dimensions.iconBox,
            height: dimensions.iconBox,
            borderRadius: radius('full'),
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={dimensions.iconSize}
          color={colors.textMuted}
        />
      </View>
      <Text
        style={[
          styles.title,
          {
            fontSize: dimensions.titleSize,
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              fontSize: dimensions.subtitleSize,
              color: colors.textMuted,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.75}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingHorizontal: spacing('6'),
    },
    iconBox: {
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing('4'),
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      marginBottom: spacing('2'),
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      textAlign: 'center',
      maxWidth: 280,
      lineHeight: 20,
    },
    actionButton: {
      marginTop: spacing('4'),
      paddingVertical: spacing('2'),
      paddingHorizontal: spacing('4'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 13,
    },
  });

export default EmptyState;
