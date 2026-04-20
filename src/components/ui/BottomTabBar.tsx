import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { LAYOUT, RADIUS, SPACING } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';

type TabItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const TAB_ITEMS: TabItem[] = [
  { name: 'index', label: 'Home', icon: 'grid-outline', activeIcon: 'grid' },
  { name: 'accounts', label: 'Accounts', icon: 'wallet-outline', activeIcon: 'wallet' },
  { name: 'stats', label: 'Stats', icon: 'pulse-outline', activeIcon: 'pulse' },
  { name: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings-sharp' },
];

export const TAB_BAR_HEIGHT = 60;

type TabButtonProps = {
  tab: TabItem;
  isActive: boolean;
  onPress: (name: string) => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
};

const TabButton = React.memo(function TabButton({
  tab,
  isActive,
  onPress,
  styles,
  colors,
}: TabButtonProps) {
  const handlePress = useCallback(() => onPress(tab.name), [onPress, tab.name]);

  return (
    <Pressable
      style={styles.tabButton}
      onPress={handlePress}
      android_ripple={{ color: colors.text + '15', borderless: true }}
    >
      <Ionicons
        name={isActive ? tab.activeIcon : tab.icon}
        size={LAYOUT.iconLg}
        color={isActive ? colors.text : colors.textMuted}
      />
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
    </Pressable>
  );
});

export const BottomTabBar = React.memo(function BottomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);

  const activeRouteName = state.routes[state.index]?.name;

  const handleFABPress = useCallback(() => {
    router.push('/transactions/create');
  }, [router]);

  const handleTabPress = useCallback(
    (tabName: string) => {
      const route = state.routes.find((r) => r.name === tabName);
      if (!route) return;
      const isFocused = activeRouteName === tabName;
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(tabName as never);
      }
    },
    [state.routes, navigation, activeRouteName],
  );

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TAB_ITEMS.slice(0, 2).map((tab) => (
          <TabButton
            key={tab.name}
            tab={tab}
            isActive={activeRouteName === tab.name}
            onPress={handleTabPress}
            styles={styles}
            colors={colors}
          />
        ))}

        <View style={styles.fabSlot}>
          <Pressable
            style={styles.fab}
            onPress={handleFABPress}
            android_ripple={{ color: colors.primary + '30', borderless: false }}
          >
            <Ionicons name="add" size={LAYOUT.iconXl} color={colors.background} />
          </Pressable>
        </View>

        {TAB_ITEMS.slice(2).map((tab) => (
          <TabButton
            key={tab.name}
            tab={tab}
            isActive={activeRouteName === tab.name}
            onPress={handleTabPress}
            styles={styles}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
});

const createStyles = (colors: ThemeColors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: bottomInset,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'stretch',
      height: TAB_BAR_HEIGHT,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING['0.5'],
    },
    tabLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 0.3,
    },
    tabLabelActive: {
      color: colors.text,
    },
    fabSlot: {
      width: SPACING['7'] + SPACING['5'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      width: SPACING['7'] + SPACING['3'],
      height: SPACING['7'] + SPACING['3'],
      borderRadius: RADIUS.lg,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
