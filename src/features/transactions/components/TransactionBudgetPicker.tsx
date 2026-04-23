import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { budgets } from '../../../db/schema';

type Props = {
  budgetsList: typeof budgets.$inferSelect[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  colors: ThemeColors;
};

export const TransactionBudgetPicker = ({ budgetsList, selectedId, onSelect, colors }: Props) => {
  const styles = useMemo(() => createStyles(colors), [colors]);

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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    label: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      letterSpacing: 1.5,
      marginBottom: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: 999,
      borderWidth: 1,
    },
    name: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 13,
    },
  });
