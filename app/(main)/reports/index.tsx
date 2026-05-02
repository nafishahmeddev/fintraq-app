import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoneyText } from '../../../src/components/ui/MoneyText';
import { PremiumGuard } from '../../../src/components/ui/PremiumGuard';
import { MetricCard } from '../../../src/features/reports/components/MetricCard';
import { ReportHeader } from '../../../src/features/reports/components/ReportHeader';
import { StreakBadge } from '../../../src/features/reports/components/StreakBadge';
import { useWeeklyReport, useMonthlyReport } from '../../../src/features/reports/hooks/useReports';
import { useDashboardInsights } from '../../../src/features/dashboard/hooks/dashboard';
import { InsightCard } from '../../../src/features/dashboard/components/InsightCard';
import { useSettings } from '../../../src/providers/SettingsProvider';
import { Theme, useTheme } from '../../../src/providers/ThemeProvider';

type ReportPeriod = 'weekly' | 'monthly';

export default function UnifiedReport() {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [period, setPeriod] = useState<ReportPeriod>('weekly');

  const weeklyQuery = useWeeklyReport(profile.defaultCurrency);
  const monthlyQuery = useMonthlyReport(profile.defaultCurrency);
  const insightsQuery = useDashboardInsights(profile.defaultCurrency);

  const report = period === 'weekly' ? weeklyQuery.data : monthlyQuery.data;
  const isLoading = period === 'weekly' ? weeklyQuery.isLoading : monthlyQuery.isLoading;
  const insights = insightsQuery.data;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ReportHeader title="Report" subtitle="Unified performance audit" />

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, period === 'weekly' && styles.tabActive]} 
          onPress={() => setPeriod('weekly')}
        >
          <Text style={[styles.tabText, period === 'weekly' && styles.tabTextActive]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, period === 'monthly' && styles.tabActive]} 
          onPress={() => setPeriod('monthly')}
        >
          <Text style={[styles.tabText, period === 'monthly' && styles.tabTextActive]}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumGuard label="Unlock Unified Reports" size="large">
          
          {/* ── Persistence Section ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR ACTIVITY</Text>
            <View style={styles.streakCard}>
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>Persistence</Text>
                <Text style={styles.streakSubtitle}>
                  Small daily adjustments lead to massive long-term freedom.
                </Text>
                <View style={{ marginTop: 16 }}>
                  <StreakBadge />
                </View>
              </View>
              <View style={styles.streakIconWrap}>
                <Ionicons name="flame" size={80} color={colors.primary + '10'} />
              </View>
            </View>
          </View>

          {report && (
            <>
              {/* ── Editorial Hero ── */}
              <View style={styles.heroSection}>
                <Text style={styles.heroKicker}>{report.periodLabel}</Text>
                <Text style={styles.heroTitle}>
                  {report.savingsRate >= 20 ? 'Optimal Flow.' : 'Tight Margins.'}
                </Text>
                <Text style={styles.heroSubtitle}>
                  Your net position for this window is <MoneyText amount={Math.abs(report.netPosition)} currency={profile.defaultCurrency} style={styles.inlineMoney} />.
                  {report.savingsRate >= 20 ? ' Excellent discipline.' : ' Caution is advised.'}
                </Text>
              </View>

              {/* ── Core Metrics ── */}
              <View style={styles.metricGrid}>
                <MetricCard
                  label="EXPENSE"
                  value={report.totalExpense}
                  currency={profile.defaultCurrency}
                  trendMode="low_is_good"
                  changeValue={report.comparison?.expenseChange}
                />
                <MetricCard
                  label="SAVINGS RATE"
                  value={report.savingsRate}
                  currency={profile.defaultCurrency}
                  isAmount={false}
                  suffix="%"
                  trendMode="high_is_good"
                  changeValue={report.comparison?.incomeChange}
                />
              </View>

              {/* ── Insights Section ── */}
              {insights && insights.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>SMART INSIGHTS</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.insightsScroll}
                    decelerationRate="fast"
                    snapToInterval={220} // card width (210) + gap (10)
                    snapToAlignment="start"
                  >
                    {insights.map((insight) => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* ── Category Sector Breakdown ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>BY SECTOR</Text>
                <View style={styles.breakdownCard}>
                  {report.topCategories.length > 0 ? report.topCategories.map((cat, index) => (
                    <View key={cat.id} style={[styles.catRow, index === report.topCategories.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={styles.catMeta}>
                        <View style={[styles.catIconBox, { backgroundColor: cat.color + '15' }]}>
                          <Ionicons name={resolveIcon(cat.icon, 'pricetag')} size={14} color={cat.color} />
                        </View>
                        <View style={styles.catText}>
                          <Text style={styles.catName}>{cat.name}</Text>
                          <View style={styles.progressContainer}>
                            <View style={[styles.progressFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                          </View>
                        </View>
                        <MoneyText amount={cat.amount} currency={profile.defaultCurrency} style={styles.catAmount} weight="sansSemiBold" />
                      </View>
                    </View>
                  )) : (
                    <View style={styles.emptyActivity}>
                      <Text style={styles.emptyText}>No activity recorded in this period.</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          <View style={styles.brandingBox}>
            <Text style={styles.brandingText}>LUNO / PRIVATE LEDGER</Text>
          </View>
        </PremiumGuard>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: theme.colors.surface + '80',
    padding: 4,
    borderRadius: theme.radius.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.text,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 28,
  },
  heroKicker: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
    color: theme.colors.primary,
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 40,
    lineHeight: 44,
    color: theme.colors.text,
    letterSpacing: -2,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 22,
    maxWidth: '90%',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: 14,
    opacity: 0.8,
  },
  streakCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: theme.colors.surface + '80',
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  streakInfo: {
    flex: 1,
    zIndex: 1,
  },
  streakTitle: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: 6,
  },
  streakSubtitle: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    maxWidth: '85%',
  },
  streakIconWrap: {
    position: 'absolute',
    right: -10,
    bottom: -15,
  },
  insightsScroll: {
    paddingRight: 24,
  },
  breakdownCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface + '80',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  catRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  catMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catText: {
    flex: 1,
    gap: 8,
  },
  catName: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  catAmount: {
    fontSize: 14,
  },
  progressContainer: {
    height: 3,
    backgroundColor: theme.colors.text + '08',
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  inlineMoney: {
    fontSize: 14,
  },
  emptyActivity: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  brandingBox: {
    alignItems: 'center',
    marginTop: 20,
  },
  brandingText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.text + '20',
    letterSpacing: 3,
  },
});
