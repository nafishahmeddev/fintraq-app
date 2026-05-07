import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

export type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  badge?: boolean;
};

const SIZES = {
  sm: { container: 32, icon: 16 },
  md: { container: 36, icon: 18 },
  lg: { container: 44, icon: 20 },
};

export const IconButton = React.memo(function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'default',
  disabled = false,
  style,
  badge = false,
}: IconButtonProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const dimensions = SIZES[size];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.text;
      case 'ghost':
        return 'transparent';
      default:
        return colors.overlay;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return colors.background;
      case 'ghost':
        return colors.text;
      default:
        return colors.text;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'ghost' ? 'transparent' : colors.border,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={dimensions.icon} color={getIconColor()} />
      {badge && <View style={styles.badge} />}
    </TouchableOpacity>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    badge: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 6,
      height: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
    },
  });
