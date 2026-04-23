import React from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import { TransactionType } from '../../../types';

type Props = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  colors: ThemeColors;
  disabled?: boolean;
  allowedTypes?: TransactionType[];
};

const TYPE_CONFIG: Record<TransactionType, { label: string; colorKey: keyof ThemeColors }> = {
  DR: { label: 'Expense', colorKey: 'danger' },
  CR: { label: 'Income', colorKey: 'success' },
  TRANSFER: { label: 'Transfer', colorKey: 'primary' },
};

export const TransactionTypePicker = ({ value, onChange, colors, disabled, allowedTypes }: Props) => {
  const typesToRender = allowedTypes || (Object.keys(TYPE_CONFIG) as TransactionType[]);

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
      {typesToRender.map((type) => {
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

