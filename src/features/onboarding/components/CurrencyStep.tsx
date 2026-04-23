import React from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { CURRENCIES } from '../../../constants/currency';

type CurrencyStepProps = {
  currency: string;
  onCurrencyChange: (value: string) => void;
};

export function CurrencyStep({ currency, onCurrencyChange }: CurrencyStepProps) {
  const { colors } = useTheme();
  const selectedCurrency = CURRENCIES.find((item) => item.code === currency);

  return (
    <View style={styles.wrapper}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>SELECTED DEFAULT</Text>
        <Text style={styles.heroValue}>{selectedCurrency?.name ?? currency}</Text>
        <Text style={styles.heroCode}>{selectedCurrency?.code ?? currency}</Text>
        <Text style={styles.heroSubtext}>Used for the first account and as the app default.</Text>
      </View>

      <View style={styles.chipsWrap}>
        {CURRENCIES.map((item) => {
          const selected = currency === item.code;
          return (
            <TouchableOpacity
              key={item.code}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => onCurrencyChange(item.code)}
              activeOpacity={0.9}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{item.code} · {item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

