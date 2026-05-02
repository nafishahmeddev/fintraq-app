import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';

type SectionHeaderProps = {
  title: string;
  rightText?: string;
  onPressRight?: () => void;
};

export function SectionHeader({ title, rightText, onPressRight }: SectionHeaderProps) {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {rightText ? (
        onPressRight ? (
          <TouchableOpacity onPress={onPressRight} activeOpacity={0.7}>
            <Text style={styles.right}>{rightText}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.right}>{rightText}</Text>
        )
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.layout.screenPadding,
      marginBottom: theme.spacing[12],
    },
    title: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      color: theme.colors.textMuted,
      fontSize: 10,
      letterSpacing: 1.5,
    },
    right: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      color: theme.colors.primaryDark,
      fontSize: theme.fontSizes.sm,
    },
  });
