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
              activeOpacity={0.85}
            >
              <View style={styles.topRow}>
                <View style={[styles.iconBox, { backgroundColor: c + '18' }]}>
                  <Ionicons name={resolveIcon(acc.icon, 'wallet-outline')} size={18} color={c} />
                </View>
                <View style={styles.meta}>
                  <Text style={styles.name} numberOfLines={1}>{acc.name}</Text>
                  <Text style={[styles.currencyTag, { color: c }]}>{acc.currency}</Text>
                </View>
              </View>

              <View style={styles.balanceBlock}>
                <MoneyText
                  amount={acc.balance}
                  currency={acc.currency}
                  style={styles.balance}
                  weight="sansBold"
                />
                <Text style={styles.balanceLabel}>Available balance</Text>
              </View>

              <View style={[styles.accentBar, { backgroundColor: c }]} />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.addCard}
          onPress={onNewAccount}
          activeOpacity={0.85}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={22} color={colors.text} />
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
    gap: theme.spacing[12],
  },
  card: {
    width: screenWidth * 0.62,
    padding: theme.spacing[20],
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing[16],
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  currencyTag: {
    fontFamily: theme.fontFamilies.monoBold,
    fontSize: 10,
  },
  balanceBlock: {
    gap: 2,
  },
  balance: {
    fontSize: 22,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  balanceLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: theme.radius['3xl'],
    borderBottomLeftRadius: theme.radius['3xl'],
  },
  addCard: {
    width: screenWidth * 0.42,
    borderRadius: theme.radius['3xl'],
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing[8],
    padding: theme.spacing[24],
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addTitle: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
