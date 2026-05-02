import { SearchScreen } from '@/src/features/search/screens/SearchScreen';
import { usePremium } from '@/src/providers/PremiumProvider';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SEARCH_FEATURES = [
  { icon: 'receipt-outline' as const, label: 'Full-text search across all transactions' },
  { icon: 'wallet-outline' as const, label: 'Find accounts by name instantly' },
  { icon: 'pricetag-outline' as const, label: 'Locate categories across your history' },
];

function SearchGate() {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="search" size={32} color={colors.text} />
          <View style={styles.proBadge}>
            <Ionicons name="sparkles" size={10} color={colors.background} />
            <Text style={[styles.proBadgeText, { color: colors.background }]}>PRO</Text>
          </View>
        </View>

        <Text style={styles.title}>Global search</Text>
        <Text style={styles.subtitle}>
          Find anything across your entire financial history in one place.
        </Text>

        <View style={styles.featureList}>
          {SEARCH_FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name={f.icon} size={15} color={colors.text} />
              </View>
              <Text style={[styles.featureLabel, { color: colors.textMuted }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: colors.text }]}
          onPress={() => router.push('/premium')}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={16} color={colors.background} />
          <Text style={[styles.ctaBtnText, { color: colors.background }]}>Upgrade to Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6} style={styles.dismissBtn}>
          <Text style={[styles.dismissText, { color: colors.textMuted }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function SearchRoute() {
  const { isPremium } = usePremium();
  return isPremium ? <SearchScreen /> : <SearchGate />;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      margin: 16,
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingBottom: 80,
      gap: 16,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: theme.radius['2xl'],
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    proBadge: {
      position: 'absolute',
      bottom: -6,
      right: -6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      height: 20,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.text,
    },
    proBadgeText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 9,
      letterSpacing: 1,
    },
    title: {
      fontFamily: theme.fontFamilies.heading,
      fontSize: 32,
      color: theme.colors.text,
      letterSpacing: -1,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 15,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 260,
    },
    featureList: {
      width: '100%',
      gap: 8,
      marginVertical: 8,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    featureIcon: {
      width: 34,
      height: 34,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureLabel: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 14,
      flex: 1,
    },
    ctaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      height: 52,
      borderRadius: theme.radius.lg,
      marginTop: 8,
    },
    ctaBtnText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 15,
    },
    dismissBtn: {
      paddingVertical: 8,
    },
    dismissText: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 13,
    },
  });
