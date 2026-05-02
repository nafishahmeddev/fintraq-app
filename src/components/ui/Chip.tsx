import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

export type ChipVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;
  size?: ChipSize;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Chip = React.memo(function Chip({
  label,
  selected = false,
  onPress,
  variant = 'default',
  size = 'md',
  icon,
  disabled = false,
  style,
}: ChipProps) {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const dimensions = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          height: 32,
          paddingHorizontal: 12,
          fontSize: 12,
          iconSize: 14,
        };
      case 'lg':
        return {
          height: 44,
          paddingHorizontal: 20,
          fontSize: 16,
          iconSize: 18,
        };
      case 'md':
      default:
        return {
          height: 38,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 16,
        };
    }
  }, [size]);

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.surface;
    if (!selected) return theme.colors.card;

    switch (variant) {
      case 'primary': return theme.colors.primary;
      case 'success': return theme.colors.success;
      case 'danger': return theme.colors.danger;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textMuted;
    if (!selected) return theme.colors.text;
    switch (variant) {
      case 'primary':
      default:
        return theme.colors.onPrimary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return theme.colors.border;
    if (selected) return getBackgroundColor();
    return theme.colors.border;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.75}
      style={[
        styles.container,
        {
          height: dimensions.height,
          paddingHorizontal: dimensions.paddingHorizontal,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={dimensions.iconSize}
          color={getTextColor()}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            fontSize: dimensions.fontSize,
            color: getTextColor(),
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.full,
      borderWidth: 1,
      gap: 6,
    },
    icon: {
      marginLeft: -2,
    },
    label: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      letterSpacing: -0.2,
    },
  });

export default Chip;
