import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { LoanFormPage } from '../../../src/features/loans/screens/LoanFormPage';

export default function LoanEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LoanFormPage mode="edit" loanId={id ? parseInt(id, 10) : null} />;
}
