import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabItem = {
  readonly name: string;
  readonly label: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly activeIcon: keyof typeof Ionicons.glyphMap;
};

type TabButtonProps = {
  tab: TabItem;
  isActive: boolean;
  onPress: (name: string) => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TAB_ITEMS: readonly TabItem[] = [
  { name: 'index',    label: 'Home',     icon: 'grid-outline',     activeIcon: 'grid'     },
  { name: 'accounts', label: 'Accounts', icon: 'wallet-outline',   activeIcon: 'wallet'   },
  { name: 'stats',    label: 'Stats',    icon: 'pulse-outline',    activeIcon: 'pulse'    },
  { name: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
] as const;

export const TAB_BAR_HEIGHT = 60;

// ─── Tab button ───────────────────────────────────────────────────────────────

const TabButton = React.memo(function TabButton({
  tab,
  isActive,
  onPress,
  colors,
  styles,
}: TabButtonProps) {
  const handlePress = useCallback(() => onPress(tab.name), [onPress, tab.name]);

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tabTouch}
      android_ripple={{ color: colors.primary + '20', borderless: true, radius: 32 }}
    >
      {/* Top indicator line */}
      <View style={[styles.topLine, isActive && { backgroundColor: colors.primary }]} />

      {/* Icon */}
      <Ionicons
        name={isActive ? tab.activeIcon : tab.icon}
        size={22}
        color={isActive ? colors.primary : colors.textMuted}
      />

      {/* Label */}
      <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.textMuted }]}>
        {tab.label}
      </Text>
    </Pressable>
  );
});

// ─── Bar ─────────────────────────────────────────────────────────────────────

export const BottomTabBar = React.memo(function BottomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  const bottomPad = useMemo(
    () => Math.max(insets.bottom, SPACING['1']),
    [insets.bottom],
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Left — Home & Accounts */}
        <View style={styles.tabGroup}>
          {TAB_ITEMS.slice(0, 2).map((tab) => (
            <TabButton
              key={tab.name}
              tab={tab}
              isActive={activeRouteName === tab.name}
              onPress={handleTabPress}
              colors={colors}
              styles={styles}
            />
          ))}
        </View>

        {/* Center FAB */}
        <View style={styles.fabWrap}>
          <Pressable
            style={styles.fab}
            onPress={handleFABPress}
            android_ripple={{ color: colors.background + '30', borderless: false }}
          >
            <Ionicons name="add" size={24} color={colors.background} />
          </Pressable>
        </View>

        {/* Right — Stats & Settings */}
        <View style={styles.tabGroup}>
          {TAB_ITEMS.slice(2).map((tab) => (
            <TabButton
              key={tab.name}
              tab={tab}
              isActive={activeRouteName === tab.name}
              onPress={handleTabPress}
              colors={colors}
              styles={styles}
            />
          ))}
        </View>
      </View>
      {/* Safe area spacer */}
      <View style={{ height: bottomPad, backgroundColor: colors.card }} />
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      height: TAB_BAR_HEIGHT,
    },
    tabGroup: {
      flex: 1,
      flexDirection: 'row',
    },
    tabTouch: {
      flex: 1,
      height: TAB_BAR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING['0.5'],
    },
    topLine: {
      position: 'absolute',
      top: 0,
      left: '20%',
      right: '20%',
      height: 2,
      borderBottomLeftRadius: RADIUS.xs,
      borderBottomRightRadius: RADIUS.xs,
      backgroundColor: 'transparent',
    },
    tabLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.1,
    },
    fabWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING['3'],
    },
    fab: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
