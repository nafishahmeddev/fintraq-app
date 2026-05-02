import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useGoals } from '../../goals/api/goals';
import { TransactionType } from '../../../db/schema';

type Props = {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  accountId: number | null;
  type: TransactionType;
};

export const TransactionGoalPicker = React.memo(function TransactionGoalPicker({
  selectedId,
  onSelect,
  accountId,
  type,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { data: goals, isLoading } = useGoals();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const activeGoals = React.useMemo(() => {
    if (!goals || type !== 'CR') return [];
    return goals.filter(g => 
      g.status === 'ACTIVE' && 
      (g.accountId === null || accountId === null || g.accountId === accountId)
    );
  }, [goals, accountId, type]);

  if (isLoading || activeGoals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Link to goal</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            selectedId === null && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => onSelect(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, selectedId === null && { color: colors.onPrimary }]}>
            None
          </Text>
        </TouchableOpacity>

        {activeGoals.map((goal) => {
          const isSelected = selectedId === goal.id;
          const goalColor = '#' + goal.color.toString(16).padStart(6, '0');

          return (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.chip,
                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => onSelect(goal.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={(goal.icon + '-outline') as any} 
                size={14} 
                color={isSelected ? colors.onPrimary : goalColor} 
              />
              <Text style={[styles.chipText, isSelected && { color: colors.onPrimary }]}>
                {goal.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: theme.spacing[12],
    marginTop: theme.spacing[8],
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  scrollContent: {
    gap: theme.spacing[8],
    paddingRight: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    paddingHorizontal: theme.spacing[12],
    height: 36,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 12,
    color: theme.colors.text,
  },
});
