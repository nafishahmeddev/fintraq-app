import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { IconButton } from './IconButton';

export type HeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
};

/**
 * Header - Editorial Brutalist Design
 * 
 * Consistent header with:
 * - Back button: 36x36 pill-shaped (IconButton md)
 * - Title and optional subtitle
 * - Right action slot for custom buttons
 */
export const Header = React.memo(function Header({
  title,
  subtitle,
  showBack,
  rightAction
}: HeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <IconButton
            icon="chevron-back"
            onPress={handleBack}
            size="md"
            variant="default"
          />
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightAction && (
        <View style={styles.rightActionWrap}>
          {rightAction}
        </View>
      )}
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[12],
    paddingBottom: theme.spacing[16],
    backgroundColor: 'transparent',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[16],
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fontFamilies.sansBold,
    color: theme.colors.text,
    fontSize: 28,
    letterSpacing: -1,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  rightActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
});
