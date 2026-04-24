import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Card, Typography, MoneyText, SectionLabel, TransactionRow, EmptyState, IconButton, Divider } from '../../../components/ui';
import { useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { ThemeColors } from '../../../theme/colors';
import { radius, spacing, LAYOUT } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { usePersonById, usePersonSummary } from '../api/people';
import { useTransactions } from '../../transactions/hooks/transactions';
import { useLoans } from '../../loans/api/loans';
import { fromDbColor } from '../../../utils/format';

export const PersonDetailsScreen = React.memo(function PersonDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = parseInt(id, 10);
  const { colors } = useTheme();
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: person, isLoading: loadingPerson } = usePersonById(personId);
  const { data: summary, isLoading: loadingSummary } = usePersonSummary(personId);
  const { data: transactions, isLoading: loadingTransactions } = useTransactions(50, { personId });
  const { data: loans } = useLoans(personId);

  const handleEdit = useCallback(() => {
    router.push(`/people/edit/${personId}`);
  }, [router, personId]);

  const renderHeader = useMemo(() => {
    if (!person || !summary) return null;
    return (
      <View style={styles.headerContent}>
        <Card variant="outlined" size="lg" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={[styles.avatar, { backgroundColor: fromDbColor(person.color) + '20' }]}>
              <Ionicons name={(person.icon as any) || 'person'} size={32} color={fromDbColor(person.color)} />
            </View>
            <View style={styles.heroInfo}>
              <Typography variant="h2">{person.name}</Typography>
              {person.phone && (
                <Typography variant="bodySm" color={colors.textMuted}>{person.phone}</Typography>
              )}
              {person.email && (
                <Typography variant="bodySm" color={colors.textMuted}>{person.email}</Typography>
              )}
            </View>
            <IconButton
              icon="create-outline"
              onPress={handleEdit}
              variant="ghost"
              size="md"
            />
          </View>

          <Divider style={{ marginVertical: spacing('4') }} />

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Typography variant="bodySm" color={colors.textMuted}>Lent</Typography>
              <MoneyText 
                amount={summary.remainingLent} 
                currency={profile.defaultCurrency} 
                style={[styles.statAmount, { color: colors.success }]}
              />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Typography variant="bodySm" color={colors.textMuted}>Borrowed</Typography>
              <MoneyText 
                amount={summary.remainingBorrowed} 
                currency={profile.defaultCurrency} 
                style={[styles.statAmount, { color: colors.danger }]}
              />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Typography variant="bodySm" color={colors.textMuted}>Net</Typography>
              <MoneyText 
                amount={summary.netPosition} 
                currency={profile.defaultCurrency} 
                style={styles.statAmount}
              />
            </View>
          </View>
        </Card>

        {loans && loans.length > 0 && (
          <View style={styles.section}>
            <SectionLabel text="Active Loans" />
            {loans.map(loan => (
              <Card key={loan.id} variant="outlined" size="sm" style={styles.loanItem}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => router.push(`/loans/details/${loan.id}`)}
                  style={styles.loanContent}
                >
                  <View style={[styles.loanIcon, { backgroundColor: fromDbColor(loan.color) + '20' }]}>
                    <Ionicons name={(loan.icon as any) || 'cash'} size={16} color={fromDbColor(loan.color)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="semibold">{loan.name}</Typography>
                    <Typography variant="bodySm" color={colors.textMuted}>{loan.type}</Typography>
                  </View>
                  <MoneyText 
                    amount={loan.remainingAmount} 
                    currency={loan.account?.currency || profile.defaultCurrency} 
                    weight="bold"
                  />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <SectionLabel text="Recent Transactions" />
        </View>
      </View>
    );
  }, [person, summary, loans, colors, profile, styles, handleEdit, router]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TransactionRow 
      tx={item} 
      colors={colors} 
      onPress={(tx) => router.push(`/transactions/edit/${tx.id}`)}
    />
  ), [colors, router]);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  if (loadingPerson || loadingSummary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!person || !summary) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Person not found" showBack />
        <EmptyState 
          title="Not Found" 
          subtitle="This person could not be found." 
          icon="alert-circle-outline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Contact Details" showBack />
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
              subtitle="No transactions linked to this person."
              icon="receipt-outline"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing('10'),
  },
  headerContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: spacing('4'),
    gap: spacing('6'),
    marginBottom: spacing('4'),
  },
  heroCard: {
    padding: spacing('5'),
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('4'),
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius('full'),
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
    gap: spacing('2'),
  },
  statBox: {
    flex: 1,
    gap: spacing('1'),
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  statAmount: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
  section: {
    gap: spacing('3'),
  },
  loanItem: {
    marginBottom: spacing('2'),
  },
  loanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('3'),
  },
  loanIcon: {
    width: 32,
    height: 32,
    borderRadius: radius('md'),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
