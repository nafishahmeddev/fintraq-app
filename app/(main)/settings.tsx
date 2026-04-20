import { usePremium } from '@/src/providers/PremiumProvider';
import { IoniconName } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { Header } from '../../src/components/ui/Header';
import { OptionsDialog } from '../../src/components/ui/OptionsDialog';
import { db } from '../../src/db/client';
import { accounts, categories, payments } from '../../src/db/schema';
import { useSettings } from '../../src/providers/SettingsProvider';
import { useTheme } from '../../src/providers/ThemeProvider';
import { NotificationService } from '../../src/services/notification.service';
import { ThemeColors } from '../../src/theme/colors';
import { LAYOUT, radius, spacing } from '../../src/theme/tokens';
import { TYPOGRAPHY } from '../../src/theme/typography';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { isPremium } = usePremium();
  const { profile, updateProfile } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [showAppearanceDialog, setShowAppearanceDialog] = useState(false);
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [devClickCount, setDevClickCount] = useState(0);

  const themeOptions: { label: string; value: 'light' | 'dark' | 'system'; icon: IoniconName }[] = [
    { label: 'Light Mode', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark Mode', value: 'dark', icon: 'moon-outline' },
    { label: 'Follow System', value: 'system', icon: 'phone-portrait-outline' },
  ];

  const handleResetData = useCallback(() => {
    setShowResetConfirmDialog(true);
  }, []);

  const runResetData = useCallback(async () => {
    try {
      await db.delete(payments);
      await db.delete(categories);
      await db.delete(accounts);
      await AsyncStorage.clear();
      Alert.alert("Wipe Complete", "Application state has been purged. Please restart the app.");
      router.replace('/(onboarding)');
    } catch {
      Alert.alert("Critical Error", "Failed to clear physical storage.");
    }
  }, [router]);

  const handleThemeChange = useCallback(() => setShowAppearanceDialog(true), []);

  const openEditName = useCallback(() => {
    setNameInput(profile.name || '');
    setShowEditNameModal(true);
  }, [profile.name]);

  const saveEditName = useCallback(async () => {
    await updateProfile({ name: nameInput.trim() });
    setShowEditNameModal(false);
  }, [nameInput, updateProfile]);

  const handleToggleReminders = useCallback(async () => {
    const nextState = !profile.reminderEnabled;

    if (nextState) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Luno needs notification access to send reminders. Please enable this in your device settings."
        );
        return;
      }
    }

    await updateProfile({ reminderEnabled: nextState });
  }, [profile.reminderEnabled, updateProfile]);

  const onTimeChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && event.type === 'set') {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      updateProfile({ reminderTime: `${hours}:${minutes}` });
    }
  }, [updateProfile]);

  const handleFooterClick = useCallback(() => {
    const nextCount = devClickCount + 1;
    if (nextCount === 7) {
      router.push('/developer');
      setDevClickCount(0);
    } else {
      setDevClickCount(nextCount);
    }
  }, [devClickCount, router]);

  const activeTheme = useMemo(() => (profile.theme || 'system').toUpperCase(), [profile.theme]);

  return (
    <View style={styles.container}>
      <Header title="Settings" subtitle="Customize your experience" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name || 'Set your name'}</Text>
            <Text style={styles.profileMeta}>Personalize your experience</Text>
          </View>
          <TouchableOpacity style={styles.profileEditBtn} onPress={openEditName} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeTheme}</Text>
            <Text style={styles.statLabel}>Theme</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
            <Text style={styles.statLabel}>Version</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: isPremium ? colors.primary : colors.textMuted }]}>
              {isPremium ? 'PRO' : 'FREE'}
            </Text>
            <Text style={styles.statLabel}>Plan</Text>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
          <TouchableOpacity 
            style={[styles.featureCard, isPremium && styles.featureCardActive]}
            onPress={() => router.push('/premium')}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, { backgroundColor: isPremium ? colors.primary + '20' : colors.card }]}>
              <Ionicons name="sparkles" size={22} color={isPremium ? colors.primary : colors.textMuted} />
            </View>
            <View style={styles.featureBody}>
              <Text style={styles.featureTitle}>
                {isPremium ? 'Luno Pro Active' : 'Upgrade to Pro'}
              </Text>
              <Text style={styles.featureSubtitle}>
                {isPremium ? 'Full access to all features' : 'Unlock advanced analytics & insights'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.card}>
            <SettingRow
              icon="contrast-outline"
              title="Appearance"
              value={activeTheme}
              onPress={handleThemeChange}
              colors={colors}
            />
            <SettingRow
              icon="notifications-outline"
              title="Daily Reminder"
              value={profile.reminderEnabled ? profile.reminderTime : 'OFF'}
              onPress={profile.reminderEnabled ? () => setShowTimePicker(true) : handleToggleReminders}
              colors={colors}
              isLast={false}
            />
            <SettingRow
              icon="grid-outline"
              title="Categories"
              onPress={() => router.push('/categories')}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA</Text>
          <View style={styles.card}>
            <SettingRow
              icon="download-outline"
              title="Export CSV"
              onPress={() => router.push('/export')}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {/* About Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleFooterClick} activeOpacity={1}>
            <Text style={styles.footerBrand}>LUNO</Text>
          </TouchableOpacity>
          <Text style={styles.footerCopy}>Local-first financial tracking</Text>
        </View>
      </ScrollView>

      {/* Appearance Dialog */}
      <OptionsDialog
        visible={showAppearanceDialog}
        onClose={() => setShowAppearanceDialog(false)}
        title="Appearance"
        subtitle="Choose your preferred theme"
        options={themeOptions.map((option) => ({
          key: option.value,
          label: option.label,
          icon: option.icon,
          selected: (profile.theme || 'system') === option.value,
          onPress: async () => {
            await updateProfile({ theme: option.value });
          },
        }))}
      />

      {/* Time Picker */}
      {showTimePicker && (() => {
        const [h, m] = profile.reminderTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);

        return (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        );
      })()}

      {/* Edit Name Modal */}
      <Modal
        visible={showEditNameModal}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowEditNameModal(false)} />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Display Name</Text>
              <Text style={styles.modalSubtitle}>How you{"'"}ll be greeted in the dashboard</Text>
              <TextInput
                style={styles.modalInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveEditName}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowEditNameModal(false)} activeOpacity={0.8}>
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSave} onPress={saveEditName} activeOpacity={0.8}>
                  <Text style={styles.modalBtnSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reset Confirm Dialog */}
      <ConfirmDialog
        visible={showResetConfirmDialog}
        onClose={() => setShowResetConfirmDialog(false)}
        title="Factory Reset"
        message="This operation is destructive and cannot be undone."
        confirmLabel="Wipe Data"
        destructive
        onConfirm={runResetData}
      />
    </View>
  );
}

