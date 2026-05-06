import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MoneyText } from '../../../components/ui/MoneyText';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { resolveIcon } from '../../../utils/icons';
import type { Account } from '../../accounts/api/accounts';
import { SectionHeader } from '../components/SectionHeader';

interface AccountsCarouselProps {
  accounts: Account[];
  onAccountPress: (accountId: number) => void;
  onAccountLongPress: (account: Account) => void;
  onNewAccount: () => void;
}

export const AccountsCarousel = React.memo(function AccountsCarousel({
  accounts,
  onAccountPress,
  onAccountLongPress,
  onNewAccount,
}: AccountsCarouselProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, screenWidth), [theme, screenWidth]);

  return (
    <>
      <SectionHeader
        title="Accounts"
        rightText="New"
        onPressRight={onNewAccount}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {accounts?.map(acc => {
          const c = '#' + acc.color.toString(16).padStart(6, '0');
          return (
            <TouchableOpacity
              key={acc.id}
              style={styles.card}
              onPress={() => onAccountPress(acc.id)}
              onLongPress={() => onAccountLongPress(acc)}
              delayLongPress={250}
              activeOpacity={0.88}
            >
              <View style={styles.topRow}>
                <View style={[styles.iconBox, { backgroundColor: c + '18' }]}>
                  <Ionicons name={resolveIcon(acc.icon, 'wallet-outline')} size={16} color={c} />
                </View>
                <View style={styles.meta}>
                  <Text style={styles.name} numberOfLines={1}>{acc.name}</Text>
                  <View style={[styles.currencyBadge, { borderColor: c }]}>
                    <Text style={[styles.currencyText, { color: c }]}>{acc.currency}</Text>
                  </View>
                </View>
              </View>

              <MoneyText
                amount={acc.balance}
                currency={acc.currency}
                style={styles.balance}
                weight="sansBold"
              />
              <Text style={styles.balanceLabel}>Available</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.addCard}
          onPress={onNewAccount}
          activeOpacity={0.88}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={24} color={colors.text} />
          </View>
          <Text style={styles.addTitle}>New account</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
});

const createStyles = (theme: Theme, screenWidth: number) => StyleSheet.create({
  scroll: {
    marginBottom: theme.spacing[24],
  },
  scrollContent: {
    paddingHorizontal: theme.layout.screenPadding,
    gap: theme.spacing[8],
  },
  card: {
    width: screenWidth * 0.6,
    padding: theme.spacing[16],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderLeftWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing[12],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  currencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  currencyText: {
    fontFamily: theme.fontFamilies.monoBold,
    fontSize: 9,
  },
  balance: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  balanceLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: -4,
  },
  addCard: {
    width: screenWidth * 0.6,
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[24],
    gap: theme.spacing[8],
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addTitle: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
});
