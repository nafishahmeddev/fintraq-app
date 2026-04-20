import { Header } from '@/src/components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthlyPanel } from '@/src/features/stats/components/MonthlyPanel';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { useTheme } from '@/src/providers/ThemeProvider';
import { DEFAULT_CURRENCY } from '@/src/constants/currency';
import { spacing, radius, LAYOUT } from '@/src/theme/tokens';
import { TYPOGRAPHY } from '@/src/theme/typography';

export default function MonthlyReportPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: accounts } = useAccounts();

  const currencyKeys = useMemo(() => {
    const keys = Array.from(new Set((accounts ?? []).map((a) => a.currency)));
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [accounts]);

  const [selectedCurrency, setSelectedCurrency] = useState(currencyKeys[0]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Monthly Report" subtitle="Full month audit" showBack />

      {/* Global Currency Picker */}
      {currencyKeys.length > 1 && (
        <View style={styles.currencyPickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyTabsRow}>
            {currencyKeys.map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[styles.currencyTab, currency === selectedCurrency && styles.currencyTabActive]}
                onPress={() => setSelectedCurrency(currency)}
                activeOpacity={0.85}
              >
                <Text style={[styles.currencyTabText, currency === selectedCurrency && styles.currencyTabTextActive]}>
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthlyPanel currency={selectedCurrency} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    currencyPickerContainer: {
      marginHorizontal: LAYOUT.screenPadding,
      marginBottom: spacing('3'),
    },
    currencyTabsRow: {
      flexDirection: 'row',
      gap: spacing('1'),
    },
    currencyTab: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.card,
    },
    currencyTabActive: {
      backgroundColor: colors.text,
    },
    currencyTabText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.textMuted,
    },
    currencyTabTextActive: {
      color: colors.background,
    },
    content: {
      paddingBottom: spacing('10'),
    },
  });
