import { useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, LAYOUT } from '../../theme/tokens';
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
 * - Back button: 36x36 pill-shaped (same as all action buttons)
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <IconButton
            icon="arrow-back"
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: spacing('3'),
    paddingBottom: spacing('4'),
    backgroundColor: 'transparent',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('4'),
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    color: colors.text,
    fontSize: 28,
    letterSpacing: -1,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.1,
    marginTop: spacing('0.5'),
  },
  rightActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2'),
  },
});
