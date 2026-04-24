import { PersonFormPage } from '../../../src/features/people/screens/PersonFormPage';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function EditPersonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PersonFormPage mode="edit" personId={parseInt(id, 10)} />;
}
