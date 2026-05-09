import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { Button } from './Button';

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

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  size = 'md',
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { fontSizes } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dimensions = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          iconBox: 48,
          iconSize: 24,
          titleSize: fontSizes.md,
          subtitleSize: fontSizes.sm,
          paddingVertical: theme.spacing[32],
        };
      case 'lg':
        return {
          iconBox: 80,
          iconSize: 40,
          titleSize: fontSizes.xl,
          subtitleSize: fontSizes.md,
          paddingVertical: theme.spacing[40],
        };
      case 'md':
      default:
        return {
          iconBox: 68,
          iconSize: 32,
          titleSize: fontSizes.lg,
          subtitleSize: fontSizes.sm,
          paddingVertical: theme.spacing[48],
        };
    }
  }, [size, fontSizes, theme.spacing]);

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
            borderRadius: theme.radius.full,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={dimensions.iconSize}
          color={theme.colors.primary}
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
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.actionButton}
        />
      )}
    </View>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingHorizontal: theme.layout.screenPadding,
    },
    iconBox: {
      backgroundColor: theme.colors.primary + '1A',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing[16],
    },
    title: {
      fontFamily: theme.fontFamilies.sansBold,
      marginBottom: theme.spacing[8],
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    subtitle: {
      fontFamily: theme.fontFamilies.sans,
      textAlign: 'center',
      maxWidth: 280,
      lineHeight: 20,
    },
    actionButton: {
      marginTop: theme.spacing[24],
    },
  });

export default EmptyState;
