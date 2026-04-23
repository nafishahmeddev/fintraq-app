import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { BudgetFormPage } from '../../../src/features/budgets/screens/BudgetFormPage';

export default function EditBudgetRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BudgetFormPage mode="edit" budgetId={Number(id)} />;
}
