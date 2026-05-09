import React, { useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

type CardSize = 'sm' | 'md' | 'lg';
type CardVariant = 'default' | 'filled' | 'outlined';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  size?: CardSize;
  variant?: CardVariant;
  shadow?: keyof Theme['shadow'];
  pressable?: boolean;
  onPress?: () => void;
};

export const Card = React.memo(function Card({
  children,
  style,
  size = 'md',
  variant = 'default',
  shadow: shadowToken,
  pressable = false,
  onPress,
}: CardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return { padding: theme.spacing[16], borderRadius: theme.radius['3xl'] };
      case 'lg':
        return { padding: theme.spacing[24], borderRadius: theme.radius['3xl'] };
      case 'md':
      default:
        return { padding: theme.spacing[20], borderRadius: theme.radius['3xl'] };
    }
  }, [size, theme.spacing, theme.radius]);

  const backgroundStyle = useMemo(() => {
    switch (variant) {
      case 'filled':
        return { backgroundColor: colors.surface };
      case 'outlined':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'default':
      default:
        return { backgroundColor: colors.surface };
    }
  }, [variant, colors.surface, colors.border]);

  const shadowStyle = useMemo(() => {
    if (shadowToken) return theme.shadow[shadowToken];
    return theme.shadow.none;
  }, [shadowToken, theme.shadow]);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const combinedStyle = [styles.card, sizeStyles, backgroundStyle, shadowStyle, style];

  if (pressable || onPress) {
    return (
      <TouchableOpacity
        style={combinedStyle}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={combinedStyle}>
      {children}
    </View>
  );
});

const createStyles = (_theme: Theme) => StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
