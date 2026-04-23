import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { Box, HStack, VStack } from './Stack';
import { Pressable } from './Pressable';
import { Text, cn } from './Text';

interface PremiumGuardProps {
  children: React.ReactNode;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const PremiumGuard = React.memo(function PremiumGuard({
  children,
  label = 'Pro only',
  size = 'large',
  className
}: PremiumGuardProps) {
  const { isPremium } = usePremium();
  const { isDark } = useTheme();
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push('/premium');
  }, [router]);

  const { isSmall, containerClasses, iconBoxClasses, iconSize, actionBadgeClasses, actionTextLabel } = useMemo(() => {
    const small = size === 'small';
    const medium = size === 'medium';
    
    return {
      isSmall: small,
      containerClasses: cn(
        "border border-border overflow-hidden justify-center bg-surface relative",
        small ? "p-3 rounded-xl min-h-[56px]" : medium ? "p-4 rounded-2xl min-h-[76px]" : "p-5 rounded-3xl min-h-[90px]"
      ),
      iconBoxClasses: cn(
        "justify-center items-center border border-border bg-background",
        small ? "w-8 h-8 rounded-lg" : "w-11 h-11 rounded-xl"
      ),
      iconSize: small ? 14 : 18,
      actionBadgeClasses: cn(
        "justify-center items-center bg-text",
        small ? "px-2.5 py-1.5 rounded-lg" : "px-3.5 py-2.5 rounded-xl"
      ),
      actionTextLabel: small ? 'Pro' : 'Unlock'
    };
  }, [size]);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <Pressable
      onPress={handlePress}
      className={cn(containerClasses, className)}
    >
      {/* Background Accent & Watermark */}
      <Box className="absolute inset-0 bg-primary/5" />
      <Ionicons
        name="sparkles"
        size={isSmall ? 60 : 120}
        color={isDark ? '#B8D641' : '#a6c13a'}
        className="absolute -right-5 -bottom-8 opacity-5 -rotate-[15deg]"
      />

      <VStack className="flex-1 justify-center relative z-10">
        <HStack className="items-center space-x-3.5">

          <Box className={iconBoxClasses}>
             <Ionicons name="lock-closed" size={iconSize} color={isDark ? '#fbfff3' : '#000100'} />
          </Box>

          <VStack className="flex-1">
             <Text className={cn("font-bold text-text", isSmall ? "text-[11px]" : "text-sm mb-1")}>
               {label}
             </Text>
             {!isSmall && (
               <Text className="font-regular text-xs text-text-muted">
                 Premium member exclusive
               </Text>
             )}
          </VStack>

          <Box className={actionBadgeClasses}>
             <Text className="font-bold text-[10px] tracking-widest text-background">
               {actionTextLabel}
             </Text>
          </Box>

        </HStack>
      </VStack>
    </Pressable>
  );
});