import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView,  Text, View } from 'react-native';
import { PremiumGuard } from '../../../components/ui/PremiumGuard';
import { usePremium } from '../../../providers/PremiumProvider';
import { useTheme } from '../../../providers/ThemeProvider';
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
          <View style={[styles.emptyCard, { backgroundColor: colors.surface + '50', borderColor: colors.border }]}>
            <Ionicons name="analytics-outline" size={24} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No insights available yet. Keep tracking to unlock trends.</Text>
          </View>
        )}
      </PremiumGuard>
    </View>
  );
}

