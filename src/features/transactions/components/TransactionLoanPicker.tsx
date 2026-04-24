import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { RADIUS, spacing } from '../../../theme/tokens';
import { useLoans } from '../../loans/api/loans';
import { TransactionType } from '../../../db/schema';

type Props = {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  colors: ThemeColors;
  accountId: number | null;
  type: TransactionType;
};

export const TransactionLoanPicker = React.memo(function TransactionLoanPicker({
  selectedId,
  onSelect,
  colors,
  accountId,
  type,
}: Props) {
  const { data: loans, isLoading } = useLoans();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const activeLoans = React.useMemo(() => {
    if (!loans) return [];
    
    return loans.filter(l => {
      // If loan has no account, it shows up for all accounts
      // If loan has an account, it must match the selected transaction account
      const isCorrectAccount = l.accountId === null || accountId === null || l.accountId === accountId;
      const isActive = l.status === 'ACTIVE';
      
      // BORROW loan repayment is an Expense (DR)
      // LEND loan repayment is an Income (CR)
      const isCorrectType = (type === 'DR' && l.type === 'BORROW') || 
                          (type === 'CR' && l.type === 'LEND');
                          
      return isActive && isCorrectAccount && isCorrectType;
    });
  }, [loans, accountId, type]);

  if (isLoading || activeLoans.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>LINK TO LOAN</Text>
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

        {activeLoans.map((loan) => {
          const isSelected = selectedId === loan.id;
          const loanColor = '#' + loan.color.toString(16).padStart(6, '0');

          return (
            <TouchableOpacity
              key={loan.id}
              style={[
                styles.chip,
                isSelected && { backgroundColor: colors.text, borderColor: colors.text },
              ]}
              onPress={() => onSelect(loan.id)}
            >
              <Ionicons 
                name={(loan.icon + '-outline') as any} 
                size={14} 
                color={isSelected ? colors.background : loanColor} 
              />
              <Text style={[styles.chipText, isSelected && { color: colors.background }]}>
                {loan.name}
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
