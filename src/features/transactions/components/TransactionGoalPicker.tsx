import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { RADIUS } from '../../../theme/tokens';
import { useGoals } from '../../goals/api/goals';
import { TransactionType } from '../../../db/schema';

type Props = {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  colors: ThemeColors;
  accountId: number | null;
  type: TransactionType;
};

export const TransactionGoalPicker = React.memo(function TransactionGoalPicker({
  selectedId,
  onSelect,
  colors,
  accountId,
  type,
}: Props) {
  const { data: goals, isLoading } = useGoals();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
      <Text style={styles.sectionLabel}>LINK TO GOAL</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            selectedId === null && { backgroundColor: colors.text, borderColor: colors.text },
          ]}
          onPress={() => onSelect(null)}
        >
          <Text style={[styles.chipText, selectedId === null && { color: colors.background }]}>
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
                isSelected && { backgroundColor: colors.text, borderColor: colors.text },
              ]}
              onPress={() => onSelect(goal.id)}
            >
              <Ionicons 
                name={(goal.icon + '-outline') as any} 
                size={14} 
                color={isSelected ? colors.background : goalColor} 
              />
              <Text style={[styles.chipText, isSelected && { color: colors.background }]}>
                {goal.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 8,
  },
  sectionLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontFamily: TYPOGRAPHY.fonts.medium,
    fontSize: 12,
  },
});
