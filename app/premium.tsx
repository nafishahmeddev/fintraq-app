import { Header } from '@/src/components/ui/Header';
import { FEATURES, SKU_LIFETIME } from '@/src/constants/iap';
import { usePremium } from '@/src/providers/PremiumProvider';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * PremiumScreen: Consolidates conversion and detailed information.
 * Refined to match the 'Settings' pattern for a cohesive app experience.
 */
export default function PremiumScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { products, purchasePremium, restorePurchase, isPremium, isLoading } = usePremium();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [isProcessing, setIsProcessing] = useState(false);

  const lifetimeProduct = useMemo(() => {
    return products.find(p => p.id === SKU_LIFETIME);
  }, [products]);

  const styles = useMemo(() => createStyles(theme, screenWidth), [theme, screenWidth]);

  const handlePurchase = useCallback(async () => {
    setIsProcessing(true);
    await purchasePremium();
    setIsProcessing(false);
  }, [purchasePremium]);

  const handleRestore = useCallback(async () => {
    setIsProcessing(true);
    await restorePurchase();
    setIsProcessing(false);
  }, [restorePurchase]);

  if (isPremium && !isProcessing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.successWrapper}>
          <View style={styles.proContent}>
            <View style={styles.proBadge}>
              <Ionicons name="sparkles" size={32} color={colors.primary} />
            </View>

            <View style={styles.proHero}>
              <Text style={styles.proKicker}>Lifetime access</Text>
              <Text style={styles.proHeading}>Luno Pro{"\n"}unlocked.</Text>
            </View>

            <View style={styles.proStatusRow}>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.statusText}>Forever member</Text>
              </View>
            </View>

            <Text style={styles.proDescription}>
              You have permanent, unrestricted access to the complete professional suite. All current and future features are yours.
            </Text>
          </View>

          <View style={styles.proActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>Dashboard</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <Header title="Luno Pro" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Editorial Hero ── */}
        <View style={styles.heroSection}>
          <Text style={styles.heroKicker}>One-time upgrade</Text>
          <Text style={styles.heroTitle}>Unlock peak financial clarity.</Text>
          <Text style={styles.heroSubtitle}>No subscriptions. One payment for permanent access to all professional tools.</Text>
        </View>

        {/* ── Main Offer Card (Primary CTA) ── */}
        <View style={styles.offerSection}>
          <View style={styles.lifetimeCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Lifetime access</Text>
                <Text style={styles.cardSubtitle}>Forever pro license</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>Best value</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              {lifetimeProduct ? (
                <>
                  <View style={styles.priceRow}>
                    {lifetimeProduct.originalPrice && (
                      <Text style={styles.originalPrice}>{lifetimeProduct.originalPrice}</Text>
                    )}
                    <Text style={styles.priceValue}>{lifetimeProduct.displayPrice}</Text>
                  </View>
                  <Text style={styles.priceSuffix}>One-time only</Text>
                </>
              ) : isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.priceError}>Pricing unavailable</Text>
              )}
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.trustInfo}>
              <View style={styles.trustRow}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <Text style={styles.trustText}>Permanent device account license</Text>
              </View>
              <View style={styles.trustRow}>
                <Ionicons name="cloud-done" size={14} color={colors.success} />
                <Text style={styles.trustText}>All future tool updates included</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Detailed Features (Settings Pattern) ── */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionLabel}>Pro capabilities</Text>
          <View style={styles.settingsCard}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={[styles.settingsRow, index === FEATURES.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name={feature.icon} size={18} color={colors.text} />
                </View>
                <View style={styles.textDetails}>
                  <Text style={styles.rowTitle}>{feature.title}</Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>{feature.description}</Text>
                </View>
                <View style={styles.rowRightSide}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Error State ── */}
        <View style={styles.brandingBox}>
          <Text style={styles.brandingText}>Luno / Pro System</Text>
        </View>
      </ScrollView>

      {/* ── Action Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buyBtn}
          onPress={handlePurchase}
          disabled={isProcessing || isPremium || !lifetimeProduct}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buyBtnText}>
              {isPremium ? 'Pro member' : `Upgrade forever`}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.legalRows}>
          <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
            <Text style={styles.legalLink}>Restore purchase</Text>
          </TouchableOpacity>
          <View style={styles.legalSeparator} />
          <TouchableOpacity onPress={() => Alert.alert("Terms", "Luno Pro is a one-time purchase tied to your store account.")}>
            <Text style={styles.legalLink}>Terms</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, screenWidth: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

  heroSection: { marginTop: 20, marginBottom: 24 },
  heroKicker: { fontFamily: theme.fontFamilies.sansMedium, fontSize: 12, color: theme.colors.primary, marginBottom: 8 },
  heroTitle: { fontFamily: theme.fontFamilies.heading, fontSize: 40, lineHeight: 44, color: theme.colors.text, letterSpacing: -2, marginBottom: 4 },
  heroSubtitle: { fontFamily: theme.fontFamilies.sans, fontSize: 14, color: theme.colors.textMuted, lineHeight: 22, maxWidth: '85%' },

  offerSection: { marginBottom: 28 },
  lifetimeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius['3xl'],
    padding: 22,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: { fontFamily: theme.fontFamilies.sansBold, fontSize: 18, color: theme.colors.text },
  cardSubtitle: { fontFamily: theme.fontFamilies.sans, fontSize: 12, color: theme.colors.textMuted, marginTop: 1 },
  cardBadge: { backgroundColor: theme.colors.primary, paddingHorizontal: 9, height: 20, borderRadius: theme.radius.full, justifyContent: 'center' },
  cardBadgeText: { fontFamily: theme.fontFamilies.sansBold, fontSize: 10, color: theme.colors.onPrimary },

  priceContainer: { marginBottom: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  originalPrice: { fontFamily: theme.fontFamilies.sans, fontSize: 18, color: theme.colors.textMuted, textDecorationLine: 'line-through', opacity: 0.6 },
  priceValue: { fontFamily: theme.fontFamilies.mono, fontSize: 44, color: theme.colors.text, letterSpacing: -1.5 },
  priceSuffix: { fontFamily: theme.fontFamilies.sansBold, fontSize: 13, color: theme.colors.textMuted, opacity: 0.8 },
  priceError: { fontFamily: theme.fontFamilies.sans, fontSize: 14, color: theme.colors.danger },

  cardDivider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 14, opacity: 0.5 },
  trustInfo: { gap: 8 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  trustText: { fontFamily: theme.fontFamilies.sansBold, fontSize: 11, color: theme.colors.success, letterSpacing: 0.1 },

  sectionLabel: { fontFamily: theme.fontFamilies.sansMedium, fontSize: 12, color: theme.colors.textMuted, marginBottom: 14 },

  /* ── Settings-like Feature Styles ── */
  featuresSection: { marginBottom: 32 },
  settingsCard: {
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 14,
  },
  textDetails: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  rowSubtitle: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rowRightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  brandingBox: { alignItems: 'center', marginTop: 10, marginBottom: 0 },
  brandingText: { fontFamily: theme.fontFamilies.sansBold, fontSize: 10, color: theme.colors.text + '20', letterSpacing: 3, textTransform: 'uppercase' },

  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 32, backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.primary + '10' },
  buyBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: theme.radius.full, justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...theme.shadow.md },
  buyBtnText: { fontFamily: theme.fontFamilies.sansBold, fontSize: 16, color: theme.colors.onPrimary },
  legalRows: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  legalLink: { fontFamily: theme.fontFamilies.sansMedium, fontSize: 12, color: theme.colors.textMuted },
  legalSeparator: { width: 4, height: 4, borderRadius: theme.radius.full, backgroundColor: theme.colors.primary + '20' },

  successWrapper: { flex: 1, padding: 32, justifyContent: 'space-between' },
  proContent: { flex: 1, justifyContent: 'center' },
  proBadge: { width: 64, height: 64, borderRadius: theme.radius.full, backgroundColor: theme.colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  proHero: { marginBottom: 24 },
  proKicker: { fontFamily: theme.fontFamilies.sansMedium, fontSize: 12, color: theme.colors.primary, marginBottom: 8 },
  proHeading: { fontFamily: theme.fontFamilies.heading, fontSize: 56, lineHeight: 60, color: theme.colors.text, letterSpacing: -3 },

  proStatusRow: { flexDirection: 'row', marginBottom: 32 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  statusDot: { width: 6, height: 6, borderRadius: theme.radius.full },
  statusText: { fontFamily: theme.fontFamilies.sansMedium, fontSize: 12, color: theme.colors.text },

  proDescription: { fontFamily: theme.fontFamilies.sans, fontSize: 16, color: theme.colors.textMuted, lineHeight: 26, maxWidth: '90%' },
  proActions: { gap: 16, marginBottom: 12 },
  actionBtn: { height: 56, backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, ...theme.shadow.md },
  actionBtnText: { fontFamily: theme.fontFamilies.sansBold, fontSize: 15, color: theme.colors.onPrimary },
});
