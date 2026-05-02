import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { budgets } from '../../../db/schema';

type Props = {
  budgetsList: typeof budgets.$inferSelect[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

export const TransactionBudgetPicker = ({ budgetsList, selectedId, onSelect }: Props) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (budgetsList.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Budget (optional)</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={[
            styles.pill,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            selectedId === null && { backgroundColor: theme.colors.textMuted + '15', borderColor: theme.colors.textMuted },
          ]}
          onPress={() => onSelect(null)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.name, 
            { 
              color: selectedId === null ? theme.colors.text : theme.colors.textMuted,
              fontFamily: selectedId === null ? theme.fontFamilies.sansBold : theme.fontFamilies.sansSemiBold
            }
          ]}>
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
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                selected && { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primaryDark },
              ]}
              onPress={() => onSelect(budget.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="pie-chart-outline"
                size={14}
                color={selected ? theme.colors.background : theme.colors.text}
              />
              <Text
                style={[
                  styles.name,
                  { 
                    color: selected ? theme.colors.background : theme.colors.text,
                    fontFamily: selected ? theme.fontFamilies.sansBold : theme.fontFamilies.sansSemiBold
                  },
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingVertical: theme.spacing[12],
      paddingHorizontal: 24,
    },
    label: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing[12],
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[8],
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
      paddingHorizontal: theme.spacing[12],
      height: 40,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      ...theme.shadow.xs,
    },
    name: {
      fontSize: 13,
    },
  });
