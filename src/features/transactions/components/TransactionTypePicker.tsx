import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { TransactionType } from '../../../types';

type Props = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  colors: ThemeColors;
  disabled?: boolean;
};

const TYPE_CONFIG: Record<TransactionType, { label: string; colorKey: keyof ThemeColors }> = {
  DR: { label: 'Expense', colorKey: 'danger' },
  CR: { label: 'Income', colorKey: 'success' },
  TRANSFER: { label: 'Transfer', colorKey: 'primary' },
};

export const TransactionTypePicker = ({ value, onChange, colors, disabled }: Props) => {
  if (disabled) {
    // Show only the selected type as a static display
    const config = TYPE_CONFIG[value];
    const activeColor = colors[config.colorKey];

    return (
      <View style={styles.container}>
        <View style={[styles.pill, { backgroundColor: activeColor, borderColor: activeColor }]}>
          <Text style={[styles.pillText, { color: colors.background }]}>{config.label}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {(Object.keys(TYPE_CONFIG) as TransactionType[]).map((type) => {
        const config = TYPE_CONFIG[type];
        const isSelected = value === type;
        const activeColor = colors[config.colorKey];

        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.pill,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isSelected && { backgroundColor: activeColor, borderColor: activeColor },
            ]}
            onPress={() => onChange(type)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, { color: isSelected ? colors.background : colors.textMuted }]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 13,
  },
});
