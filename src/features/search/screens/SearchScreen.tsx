import { Header } from '@/src/components/ui/Header';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { TransactionRow } from '@/src/components/ui/TransactionRow';
import type { Account } from '@/src/features/accounts/api/accounts';
import type { Category } from '@/src/features/categories/api/categories';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearch } from '../hooks/useGlobalSearch';

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

type SearchItem =
  | { kind: 'transaction'; data: TransactionListItem }
  | { kind: 'account'; data: Account }
  | { kind: 'category'; data: Category };

type SearchSection = {
  title: string;
  count: number;
  data: SearchItem[];
};

// ─── AccountRow ──────────────────────────────────────────────────────────────

const AccountRow = React.memo(function AccountRow({
  account,
  onPress,
  isFirst,
  isLast,
}: {
  account: Account;
  onPress: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const accentColor = useMemo(() => toHexColor(account.color), [account.color]);
  const handlePress = useCallback(() => onPress(account.id), [onPress, account.id]);
  const styles = useMemo(() => accountRowStyles(theme), [theme]);

  const containerStyle = useMemo(() => ({
    backgroundColor: colors.card,
    borderTopLeftRadius: isFirst ? theme.radius['3xl'] : 0,
    borderTopRightRadius: isFirst ? theme.radius['3xl'] : 0,
    borderBottomLeftRadius: isLast ? theme.radius['3xl'] : 0,
    borderBottomRightRadius: isLast ? theme.radius['3xl'] : 0,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.border,
  }), [isFirst, isLast, colors, theme]);

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: accentColor + '20' }]}>
        <Ionicons name={resolveIcon(account.icon, 'wallet-outline')} size={18} color={accentColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{account.name}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {account.currency} · {account.accountNumber && account.accountNumber !== 'N/A'
            ? `•••• ${account.accountNumber.slice(-4)}`
            : 'Account'}
        </Text>
      </View>
      <MoneyText
        amount={account.balance}
        currency={account.currency}
        weight="sansBold"
        style={styles.balance}
      />
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

const accountRowStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 14,
  },
  meta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
  },
  balance: {
    fontSize: 14,
  },
});

// ─── CategoryRow ─────────────────────────────────────────────────────────────

const CategoryRow = React.memo(function CategoryRow({
  category,
  onPress,
  isFirst,
  isLast,
}: {
  category: Category;
  onPress: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const catColor = useMemo(() => toHexColor(category.color), [category.color]);
  const handlePress = useCallback(() => onPress(category.id), [onPress, category.id]);
  const styles = useMemo(() => categoryRowStyles(theme), [theme]);

  const containerStyle = useMemo(() => ({
    backgroundColor: colors.card,
    borderTopLeftRadius: isFirst ? theme.radius['3xl'] : 0,
    borderTopRightRadius: isFirst ? theme.radius['3xl'] : 0,
    borderBottomLeftRadius: isLast ? theme.radius['3xl'] : 0,
    borderBottomRightRadius: isLast ? theme.radius['3xl'] : 0,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.border,
  }), [isFirst, isLast, colors, theme]);

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: catColor + '20' }]}>
        <Ionicons name={resolveIcon(category.icon, 'pricetag-outline')} size={18} color={catColor} />
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{category.name}</Text>
      <View style={[
        styles.typeBadge,
        { backgroundColor: (category.type === 'CR' ? colors.success : colors.danger) + '15' },
      ]}>
        <Text style={[
          styles.typeBadgeText,
          { color: category.type === 'CR' ? colors.success : colors.danger },
        ]}>
          {category.type === 'CR' ? 'Income' : 'Expense'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

const categoryRowStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 14,
  },
  typeBadge: {
    paddingHorizontal: 8,
    height: 22,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 11,
  },
});

// ─── SearchScreen ─────────────────────────────────────────────────────────────

