import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PremiumGuard } from '../../../components/ui/PremiumGuard';
import { usePremium } from '../../../providers/PremiumProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../../theme/typography';
import { radius, spacing } from '../../../theme/tokens';
import { useDashboardInsights } from '../hooks/dashboard';
import { InsightCard } from './InsightCard';
import { SectionHeader } from './SectionHeader';

interface InsightsSectionProps {
  currency: string;
}

/**
 * InsightsSection: Orchestrates the display of financial insights on the dashboard.
 * 
 * Features:
 * 1. Pro-Only: Wrapped in PremiumGuard to emphasize premium value.
 * 2. Horizontal Scroll: Provides a clean, modern way to explore multiple insights.
 * 3. Loading & Empty States: Managed internally with React Query.
 */
export function InsightsSection({ currency }: InsightsSectionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isPremium } = usePremium();
  const { data: insights, isLoading } = useDashboardInsights(currency);

  const hasInsights = insights && insights.length > 0;

  return (
    <View style={styles.container}>
      <SectionHeader title="PRO INSIGHTS" />

      <PremiumGuard 
        label="Upgrade to Pro for insights" 
        size="large"
        containerStyle={[
          styles.premiumContainer,
          // Only use edge-to-edge (0) margin if premium is active to allow scrolling
          // Otherwise, it should have the default 24px margin to look like a card
          !isPremium && { marginHorizontal: 24 }
        ]}
      >
        {isLoading ? (
          <View style={styles.placeholderCard}>
            <View style={[styles.loadingCircle, { borderColor: colors.border }]} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Analyzing your patterns...</Text>
          </View>
        ) : hasInsights ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            decelerationRate="fast"
            snapToInterval={190} // 180 (card width) + 10 (gap)
            snapToAlignment="start"
          >
            <View style={{ width: 24 }} />
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
            <View style={{ width: 14 }} />
          </ScrollView>
        ) : (
          <View style={[styles.emptyCard, { borderColor: colors.border }]}>
            <EmptyState
              icon="analytics-outline"
              title="No insights yet"
              description="Keep tracking your transactions to unlock personalized insights and trends."
              size="compact"
              variant="inline"
              fullHeight={false}
            />
          </View>
        )}
      </PremiumGuard>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginVertical: 4,
    marginBottom: 20,
  },
  premiumContainer: {
    borderRadius: radius('xl'),
    overflow: 'hidden',
    marginHorizontal: 0, // Default to 0 for pro scrolling context
  },
  scrollContent: {
    paddingRight: 0,
    gap: 0, 
  },
  placeholderCard: {
    height: 110,
    marginHorizontal: spacing('6'),
    borderRadius: radius('lg'),
    backgroundColor: '#00000008',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing('3'),
  },
  loadingCircle: {
     width: 20,
     height: 20,
     borderRadius: 10,
     borderWidth: 2,
     borderColor: colors.border,
     borderStyle: 'dashed',
  },
  loadingText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  emptyCard: {
    height: 110,
    marginHorizontal: spacing('6'),
    borderRadius: radius('lg'),
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing('5'),
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing('2'),
  },
});
