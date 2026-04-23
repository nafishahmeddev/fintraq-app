import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../db/client';
import migrations from '../../drizzle/migrations';
import { runAllSeeders } from '../db/seeders';
import { syncRecurringTransactions } from '../features/recurring/services/syncRecurring';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const [seedingComplete, setSeedingComplete] = useState(false);

  useEffect(() => {
    if (success && !seedingComplete) {
      // Run seeders after migrations complete
      runAllSeeders()
        .then(() => syncRecurringTransactions())
        .then(() => setSeedingComplete(true))
        .catch((err) => {
          console.error('[DatabaseProvider] Seeding failed:', err);
          setSeedingComplete(true); // Continue even if seeding fails
        });
    }
  }, [success, seedingComplete]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading database migrations</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }

  if (!success || !seedingComplete) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Initializing database...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
