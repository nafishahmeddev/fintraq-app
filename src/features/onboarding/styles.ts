import { Platform, StyleSheet } from 'react-native';
import { Theme } from '../../providers/ThemeProvider';

export const createOnboardingStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    },
    keyboardWrap: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.layout.screenPadding,
      paddingTop: theme.spacing[12],
      gap: theme.spacing[12],
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerBackButton: {
      width: theme.layout.touchTarget,
      height: theme.layout.touchTarget,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    headerBackPlaceholder: {
      width: theme.layout.touchTarget,
      height: theme.layout.touchTarget,
    },
    brand: {
      fontFamily: theme.fontFamilies.heading,
      fontSize: theme.fontSizes['3xl'],
      color: theme.colors.text,
      letterSpacing: theme.letterSpacing.tight,
      textAlign: 'center',
    },
    stepPill: {
      minWidth: theme.layout.touchTarget,
      height: theme.layout.touchTarget,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing[12],
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    stepPillText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.text,
      letterSpacing: theme.letterSpacing.wide,
    },
    progressTrack: {
      flexDirection: 'row',
      gap: theme.spacing[8],
    },
    progressDot: {
      flex: 1,
      height: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
    },
    progressDotActive: {
      backgroundColor: theme.colors.primary,
    },
    scrollContent: {
      paddingHorizontal: theme.layout.screenPadding,
      paddingTop: theme.spacing[20],
      paddingBottom: theme.spacing[24],
      flexGrow: 1,
    },
    stepMeta: {
      marginBottom: theme.spacing[20],
    },
    eyebrow: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.primary,
      letterSpacing: 2,
      marginBottom: theme.spacing[12],
    },
    stepTitle: {
      fontFamily: theme.fontFamilies.heading,
      fontSize: theme.fontSizes['4xl'],
      lineHeight: theme.fontSizes['4xl'] + 2,
      color: theme.colors.text,
      letterSpacing: theme.letterSpacing.tight,
    },
    stepSubtitle: {
      marginTop: theme.spacing[8],
      fontFamily: theme.fontFamilies.sans,
      fontSize: theme.fontSizes.sm,
      lineHeight: 22,
      color: theme.colors.textMuted,
      maxWidth: 320,
    },
    contentCard: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      minHeight: 400,
    },
    footer: {
      paddingHorizontal: theme.layout.screenPadding,
      paddingBottom: Platform.OS === 'ios' ? theme.spacing[24] : theme.spacing[32],
      paddingTop: theme.spacing[8],
    },
    primaryAction: {
      width: '100%',
    },
  });
