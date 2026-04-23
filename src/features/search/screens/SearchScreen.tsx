import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, SectionList, SectionListData, SectionListRenderItemInfo, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { Header } from '@/src/components/ui/Header';
import { TransactionRow } from '@/src/components/ui/TransactionRow';
import { useTheme } from '@/src/providers/ThemeProvider';
import { resolveIcon } from '@/src/utils/icons';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { Box, HStack, VStack, Pressable, Text, cn } from '@/src/components/ui';

// ─── AccountRow ──────────────────────────────────────────────────────────────

type AccountRowProps = {
  account: { id: number; name: string; type: string; balance: number; currency: string; icon: string; color: number };
  onPress: (id: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

const AccountRow = React.memo(function AccountRow({ account, onPress, isFirst, isLast }: AccountRowProps) {
  const accColor = toHexColor(account.color);
  return (
    <Pressable
      className={cn(
        "flex-row items-center py-3 px-4 space-x-3 bg-surface border-b border-border",
        isFirst && "rounded-t-2xl",
        isLast && "rounded-b-2xl border-b-0"
      )}
      onPress={() => onPress(account.id)}
    >
      <Box className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: accColor + '18' }}>
        <Ionicons name={resolveIcon(account.icon, 'wallet-outline')} size={18} color={accColor} />
      </Box>
      <VStack className="flex-1">
        <Text className="font-semibold text-sm text-text">{account.name}</Text>
        <Text className="font-regular text-xs text-text-muted mt-0.5">{account.type}</Text>
      </VStack>
      <Ionicons name="chevron-forward" size={14} color="#737a5f" />
    </Pressable>
  );
});

// ─── CategoryRow ─────────────────────────────────────────────────────────────

type CategoryRowProps = {
  category: { id: number; name: string; type: string; icon: string; color: number };
  onPress: (id: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
};

const CategoryRow = React.memo(function CategoryRow({ category, onPress, isFirst, isLast }: CategoryRowProps) {
  const catColor = toHexColor(category.color);
  return (
    <Pressable
      className={cn(
        "flex-row items-center py-3 px-4 space-x-3 bg-surface border-b border-border",
        isFirst && "rounded-t-2xl",
        isLast && "rounded-b-2xl border-b-0"
      )}
      onPress={() => onPress(category.id)}
    >
      <Box className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: catColor + '18' }}>
        <Ionicons name={resolveIcon(category.icon, 'pricetag-outline')} size={18} color={catColor} />
      </Box>
      <Text className="flex-1 font-semibold text-sm text-text">{category.name}</Text>
      <Box className={cn("px-2 h-[22px] rounded-sm items-center justify-center", category.type === 'CR' ? 'bg-success/10' : 'bg-danger/10')}>
        <Text className={cn("font-semibold text-[11px]", category.type === 'CR' ? 'text-success' : 'text-danger')}>
          {category.type === 'CR' ? 'Income' : 'Expense'}
        </Text>
      </Box>
      <Ionicons name="chevron-forward" size={14} color="#737a5f" />
    </Pressable>
  );
});

// ─── SearchScreen ─────────────────────────────────────────────────────────────

type SearchItem =
  | { kind: 'transaction'; data: any }
  | { kind: 'account'; data: any }
  | { kind: 'category'; data: any };

type SearchSection = {
  title: string;
  count: number;
  data: SearchItem[];
};

export function SearchScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
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
        title: 'TRANSACTIONS',
        count: data.transactions.length,
        data: data.transactions.map(item => ({ kind: 'transaction' as const, data: item })),
      });
    }
    if (data.accounts.length > 0) {
      result.push({
        title: 'ACCOUNTS',
        count: data.accounts.length,
        data: data.accounts.map(item => ({ kind: 'account' as const, data: item })),
      });
    }
    if (data.categories.length > 0) {
      result.push({
        title: 'CATEGORIES',
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
      <HStack className="items-center justify-between pl-1 mb-2">
        <Text className="font-semibold text-[9px] text-text-muted tracking-widest uppercase">{section.title}</Text>
        <Text className="font-semibold text-[10px] text-text-muted">{section.count}</Text>
      </HStack>
    ),
    [],
  );

  const renderSectionFooter = useCallback(() => <Box className="h-5" />, []);

  const keyExtractor = useCallback((item: SearchItem) => {
    if (item.kind === 'transaction') return `tx-${item.data.id}`;
    if (item.kind === 'account') return `acc-${item.data.id}`;
    return `cat-${item.data.id}`;
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BlurBackground />

      <Header
        title="Search"
        showBack
        rightAction={
          isFetching && isEnabled ? (
            <ActivityIndicator size="small" color={isDark ? '#B8D641' : '#a6c13a'} />
          ) : undefined
        }
      />

      <Box className="px-6 pb-4">
        <HStack className="items-center h-[52px] rounded-xl bg-surface border border-border px-4 space-x-2">
          <Ionicons name="search-outline" size={18} color={isDark ? '#b2bb8b' : '#737a5f'} />
          <TextInput
            ref={inputRef}
            className="flex-1 font-regular text-base text-text py-0"
            value={query}
            onChangeText={setQuery}
            placeholder="Transactions, accounts, categories..."
            placeholderTextColor={isDark ? '#b2bb8b80' : '#737a5f80'}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={isDark ? '#b2bb8b' : '#737a5f'} />
            </Pressable>
          )}
        </HStack>
      </Box>

      {!isEnabled ? (
        <VStack className="flex-1 items-center justify-center pb-20 space-y-3">
          <Box className="w-[68px] h-[68px] rounded-2xl bg-surface items-center justify-center mb-1 border border-border">
            <Ionicons name="search" size={28} color={isDark ? '#b2bb8b' : '#737a5f'} />
          </Box>
          <Text className="font-semibold text-lg text-text tracking-tight">Find anything</Text>
          <Text className="font-regular text-sm text-text-muted text-center leading-5">
            Search across transactions, accounts{'\n'}and categories in one place.
          </Text>
        </VStack>
      ) : noResults ? (
        <VStack className="flex-1 items-center justify-center pb-20 space-y-3">
          <Box className="w-[68px] h-[68px] rounded-2xl bg-surface items-center justify-center mb-1 border border-border">
            <Ionicons name="file-tray-outline" size={28} color={isDark ? '#b2bb8b' : '#737a5f'} />
          </Box>
          <Text className="font-semibold text-lg text-text tracking-tight">No results</Text>
          <Text className="font-regular text-sm text-text-muted text-center leading-5">
            {`Nothing matched "${debouncedQuery}".\nTry a different term.`}
          </Text>
        </VStack>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}
