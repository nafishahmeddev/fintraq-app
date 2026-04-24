import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { GoalFormPage } from '../../../src/features/goals/screens/GoalFormPage';

export default function GoalEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GoalFormPage mode="edit" goalId={id ? parseInt(id, 10) : null} />;
}
