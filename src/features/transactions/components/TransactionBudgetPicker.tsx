import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import { budgets } from '../../../db/schema';

type Props = {
  budgetsList: typeof budgets.$inferSelect[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  colors: ThemeColors;
};

export const TransactionBudgetPicker = ({ budgetsList, selectedId, onSelect, colors }: Props) => {

  if (budgetsList.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>BUDGET (OPTIONAL)</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={[
            styles.pill,
            { backgroundColor: colors.surface, borderColor: colors.border },
            selectedId === null && { backgroundColor: colors.textMuted + '20', borderColor: colors.textMuted },
          ]}
          onPress={() => onSelect(null)}
          activeOpacity={0.8}
        >
          <Text style={[styles.name, { color: selectedId === null ? colors.text : colors.textMuted }]}>
            None
          </Text>
        </TouchableOpacity>

        {budgetsList.map((budget) => {
          const selected = selectedId === budget.id;
          return (
            <TouchableOpacity
              key={budget.id}
              style={[
                styles.pill,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selected && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => onSelect(budget.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="pie-chart-outline"
                size={14}
                color={selected ? colors.background : colors.text}
              />
              <Text
                style={[
                  styles.name,
                  { color: selected ? colors.background : colors.text },
                ]}
                numberOfLines={1}
              >
                {budget.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

