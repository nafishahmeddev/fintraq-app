import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePremium } from '../../providers/PremiumProvider';
import { Theme, useTheme } from '../../providers/ThemeProvider';

const PROMO_KEY = '@luno_promo_last_shown_v2';
const SHOW_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 1500;

const HIGHLIGHTS = [
  { icon: 'wallet-outline' as const, text: 'Unlimited accounts, budgets & goals' },
  { icon: 'analytics-outline' as const, text: 'Full analytics with period comparison' },
  { icon: 'search-outline' as const, text: 'Global search & advanced filters' },
];

export const PromoModal = React.memo(function PromoModal() {
  const { isPremium } = usePremium();
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPremium) return;
    let timer: ReturnType<typeof setTimeout>;

    AsyncStorage.getItem(PROMO_KEY).then((raw) => {
      const lastShown = raw ? parseInt(raw, 10) : 0;
      const shouldShow = !lastShown || Date.now() - lastShown > SHOW_INTERVAL_MS;
      if (shouldShow) {
        timer = setTimeout(() => {
          setVisible(true);
          Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]).start();
        }, SHOW_DELAY_MS);
      }
    });

    return () => clearTimeout(timer);
  }, [isPremium]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 500, duration: 280, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setVisible(false));
    AsyncStorage.setItem(PROMO_KEY, Date.now().toString());
  }, [slideAnim, fadeAnim]);

  const handleUpgrade = useCallback(() => {
    dismiss();
    setTimeout(() => router.push('/premium'), 350);
  }, [dismiss, router]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={dismiss} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={dismiss} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        <Text style={styles.kicker}>Luno Pro</Text>
        <Text style={styles.title}>The full picture,{'\n'}yours forever.</Text>
        <Text style={styles.subtitle}>One payment. No subscriptions. Permanent access to every tool.</Text>

        <View style={styles.highlights}>
          {HIGHLIGHTS.map((h) => (
            <View key={h.icon} style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <Ionicons name={h.icon} size={16} color={colors.primary} />
              </View>
              <Text style={styles.highlightText}>{h.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.85}>
          <Text style={styles.upgradeBtnText}>See upgrade options</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissBtn} onPress={dismiss} activeOpacity={0.7}>
          <Text style={styles.dismissText}>Maybe later</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius['3xl'],
    borderTopRightRadius: theme.radius['3xl'],
    padding: 28,
    paddingBottom: 52,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    alignSelf: 'center',
    marginBottom: 24,
  },
  kicker: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 36,
    lineHeight: 40,
    color: theme.colors.text,
    letterSpacing: -1.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },
  highlights: {
    gap: 12,
    marginBottom: 28,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  upgradeBtn: {
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...theme.shadow.md,
  },
  upgradeBtnText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 16,
    color: theme.colors.onPrimary,
  },
  dismissBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
