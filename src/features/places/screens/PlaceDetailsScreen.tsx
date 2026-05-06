import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Card, Typography, MoneyText, SectionLabel, TransactionRow, EmptyState, IconButton, Divider } from '../../../components/ui';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { usePlaceById, usePlaceSummary } from '../api/places';
import { useTransactions } from '../../transactions/hooks/transactions';
import { fromDbColor } from '../../../utils/format';

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

  const handleEdit = useCallback(() => {
    router.push(`/places/edit/${placeId}`);
  }, [router, placeId]);

  const renderHeader = useMemo(() => {
    if (!place || !summary) return null;
    return (
      <View style={styles.headerContent}>
        <Card variant="outlined" size="lg" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={[styles.avatar, { backgroundColor: fromDbColor(place.color) + '20' }]}>
              <Ionicons name={(place.icon as any) || 'location'} size={32} color={fromDbColor(place.color)} />
            </View>
            <View style={styles.heroInfo}>
              <Typography variant="h2">{place.name}</Typography>
              {place.description && (
                <Typography variant="bodySm" color={colors.textMuted}>{place.description}</Typography>
              )}
            </View>
            <IconButton
              icon="create-outline"
              onPress={handleEdit}
              variant="ghost"
              size="md"
            />
          </View>

          <Divider style={{ marginVertical: 16 }} />

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Typography variant="bodySm" color={colors.textMuted}>Total spent</Typography>
              <MoneyText 
                amount={summary.totalSpent} 
                currency={profile.defaultCurrency} 
                style={[styles.statAmount, { color: colors.danger }]}
              />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Typography variant="bodySm" color={colors.textMuted}>Entries</Typography>
              <Typography variant="h3" weight="sansBold">
                {summary.transactionCount}
              </Typography>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <SectionLabel text="Recent transactions" />
        </View>
      </View>
    );
  }, [place, summary, colors, profile, styles, handleEdit]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TransactionRow 
      tx={item} 
      onPress={(tx) => router.push(`/transactions/edit/${tx.id}`)}
    />
  ), [theme, router]);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  if (loadingPlace || loadingSummary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Place not found" showBack />
        <EmptyState 
          title="Not found" 
          
          icon="alert-circle-outline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Place details" showBack />
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
            <EmptyState
              title="No transactions"
             
              icon="receipt-outline"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
    marginBottom: 16,
  },
  heroCard: {
    padding: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
  },
  statAmount: {
    fontSize: 16,
    fontFamily: theme.fontFamilies.sansBold,
  },
  section: {
    gap: 12,
  },
});
