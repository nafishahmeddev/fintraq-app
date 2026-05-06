import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { Theme, useTheme } from '../../src/providers/ThemeProvider';

export default function TabLayout() {
  const { hasOnboarded } = useOnboarding();
  const theme = useTheme();
  const { colors, fontFamilies } = theme;

  if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {

        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fontFamilies.sansSemiBold,
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="wallet-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="analytics-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const Ionicons = require('@expo/vector-icons').Ionicons;
  return <Ionicons name={name} size={size} color={color} />;
}

const styles = StyleSheet.create({
  tabBar: {},
});
