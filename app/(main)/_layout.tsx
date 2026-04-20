import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { BottomTabBar } from '../../src/components/ui/BottomTabBar';
import { useOnboarding } from '../../src/providers/OnboardingProvider';

export default function TabsLayout() {
  const { hasOnboarded } = useOnboarding();

  if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts' }} />
      <Tabs.Screen name="stats" options={{ title: 'Pulse' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