// Setting Row Component
const SettingRow = React.memo(function SettingRow({
  icon,
  title,
  value,
  onPress,
  colors,
  isLast = false,
}: {
  icon: IoniconName;
  title: string;
  value?: string;
  onPress: () => void;
  colors: ThemeColors;
  isLast?: boolean;
}) {
  const styles = useMemo(() => createRowStyles(colors), [colors]);

  return (
    <TouchableOpacity style={[styles.row, isLast && styles.rowLast]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

const createRowStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('3.5'),
      paddingHorizontal: spacing('4'),
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: radius('md'),
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing('3'),
    },
    rowTitle: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 15,
      color: colors.text,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    rowValue: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 13,
      color: colors.textMuted,
    },
  });

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: StatusBar.currentHeight,
    },
    scrollContent: {
      paddingHorizontal: LAYOUT.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('12'),
    },

    // Profile Card
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      marginBottom: spacing('4'),
    },
    profileIcon: {
      width: 52,
      height: 52,
      borderRadius: radius('lg'),
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing('4'),
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 18,
      color: colors.text,
      marginBottom: spacing('0.5'),
    },
    profileMeta: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    profileEditBtn: {
      width: 36,
      height: 36,
      borderRadius: radius('full'),
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Stats Row
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingVertical: spacing('4'),
      paddingHorizontal: spacing('3'),
      marginBottom: spacing('6'),
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontFamily: TYPOGRAPHY.fonts.monoBold,
      fontSize: 14,
      color: colors.text,
      marginBottom: spacing('1'),
    },
    statLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
    },

    // Section
    section: {
      marginBottom: spacing('6'),
    },
    sectionLabel: {
      fontFamily: TYPOGRAPHY.fonts.bold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 2,
      marginBottom: spacing('3'),
      paddingLeft: spacing('1'),
    },

    // Card
    card: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },

    // Feature Card (Pro card)
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('3'),
    },
    featureCardActive: {
      backgroundColor: colors.card,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: radius('lg'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureBody: {
      flex: 1,
    },
    featureTitle: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing('0.5'),
    },
    featureSubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },

    // Footer
    footer: {
      marginTop: spacing('8'),
      alignItems: 'center',
      gap: spacing('2'),
    },
    footerBrand: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 12,
      color: colors.text,
      letterSpacing: 3,
    },
    footerCopy: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      paddingHorizontal: spacing('8'),
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('6'),
    },
    modalTitle: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 22,
      color: colors.text,
      marginBottom: spacing('1'),
    },
    modalSubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: spacing('5'),
    },
    modalInput: {
      height: 52,
      borderRadius: radius('lg'),
      backgroundColor: colors.card,
      paddingHorizontal: spacing('4'),
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing('5'),
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    modalBtnCancel: {
      flex: 1,
      height: 48,
      borderRadius: radius('lg'),
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBtnCancelText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 15,
      color: colors.text,
    },
    modalBtnSave: {
      flex: 1,
      height: 48,
      borderRadius: radius('lg'),
      backgroundColor: colors.text,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBtnSaveText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 15,
      color: colors.background,
    },
  });
