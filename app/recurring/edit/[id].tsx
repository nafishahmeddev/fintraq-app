import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { RecurringFormPage } from '../../../src/features/recurring/screens/RecurringFormPage';

export default function EditRecurringRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecurringFormPage mode="edit" recurringId={Number(id)} />;
}
