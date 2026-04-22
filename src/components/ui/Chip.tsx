import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, radius } from '../../theme/tokens';

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

const SIZES = {
  sm: {
    height: 30,
    paddingHorizontal: spacing('3'),
    fontSize: 12,
    iconSize: 14,
  },
  md: {
    height: 36,
    paddingHorizontal: spacing('4'),
    fontSize: 13,
    iconSize: 16,
  },
  lg: {
    height: 44,
    paddingHorizontal: spacing('5'),
    fontSize: 14,
    iconSize: 18,
  },
};

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
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const dimensions = SIZES[size];

  const getBackgroundColor = () => {
    if (disabled) return colors.surface;
    if (!selected) return colors.surface;
    
    switch (variant) {
      case 'primary': return colors.primary;
      case 'success': return colors.success;
      case 'danger': return colors.danger;
      case 'warning': return colors.warning;
      default: return colors.text;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (!selected) return colors.text;
    return colors.background;
  };

  const getBorderColor = () => {
    if (disabled) return colors.border;
    if (selected) return getBackgroundColor();
    return colors.border;
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius('full'),
      borderWidth: 1,
      gap: spacing('2'),
    },
    icon: {
      marginLeft: -spacing('1'),
    },
    label: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      letterSpacing: 0.3,
    },
  });

export default Chip;
