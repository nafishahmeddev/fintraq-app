import { usePremium } from '@/src/providers/PremiumProvider';
import { IoniconName } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { Header } from '../../src/components/ui/Header';
import { OptionsDialog } from '../../src/components/ui/OptionsDialog';
import { db } from '../../src/db/client';
import { accounts, categories, payments } from '../../src/db/schema';
import { useSettings } from '../../src/providers/SettingsProvider';
import { Theme, useTheme } from '../../src/providers/ThemeProvider';
import { NotificationService } from '../../src/services/notification.service';

export default function SettingsScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { isPremium, resetPremium } = usePremium();
  const { profile, updateProfile } = useSettings();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const [showAppearanceDialog, setShowAppearanceDialog] = React.useState(false);
  const [showResetConfirmDialog, setShowResetConfirmDialog] = React.useState(false);
  const [showEditNameModal, setShowEditNameModal] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [nameInput, setNameInput] = React.useState('');
  const [devClickCount, setDevClickCount] = React.useState(0);

  const themeOptions: { label: string; value: 'light' | 'dark' | 'system'; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Light mode', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark mode', value: 'dark', icon: 'moon-outline' },
    { label: 'Follow system', value: 'system', icon: 'phone-portrait-outline' },
  ];

  const handleResetData = () => {
    setShowResetConfirmDialog(true);
  };

  const runResetData = async () => {
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
  };

  const handleThemeChange = () => setShowAppearanceDialog(true);

  const openEditName = () => {
    setNameInput(profile.name || '');
    setShowEditNameModal(true);
  };

  const saveEditName = async () => {
    await updateProfile({ name: nameInput.trim() });
    setShowEditNameModal(false);
  };

  const handleToggleReminders = async () => {
    const nextState = !profile.reminderEnabled;

    if (nextState) {
      // If turning on, we must ensure permissions
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
  };

  const onTimeChange = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && event.type === 'set') {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      await updateProfile({ reminderTime: `${hours}:${minutes}` });
    }
  };

  const handleFooterClick = () => {
    const nextCount = devClickCount + 1;
    if (nextCount === 7) {
      router.push('/developer');
      setDevClickCount(0);
    } else {
      setDevClickCount(nextCount);
    }
  };

  type PreferenceRowProps = {
    icon: IoniconName;
    title: string;
    value?: string;
    subtitle?: string;
    onPress: () => void;
    destructive?: boolean;
    color?: string;
    isLast?: boolean;
  };

  const PreferenceRow = ({ icon, title, value, subtitle, onPress, destructive, color, isLast }: PreferenceRowProps) => {
    const iconColor = color || (destructive ? colors.danger : colors.text);

    return (
      <TouchableOpacity
        style={[styles.row, isLast && { borderBottomWidth: 0 }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.textDetails}>
          <Text style={[styles.rowTitle, destructive && { color: colors.danger }]}>{title}</Text>
          {subtitle && <Text style={styles.rowSubtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <View style={styles.rowRightSide}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  const activeTheme = (profile.theme || 'system').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>

      <Header title="Settings" subtitle="System preferences" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroKicker}>Device profile</Text>
              <Text style={styles.heroTitle}>App configuration</Text>
            </View>
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>Active</Text>
            </View>
          </View>

          <View style={styles.heroGrid}>
            <View style={styles.heroGridItem}>
              <Text style={styles.heroGridLabel}>Appearance</Text>
              <Text style={styles.heroGridValue}>{activeTheme}</Text>
            </View>
            <View style={styles.heroGridDivider} />
            <View style={styles.heroGridItem}>
              <Text style={styles.heroGridLabel}>Version</Text>
              <Text style={styles.heroGridValue}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Subscription</Text>
          <View style={[styles.card, isPremium && { borderColor: colors.primary, borderWidth: 1.5 }]}>
            <PreferenceRow
              icon="sparkles"
              title={isPremium ? 'Luno Pro (Lifetime)' : 'Upgrade to Pro'}
              value={isPremium ? "Active" : "Free"}
              subtitle={
                isPremium ? "Enjoying full access to all features" :
                  "Unlock advanced analytics & insights"
              }
              onPress={() => router.push('/premium')}
              color={isPremium ? colors.primary : undefined}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Features</Text>
          <View style={styles.card}>
            <PreferenceRow
              icon="people-outline"
              title="People"
              subtitle="Manage contacts & relationships"
              onPress={() => router.push('/people')}
            />
            <PreferenceRow
              icon="sync-outline"
              title="Recurring"
              subtitle="Manage automatic transactions"
              onPress={() => router.push('/recurring')}
            />
            <PreferenceRow
              icon="pie-chart-outline"
              title="Budgets"
              subtitle="Track your spending limits"
              onPress={() => router.push('/budgets')}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <PreferenceRow
              icon="person-outline"
              title="Display name"
              value={profile.name ? undefined : 'Not set'}
              subtitle={profile.name || 'Personalize your dashboard'}
              onPress={openEditName}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <View style={styles.card}>
            <PreferenceRow
              icon="notifications-outline"
              title="Daily reminder"
              value={profile.reminderEnabled ? 'On' : 'Off'}
              subtitle="Get notified to track your daily spend"
              onPress={handleToggleReminders}
            />
            <PreferenceRow
              icon="time-outline"
              title="Reminder time"
              value={profile.reminderTime}
              subtitle="Preferred time for daily alert"
              onPress={() => setShowTimePicker(true)}
              isLast
            />
          </View>
        </View>

        {showTimePicker && (() => {
          // Convert HH:mm to a Date object for the picker
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>General</Text>
          <View style={styles.card}>
            <PreferenceRow
              icon="contrast-outline"
              title="Appearance"
              value={activeTheme}
              subtitle="Dark mode or high-contrast theme"
              onPress={handleThemeChange}
            />
            <PreferenceRow
              icon="grid-outline"
              title="Categories"
              subtitle="Customize income and expense tags"
              onPress={() => router.push('/categories')}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <View style={styles.card}>
            <PreferenceRow
              icon="download-outline"
              title="Export CSV"
              subtitle="Download transactions as spreadsheet"
              onPress={() => router.push('/export')}
            />
            <PreferenceRow
              icon="cloud-outline"
              title="Backup & restore"
              subtitle="Full data backup and restore"
              onPress={() => router.push('/backup')}
            />
            <PreferenceRow
              icon="trash-bin-outline"
              title="Factory reset"
              destructive
              subtitle="Permanently wipe all local data"
              onPress={handleResetData}
              isLast
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleFooterClick} activeOpacity={1}>
            <Text style={styles.footerBrand}>LUNO / CORE</Text>
          </TouchableOpacity>
          <Text style={styles.footerCopy}>All data is encrypted and stored locally by default.</Text>

          {devClickCount > 0 && (
            <TouchableOpacity
              style={{ marginTop: 20, padding: 10 }}
              onPress={async () => {
                await resetPremium();
                Alert.alert("Premium Reset", "Account downgraded to Free.");
              }}
            >
              <Text style={{ color: colors.danger, fontFamily: theme.fontFamilies.sansSemiBold, fontSize: 10 }}>Reset subscription ({7 - devClickCount})</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <OptionsDialog
        visible={showAppearanceDialog}
        onClose={() => setShowAppearanceDialog(false)}
        title="Appearance"
        subtitle="Set your preferred interface style"
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
              <Text style={styles.modalTitle}>Display name</Text>
              <Text style={styles.modalSubtitle}>{"How you'll be greeted in the dashboard"}</Text>
              <TextInput
                style={styles.modalInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Name"
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
                  <Text style={styles.modalBtnSaveText}>Save changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={showResetConfirmDialog}
        onClose={() => setShowResetConfirmDialog(false)}
        title="Factory Reset"
        message="This operation is destructive and cannot be undone."
        confirmLabel="Wipe Data"
        destructive
        onConfirm={runResetData}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },
  heroPanel: {
    borderRadius: theme.radius['2xl'],
    padding: 24,
    backgroundColor: theme.colors.surface,
    marginBottom: 28,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroKicker: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 26,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  heroBadgeText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 9,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  heroGridItem: {
    flex: 1,
  },
  heroGridLabel: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 9,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroGridValue: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 18,
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  heroGridDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.text + '08',
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
    paddingLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginRight: 14,
  },
  textDetails: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  rowSubtitle: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rowRightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 6,
  },
  footerBrand: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.text,
    letterSpacing: 3,
  },
  footerCopy: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 200,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius['2xl'],
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 20,
  },
  modalInput: {
    height: 54,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  modalBtnCancelText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.text,
  },
  modalBtnSave: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.text,
  },
  modalBtnSaveText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.background,
  },
  devCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  devText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
});
