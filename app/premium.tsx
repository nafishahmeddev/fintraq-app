import { Header } from '@/src/components/ui/Header';
import { FEATURES, SKU_LIFETIME } from '@/src/constants/iap';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, HStack, VStack, Pressable, Text, cn } from '@/src/components/ui';

let BlurView: any = null;
if (Platform.OS !== 'web') {
  BlurView = require('@sbaiahmed1/react-native-blur').BlurView;
}

export default function PremiumScreen() {
  const { isDark } = useTheme();
  const { products, purchasePremium, restorePurchase, isPremium, isLoading } = usePremium();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [isProcessing, setIsProcessing] = useState(false);

  const lifetimeProduct = useMemo(() => {
    return products.find(p => p.id === SKU_LIFETIME);
  }, [products]);

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
      <View className="flex-1 bg-background">
        <View className="absolute inset-0" pointerEvents="none">
          <View className="absolute rounded-full" style={{ top: -100, left: -100, width: 500, height: 500, backgroundColor: isDark ? '#B8D641' : '#a6c13a', opacity: 0.15 }} />
          <View className="absolute rounded-full" style={{ bottom: -150, right: -150, width: 600, height: 600, backgroundColor: isDark ? '#B8D641' : '#a6c13a', opacity: 0.1 }} />
        </View>
        {BlurView && <BlurView blurAmount={Platform.OS === 'ios' ? 80 : 95} blurType={isDark ? 'dark' : 'light'} className="absolute inset-0" />}

        <SafeAreaView className="flex-1 justify-center px-8">
          <VStack className="items-center mb-16">
            <Box className="w-20 h-20 rounded-[32px] bg-primary/20 items-center justify-center mb-8 border border-primary/30">
              <Ionicons name="sparkles" size={32} color={isDark ? '#B8D641' : '#a6c13a'} />
            </Box>

            <VStack className="items-center space-y-3 mb-10">
              <Text className="font-semibold text-xs tracking-widest uppercase text-primary">Lifetime access</Text>
              <Text className="font-heading text-[44px] leading-[48px] tracking-tighter text-text text-center">Luno Pro{"\n"}Unlocked.</Text>
            </VStack>

            <HStack className="mb-6">
              <HStack className="items-center px-4 h-9 rounded-full bg-surface border border-border space-x-2">
                <Box className="w-2 h-2 rounded-full bg-primary" />
                <Text className="font-semibold text-[13px] text-text">Forever member</Text>
              </HStack>
            </HStack>

            <Text className="font-regular text-[15px] leading-6 text-text-muted text-center max-w-[280px]">
              You have permanent, unrestricted access to the complete professional suite. All current and future features are yours.
            </Text>
          </VStack>

          <Box className="items-center">
            <Pressable
              className="flex-row items-center h-14 px-8 rounded-full bg-text space-x-3"
              onPress={() => router.back()}
            >
              <Text className="font-semibold text-base text-background">Dashboard</Text>
              <Ionicons name="arrow-forward" size={18} color={isDark ? '#000100' : '#F6FFF9'} />
            </Pressable>
          </Box>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* ── Immersive Background ── */}
      <View className="absolute inset-0" pointerEvents="none">
        <View className="absolute rounded-full" style={{ top: -60, left: -60, width: 340, height: 340, backgroundColor: isDark ? '#B8D641' : '#a6c13a', opacity: 0.72 }} />
        <View className="absolute rounded-full" style={{ top: 180, right: -110, width: 440, height: 440, backgroundColor: isDark ? '#a0c119' : '#8caa14', opacity: 0.52 }} />
        <View className="absolute rounded-full" style={{ bottom: -110, left: 40, width: 380, height: 380, backgroundColor: isDark ? '#B8D641' : '#a6c13a', opacity: 0.6 }} />
      </View>
      {BlurView && <BlurView blurAmount={Platform.OS === 'ios' ? 80 : 95} blurType={isDark ? 'dark' : 'light'} className="absolute inset-0" />}
      {(Platform.OS === 'android' || Platform.OS === 'web') && (
        <View className="absolute inset-0 bg-background/60" pointerEvents="none" />
      )}

      <Header title="Luno Pro" showBack />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>

        <VStack className="px-6 py-6 space-y-4">
          <Text className="font-semibold text-[10px] tracking-widest text-text-muted uppercase">One-time upgrade</Text>
          <Text className="font-heading text-[40px] leading-[44px] text-text tracking-tighter">Unlock peak financial clarity.</Text>
          <Text className="font-regular text-[15px] leading-6 text-text-muted max-w-[300px]">No subscriptions. One payment for permanent access to all professional tools.</Text>
        </VStack>

        <VStack className="px-6 mb-8">
          <VStack className="bg-surface rounded-3xl border border-border p-6 shadow-2xl">
            <HStack className="justify-between items-start mb-6">
              <VStack>
                <Text className="font-heading text-[22px] tracking-tight text-text leading-7">Lifetime Access</Text>
                <Text className="font-medium text-[13px] text-text-muted mt-1">Forever Pro License</Text>
              </VStack>
              <Box className="px-2.5 h-[22px] rounded-sm bg-primary/20 items-center justify-center">
                <Text className="font-semibold text-[9px] tracking-widest uppercase text-primary">Best Value</Text>
              </Box>
            </HStack>

            <VStack className="mb-6">
              {lifetimeProduct ? (
                <>
                  <HStack className="items-end space-x-2">
                    {lifetimeProduct.originalPrice && (
                      <Text className="font-semibold text-lg text-text-muted line-through mb-1.5">{lifetimeProduct.originalPrice}</Text>
                    )}
                    <Text className="font-monoBold text-[40px] leading-[44px] tracking-tighter text-text">{lifetimeProduct.displayPrice}</Text>
                  </HStack>
                  <Text className="font-semibold text-[13px] text-text-muted tracking-wide mt-2">One-time only</Text>
                </>
              ) : isLoading ? (
                <ActivityIndicator color={isDark ? '#B8D641' : '#a6c13a'} />
              ) : (
                <Text className="font-medium text-sm text-danger">Pricing unavailable</Text>
              )}
            </VStack>

            <Box className="h-px bg-border mb-6" />

            <VStack className="space-y-3">
              <HStack className="items-center space-x-3">
                <Ionicons name="shield-checkmark" size={14} color={isDark ? '#6BD498' : '#43B875'} />
                <Text className="font-medium text-[13px] text-text">Permanent Device Account License</Text>
              </HStack>
              <HStack className="items-center space-x-3">
                <Ionicons name="cloud-done" size={14} color={isDark ? '#6BD498' : '#43B875'} />
                <Text className="font-medium text-[13px] text-text">All future tool updates included</Text>
              </HStack>
            </VStack>
          </VStack>
        </VStack>

        <VStack className="px-6 mb-8 space-y-4">
          <Text className="font-semibold text-[10px] tracking-widest text-text-muted uppercase pl-1">Pro Capabilities</Text>
          <VStack className="bg-surface rounded-2xl border border-border overflow-hidden">
            {FEATURES.map((feature, index) => (
              <HStack key={index} className={cn("p-4 items-center space-x-3.5", index !== FEATURES.length - 1 && "border-b border-border")}>
                <Box className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center">
                  <Ionicons name={feature.icon as any} size={18} color={isDark ? '#fbfff3' : '#000100'} />
                </Box>
                <VStack className="flex-1">
                  <Text className="font-semibold text-[15px] text-text mb-0.5">{feature.title}</Text>
                  <Text className="font-regular text-[13px] text-text-muted" numberOfLines={1}>{feature.description}</Text>
                </VStack>
                <Ionicons name="sparkles" size={14} color={isDark ? '#B8D641' : '#a6c13a'} />
              </HStack>
            ))}
          </VStack>
        </VStack>

        <Box className="items-center py-6 mb-12">
          <Text className="font-semibold text-[10px] tracking-widest text-text-muted/50 uppercase">Luno / Pro System</Text>
        </Box>
      </ScrollView>

      <VStack className="absolute bottom-0 left-0 right-0 px-6 pb-9 pt-4 bg-background border-t border-border">
        <Pressable
          className={cn(
            "h-[56px] rounded-full bg-text items-center justify-center mb-4",
            (isProcessing || isPremium || !lifetimeProduct) && "opacity-60"
          )}
          onPress={handlePurchase}
          disabled={isProcessing || isPremium || !lifetimeProduct}
        >
          {isProcessing ? (
            <ActivityIndicator color={isDark ? '#000100' : '#F6FFF9'} />
          ) : (
            <Text className="font-semibold text-base text-background tracking-wide">
              {isPremium ? 'Pro Member' : `Upgrade forever`}
            </Text>
          )}
        </Pressable>

        <HStack className="justify-center items-center space-x-4">
          <Pressable onPress={handleRestore} disabled={isProcessing}>
            <Text className="font-semibold text-xs text-text-muted">Restore purchase</Text>
          </Pressable>
          <Box className="w-1 h-1 rounded-full bg-text-muted/30" />
          <Pressable onPress={() => Alert.alert("Terms", "Luno Pro is a one-time purchase tied to your store account.")}>
            <Text className="font-semibold text-xs text-text-muted">Terms</Text>
          </Pressable>
        </HStack>
      </VStack>
    </SafeAreaView>
  );
}
