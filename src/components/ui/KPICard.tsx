import React, { useCallback, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { MoneyText } from './MoneyText';
import { useTheme } from '../../providers/ThemeProvider';
import { Box, HStack, VStack } from './Stack';
import { Text, cn } from './Text';
import { Pressable } from './Pressable';
import { Divider } from './Divider';

type KPIMetrics = {
  income: number;
  expense: number;
};

type Props = {
  currencies: string[];
  selectedCurrency: string | null;
  onSelectCurrency: (currency: string) => void;
  metrics: KPIMetrics;
};

export const KPICard = React.memo(function KPICard({
  currencies,
  selectedCurrency,
  onSelectCurrency,
  metrics,
}: Props) {

  const handleCurrencyPress = useCallback((curr: string) => {
    onSelectCurrency(curr);
  }, [onSelectCurrency]);

  return (
    <VStack className="rounded-2xl bg-surface border border-border overflow-hidden">
      {currencies.length > 1 && (
        <Box className="border-b border-border py-2 pl-3">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingRight: 12, gap: 8 }}
          >
            {currencies.map((cur) => (
              <Pressable
                key={cur}
                className={cn(
                  'px-3 py-1.5 rounded-full border',
                  selectedCurrency === cur
                    ? 'bg-primary border-primary'
                    : 'bg-background border-border'
                )}
                onPress={() => handleCurrencyPress(cur)}
              >
                <Text
                  className={cn(
                    'font-semibold text-xs tracking-wide',
                    selectedCurrency === cur ? 'text-background' : 'text-text-muted'
                  )}
                >
                  {cur}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Box>
      )}
      
      <VStack className="p-4 pb-4 space-y-3">
        {/* Top: Net Balance */}
        <HStack className="items-center justify-between">
          <VStack>
            <Text className="text-text-muted font-semibold text-[9px] tracking-widest uppercase mb-0.5">
              NET SAVINGS
            </Text>
            <MoneyText
              amount={Math.abs(metrics.income - metrics.expense)}
              currency={selectedCurrency ?? undefined}
              type={metrics.income >= metrics.expense ? 'CR' : 'DR'}
              className="text-2xl leading-7"
            />
          </VStack>
        </HStack>

        <Box className="h-px bg-border/50" />

        {/* Bottom: In/Out Split */}
        <HStack className="items-center">
          <VStack className="flex-1 space-y-0.5">
            <Text className="text-text-muted font-semibold text-[8px] tracking-widest uppercase">
              INCOME
            </Text>
            <MoneyText
              amount={metrics.income}
              currency={selectedCurrency ?? undefined}
              type="CR"
              className="text-sm leading-tight"
            />
          </VStack>
          <Box className="w-px h-6 bg-border/60 mx-4" />
          <VStack className="flex-1 space-y-0.5">
            <Text className="text-text-muted font-semibold text-[8px] tracking-widest uppercase">
              EXPENSES
            </Text>
            <MoneyText
              amount={metrics.expense}
              currency={selectedCurrency ?? undefined}
              type="DR"
              className="text-sm leading-tight"
            />
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  );
});