export function SearchScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const { data, isFetching, isEnabled, debouncedQuery } = useGlobalSearch(query);

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const handleClear = useCallback(() => setQuery(''), []);

  const handleTransactionPress = useCallback((tx: { id: number }) => {
    router.push(`/transactions/edit/${tx.id}`);
  }, [router]);

  const handleAccountPress = useCallback((id: number) => {
    router.push(`/transactions?accountId=${id}`);
  }, [router]);

  const handleCategoryPress = useCallback((id: number) => {
    router.push(`/transactions?categoryId=${id}`);
  }, [router]);

  const sections = useMemo((): SearchSection[] => {
    if (!data) return [];
    const result: SearchSection[] = [];

    if (data.transactions.length > 0) {
      result.push({
        title: 'Transactions',
        count: data.transactions.length,
        data: data.transactions.map(item => ({ kind: 'transaction' as const, data: item })),
      });
    }
    if (data.accounts.length > 0) {
      result.push({
        title: 'Accounts',
        count: data.accounts.length,
        data: data.accounts.map(item => ({ kind: 'account' as const, data: item })),
      });
    }
    if (data.categories.length > 0) {
      result.push({
        title: 'Categories',
        count: data.categories.length,
        data: data.categories.map(item => ({ kind: 'category' as const, data: item })),
      });
    }
    return result;
  }, [data]);

  const hasResults = sections.length > 0;
  const noResults = isEnabled && !isFetching && debouncedQuery.length >= 2 && !hasResults;

  const renderItem = useCallback(
    ({ item, index, section }: SectionListRenderItemInfo<SearchItem, SearchSection>) => {
      const isFirst = index === 0;
      const isLast = index === section.data.length - 1;

      if (item.kind === 'transaction') {
        return (
          <TransactionRow
            tx={item.data}
            isFirst={isFirst}
            isLast={isLast}
            showDate
            onPress={handleTransactionPress}
          />
        );
      }
      if (item.kind === 'account') {
        return (
          <AccountRow
            account={item.data}
            onPress={handleAccountPress}
            isFirst={isFirst}
            isLast={isLast}
          />
        );
      }
      return (
        <CategoryRow
          category={item.data}
          onPress={handleCategoryPress}
          isFirst={isFirst}
          isLast={isLast}
        />
      );
    },
    [handleTransactionPress, handleAccountPress, handleCategoryPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<SearchItem, SearchSection> }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <Text style={styles.sectionHeaderCount}>{section.count}</Text>
      </View>
    ),
    [styles],
  );

  const renderSectionFooter = useCallback(() => <View style={{ height: 20 }} />, []);

  const keyExtractor = useCallback((item: SearchItem) => {
    if (item.kind === 'transaction') return `tx-${item.data.id}`;
    if (item.kind === 'account') return `acc-${item.data.id}`;
    return `cat-${item.data.id}`;
  }, []);

  return (
    <SafeAreaView style={styles.container}>


      {/* Header */}
      <Header
        title="Search"
        showBack
        rightAction={
          isFetching && isEnabled ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : undefined
        }
      />

      {/* Search input */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Transactions, accounts, categories..."
            placeholderTextColor={colors.textMuted + '80'}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results / States */}
      {!isEnabled ? (
        <View style={styles.promptWrap}>
          <View style={styles.promptIconBox}>
            <Ionicons name="search" size={28} color={colors.primary} />
          </View>
          <Text style={styles.promptTitle}>Find anything</Text>
          <Text style={styles.promptSubtitle}>
            Search across transactions, accounts{'\n'}and categories in one place.
          </Text>
        </View>
      ) : noResults ? (
        <View style={styles.promptWrap}>
          <View style={styles.promptIconBox}>
            <Ionicons name="file-tray-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.promptTitle}>No results</Text>
          <Text style={styles.promptSubtitle}>
            {`Nothing matched "${debouncedQuery}".\nTry a different term.`}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    // ─── Search input ───────────────────────────────────────────────────────
    searchRow: {
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.fontFamilies.sans,
      fontSize: 16,
      color: theme.colors.text,
      padding: 0,
    },

    // ─── Empty / prompt states ─────────────────────────────────────────────
    promptWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 80,
      gap: 12,
    },
    promptIconBox: {
      width: 72,
      height: 72,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary + '1A',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    promptTitle: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 18,
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    promptSubtitle: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },

    // ─── Results list ───────────────────────────────────────────────────────
    listContent: {
      paddingHorizontal: 24,
      paddingBottom: 60,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 4,
      marginBottom: 8,
    },
    sectionHeaderText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    sectionHeaderCount: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 10,
      color: theme.colors.textMuted,
    },
  });

