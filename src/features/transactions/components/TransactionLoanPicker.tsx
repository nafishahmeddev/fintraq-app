import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useLoans } from '../../loans/api/loans';
import { TransactionType } from '../../../db/schema';

type Props = {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  accountId: number | null;
  type: TransactionType;
};

export const TransactionLoanPicker = React.memo(function TransactionLoanPicker({
  selectedId,
  onSelect,
  accountId,
  type,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { data: loans, isLoading } = useLoans();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const activeLoans = React.useMemo(() => {
    if (!loans) return [];
    
    return loans.filter(l => {
      const isCorrectAccount = l.accountId === null || accountId === null || l.accountId === accountId;
      const isActive = l.status === 'ACTIVE';
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
          activeOpacity={0.7}
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
              activeOpacity={0.7}
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

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: theme.spacing[12],
    marginTop: theme.spacing[8],
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
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
