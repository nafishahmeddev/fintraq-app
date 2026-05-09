import { usePremium } from '@/src/providers/PremiumProvider';
import { IoniconName } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../src/components/core/ConfirmDialog';
import { Header } from '../../src/components/core/Header';
import { OptionsDialog } from '../../src/components/core/OptionsDialog';
import { db } from '../../src/db/client';
import { accounts, categories, payments } from '../../src/db/schema';
import { useSettings } from '../../src/providers/SettingsProvider';
import { Theme, useTheme } from '../../src/providers/ThemeProvider';
import { NotificationService } from '../../src/services/notification.service';

// ─── Row component ────────────────────────────────────────────────────────────
type RowType = 'nav' | 'toggle' | 'destructive';

type RowProps = {
  icon: IoniconName;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value?: string;
  type?: RowType;
  toggled?: boolean;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

function Row({ icon, iconBg, title, subtitle, value, type = 'nav', toggled, onPress, isFirst, isLast }: RowProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createRowStyles(theme), [theme]);
  const isDestructive = type === 'destructive';
  const iconColor = isDestructive ? colors.danger : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.overlay },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg || colors.overlay }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, isDestructive && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {type === 'toggle' ? (
        <View style={[styles.track, { backgroundColor: toggled ? colors.primary : colors.overlay }]}>
          <View style={[styles.thumb, toggled && styles.thumbOn]} />
        </View>
      ) : type === 'nav' ? (
        <View style={styles.navRight}>
          {value ? <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const createRowStyles = (theme: Theme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[16],
    paddingVertical: 14,
    gap: theme.spacing[12],
  },
  rowFirst: {
    paddingTop: theme.spacing[16],
  },
  rowLast: {
    paddingBottom: theme.spacing[16],
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 15,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  value: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 13,
  },
  track: {
    width: 44,
    height: 26,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: theme.radius.full,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  thumbOn: {
    transform: [{ translateX: 18 }],
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { isPremium } = usePremium();
  const { profile, updateProfile } = useSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const [showAppearanceDialog, setShowAppearanceDialog] = React.useState(false);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showEditName, setShowEditName] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [nameInput, setNameInput] = React.useState('');

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const themeLabel = { light: 'Light', dark: 'Dark', system: 'System' }[profile.theme || 'system'];
  const initials = (profile.name || '').trim().slice(0, 2).toUpperCase() || '?';

  const openEditName = useCallback(() => {
    setNameInput(profile.name || '');
    setShowEditName(true);
  }, [profile.name]);

  const saveEditName = useCallback(async () => {
    await updateProfile({ name: nameInput.trim() });
    setShowEditName(false);
  }, [nameInput, updateProfile]);

  const handleToggleReminders = useCallback(async () => {
    const next = !profile.reminderEnabled;
    if (next) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert('Permission required', 'Enable notifications in your device settings to use reminders.');
        return;
      }
    }
    await updateProfile({ reminderEnabled: next });
  }, [profile.reminderEnabled, updateProfile]);

  const onTimeChange = useCallback(async (event: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date && event.type === 'set') {
      const h = date.getHours().toString().padStart(2, '0');
      const m = date.getMinutes().toString().padStart(2, '0');
      await updateProfile({ reminderTime: `${h}:${m}` });
    }
  }, [updateProfile]);

  const runResetData = useCallback(async () => {
    try {
      await db.delete(payments);
      await db.delete(categories);
      await db.delete(accounts);
      await AsyncStorage.clear();
      Alert.alert('Wiped', 'All data cleared. Please restart the app.');
      router.replace('/(onboarding)');
    } catch {
      Alert.alert('Error', 'Failed to clear app data.');
    }
  }, [router]);

  const themeOptions = useMemo(() => [
    {
      key: 'light', label: 'Light mode', icon: 'sunny-outline' as IoniconName,
      selected: (profile.theme || 'system') === 'light',
      onPress: async () => { await updateProfile({ theme: 'light' }); }
    },
    {
      key: 'dark', label: 'Dark mode', icon: 'moon-outline' as IoniconName,
      selected: (profile.theme || 'system') === 'dark',
      onPress: async () => { await updateProfile({ theme: 'dark' }); }
    },
    {
      key: 'system', label: 'Follow system', icon: 'phone-portrait-outline' as IoniconName,
      selected: (profile.theme || 'system') === 'system',
      onPress: async () => { await updateProfile({ theme: 'system' }); }
    },
  ], [profile.theme, updateProfile]);

  const timePickerDate = useMemo(() => {
    const [h, m] = (profile.reminderTime || '09:00').split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }, [profile.reminderTime]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Settings" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile card ── */}
        <TouchableOpacity style={styles.profileCard} onPress={openEditName} activeOpacity={0.85}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name || 'Add your name'}</Text>
            <Text style={styles.profileHint}>Tap to edit</Text>
          </View>
          <View style={[styles.planBadge, { backgroundColor: isPremium ? colors.primary + '18' : colors.overlay }]}>
            {isPremium && <Ionicons name="sparkles" size={11} color={colors.primary} />}
            <Text style={[styles.planBadgeText, { color: isPremium ? colors.primary : colors.textMuted }]}>
              {isPremium ? 'Pro' : 'Free'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Subscription ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Subscription</Text>
          <View style={styles.card}>
            <Row
              icon="sparkles"
              iconBg={isPremium ? colors.primary + '20' : colors.overlay}
              title={isPremium ? 'Luno Pro · Lifetime' : 'Upgrade to Pro'}
              subtitle={isPremium ? 'Full access to all features' : 'Unlock analytics, goals, loans & more'}
              value={isPremium ? 'Active' : undefined}
              onPress={() => router.push('/premium')}
              isFirst
              isLast
            />
          </View>
        </View>

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.card}>
            <Row
              icon="contrast-outline"
              title="Appearance"
              value={themeLabel}
              onPress={() => setShowAppearanceDialog(true)}
              isFirst
              isLast
            />
          </View>
        </View>

        {/* ── Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <View style={styles.card}>
            <Row
              icon="notifications-outline"
              title="Daily reminder"
              subtitle="Get nudged to log transactions"
              type="toggle"
              toggled={profile.reminderEnabled}
              onPress={handleToggleReminders}
              isFirst
              isLast={!profile.reminderEnabled}
            />
            {profile.reminderEnabled && (
              <Row
                icon="time-outline"
                title="Reminder time"
                value={profile.reminderTime}
                onPress={() => setShowTimePicker(true)}
                isLast
              />
            )}
          </View>
        </View>

        {/* ── Manage ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Manage</Text>
          <View style={styles.card}>
            <Row icon="grid-outline" title="Categories" onPress={() => router.push('/categories')} isFirst />
            <Row icon="pie-chart-outline" title="Budgets" onPress={() => router.push('/budgets')} />
            <Row icon="sync-outline" title="Recurring" onPress={() => router.push('/recurring')} />
            <Row icon="people-outline" title="People" onPress={() => router.push('/people')} />
            <Row icon="location-outline" title="Places" onPress={() => router.push('/places')} isLast />
          </View>
        </View>

        {/* ── Danger zone ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Danger zone</Text>
          <View style={styles.card}>
            <Row
              icon="trash-bin-outline"
              title="Factory reset"
              subtitle="Wipe all data — cannot be undone"
              type="destructive"
              onPress={() => setShowResetConfirm(true)}
              isFirst
              isLast
            />
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity onLongPress={() => router.push('/developer')} activeOpacity={1}>
            <Text style={styles.footerBrand}>LUNO</Text>
          </TouchableOpacity>
          <Text style={styles.footerVersion}>v{appVersion}</Text>
          <Text style={styles.footerCopy}>All data is encrypted and stored locally.</Text>
        </View>
      </ScrollView>

      {/* ── Time picker ── */}
      {showTimePicker && (
        <DateTimePicker
          value={timePickerDate}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      {/* ── Appearance dialog ── */}
      <OptionsDialog
        visible={showAppearanceDialog}
        onClose={() => setShowAppearanceDialog(false)}
        title="Appearance"
        options={themeOptions}
      />

      {/* ── Edit name modal ── */}
      <Modal
        visible={showEditName}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowEditName(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowEditName(false)} />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Display name</Text>
              <Text style={styles.modalSub}>How you'll appear in your dashboard</Text>
              <TextInput
                style={styles.modalInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveEditName}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setShowEditName(false)} activeOpacity={0.8}>
                  <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnSave, { backgroundColor: colors.primary }]} onPress={saveEditName} activeOpacity={0.8}>
                  <Text style={[styles.btnText, { color: colors.onPrimary }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Reset confirm ── */}
      <ConfirmDialog
        visible={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Factory reset"
        message="This permanently deletes all accounts, categories, and transactions. Cannot be undone."
        confirmLabel="Wipe data"
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
  scroll: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[16],
    paddingBottom: theme.spacing[48],
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    padding: theme.spacing[20],
    gap: theme.spacing[16],
    marginBottom: theme.spacing[32],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  profileHint: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  planBadgeText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
  },

  // Sections
  section: {
    marginBottom: theme.spacing[24],
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing[8],
    paddingLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    overflow: 'hidden',
  },

  // Footer
  footer: {
    marginTop: theme.spacing[8],
    alignItems: 'center',
    gap: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  footerBrand: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 11,
    color: theme.colors.text,
    letterSpacing: 4,
  },
  footerVersion: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  footerCopy: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 11,
    color: theme.colors.textFaint,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 16,
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[32],
  },
  modalCard: {
    backgroundColor: theme.colors.floating,
    borderRadius: theme.radius['3xl'],
    padding: theme.spacing[24],
  },
  modalTitle: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 24,
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: theme.spacing[4],
  },
  modalSub: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing[20],
  },
  modalInput: {
    height: 52,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.overlay,
    paddingHorizontal: theme.spacing[16],
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.fontFamilies.sans,
    marginBottom: theme.spacing[20],
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing[12],
  },
  btnCancel: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
  },
  btnSave: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 14,
  },
});
