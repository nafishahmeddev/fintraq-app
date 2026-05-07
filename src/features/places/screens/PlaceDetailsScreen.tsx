import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { fromDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { TransactionListItem } from '../../transactions/api/transactions';
import { useTransactions } from '../../transactions/hooks/transactions';
import { usePlaceById, usePlaceSummary } from '../api/places';

// ─── Local transaction row ────────────────────────────────────────────────────
const TxRow = React.memo(function TxRow({
  tx,
  onPress,
}: {
  tx: TransactionListItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createTxRowStyles(theme), [theme]);

  const isTransfer = tx.type === 'TRANSFER';
  const catColor = isTransfer
    ? colors.primary
    : tx.category
    ? fromDbColor(tx.category.color)
    : colors.textMuted;
  const iconName = isTransfer
    ? ('swap-horizontal-outline' as const)
    : resolveIcon(tx.category?.icon, 'pricetag-outline');
  const label = isTransfer
    ? (tx.toAccount?.name ?? 'Transfer')
    : (tx.category?.name ?? 'Transaction');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconBox, { backgroundColor: catColor + '20' }]}>
        <Ionicons name={iconName} size={20} color={catColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.note} numberOfLines={1}>{tx.note || label}</Text>
        <Text style={styles.meta} numberOfLines={1}>{label} · {tx.account.name}</Text>
      </View>
      <View style={styles.right}>
        <MoneyText
          amount={tx.amount}
          currency={tx.account.currency}
          type={tx.type}
          weight="sansBold"
          style={styles.amount}
        />
        <Text style={styles.time}>{format(new Date(tx.datetime), 'HH:mm')}</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Screen ──────────────────────────────────────────────────────────────────
export const PlaceDetailsScreen = React.memo(function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = parseInt(id, 10);
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: place, isLoading: loadingPlace } = usePlaceById(placeId);
  const { data: summary, isLoading: loadingSummary } = usePlaceSummary(placeId);
  const { data: transactions, isLoading: loadingTransactions } = useTransactions(50, { placeId });

  const handleTxPress = useCallback((txId: number) => {
    router.push(`/transactions/edit/${txId}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: TransactionListItem }) => (
    <TxRow tx={item} onPress={() => handleTxPress(item.id)} />
  ), [handleTxPress]);

  const keyExtractor = useCallback((item: TransactionListItem) => item.id.toString(), []);

  const renderHeader = useMemo(() => {
    if (!place || !summary) return null;
    const placeColor = fromDbColor(place.color);
    return (
      <View style={styles.headerContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={[styles.avatar, { backgroundColor: placeColor + '20' }]}>
              <Ionicons name={resolveIcon(place.icon, 'location-outline')} size={32} color={placeColor} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{place.name}</Text>
              {place.description && <Text style={styles.heroMeta}>{place.description}</Text>}
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/places/edit/${placeId}`)}
              activeOpacity={0.75}
            >
              <Ionicons name="create-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.sep} />

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total spent</Text>
              <MoneyText
                amount={summary.totalSpent}
                currency={profile.defaultCurrency}
                style={[styles.statAmount, { color: colors.danger }]}
              />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Entries</Text>
              <Text style={styles.statCount}>{summary.transactionCount}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Transactions</Text>
      </View>
    );
  }, [place, summary, colors, profile, styles, router, placeId]);

  if (loadingPlace || loadingSummary) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Place not found" showBack />
        <EmptyState title="Not found" icon="alert-circle-outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={place.name} showBack />
      <FlatList
        data={transactions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          !loadingTransactions ? (
            <EmptyState title="No transactions" icon="receipt-outline" />
          ) : null
        }
      />
    </SafeAreaView>
  );
});

const createTxRowStyles = (theme: Theme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[16],
    gap: theme.spacing[12],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: theme.spacing[2],
  },
  note: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  meta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    gap: theme.spacing[4],
  },
  amount: {
    fontSize: theme.fontSizes.sm,
  },
  time: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[16],
    paddingBottom: 40,
    gap: theme.spacing[8],
  },
  headerContent: {
    gap: theme.spacing[16],
    marginBottom: theme.spacing[8],
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    padding: theme.spacing[20],
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[16],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  heroMeta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  sep: {
    height: 1,
    backgroundColor: theme.colors.overlay,
    marginVertical: theme.spacing[16],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  statBox: {
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.overlay,
    alignSelf: 'stretch',
  },
  statLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  statAmount: {
    fontSize: 18,
  },
  statCount: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 22,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    paddingLeft: 4,
  },
});
