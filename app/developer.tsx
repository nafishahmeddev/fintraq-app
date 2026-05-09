import { ConfirmDialog } from '@/src/components/core/ConfirmDialog';
import { Header } from '@/src/components/core/Header';
import { usePremium } from '@/src/providers/PremiumProvider';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { NotificationService } from '@/src/services/notification.service';
import { toErrorMessage } from '@/src/utils/errors';
import { seedDummyData } from '@/src/utils/seed';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React from 'react';
import { Alert, DevSettings, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DeveloperScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { devOverride, setDevOverride } = usePremium();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [showSeedConfirm, setShowSeedConfirm] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [scheduledNotifs, setScheduledNotifs] = React.useState<Notifications.NotificationRequest[]>([]);

  const fetchScheduled = React.useCallback(async () => {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    setScheduledNotifs(list);
  }, []);

  React.useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const handleRunSeed = async () => {
    try {
      setIsSeeding(true);
      const count = await seedDummyData();
      Alert.alert(
        "Success",
        `Generated ${count} transactions. The app will now reload to sync the UI.`,
        [{ text: "OK", onPress: () => DevSettings.reload() }]
      );
      setShowSeedConfirm(false);
    } catch (e) {
      Alert.alert("Error", toErrorMessage(e, "Failed to generate seed data."));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <Header title="Developer" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRO ENTITLEMENTS</Text>
          <View style={styles.card}>
            <View style={styles.overrideHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.textDetails}>
                <Text style={styles.rowTitle}>Premium Bypass</Text>
                <Text style={styles.rowSubtitle}>Force entitlement state for testing</Text>
              </View>
            </View>

            <View style={styles.tripleButtonGroup}>
              <TouchableOpacity
                style={[styles.smallBtn, devOverride === 'FORCED_ON' && { backgroundColor: colors.text, borderColor: colors.text }]}
                onPress={() => setDevOverride('FORCED_ON')}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnLabel, { color: devOverride === 'FORCED_ON' ? colors.background : colors.textMuted }]}>ON</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallBtn, devOverride === 'FORCED_OFF' && { backgroundColor: colors.text, borderColor: colors.text }]}
                onPress={() => setDevOverride('FORCED_OFF')}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnLabel, { color: devOverride === 'FORCED_OFF' ? colors.background : colors.textMuted }]}>OFF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallBtn, devOverride === 'DEFAULT' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setDevOverride('DEFAULT')}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnLabel, { color: devOverride === 'DEFAULT' ? colors.background : colors.text }]}>SYSTEM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA UTILITIES</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => setShowSeedConfirm(true)} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="flask-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.textDetails}>
                <Text style={styles.rowTitle}>Seed Dummy Data</Text>
                <Text style={styles.rowSubtitle}>Generate 12 months of test history</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATION DEBUGGER</Text>
          <View style={styles.card}>
            {scheduledNotifs.length === 0 ? (
              <View style={styles.row}>
                <Text style={styles.rowSubtitle}>No active schedules found.</Text>
              </View>
            ) : (
              scheduledNotifs.map((n, i) => (
                <View key={n.identifier} style={[styles.infoRow, i === scheduledNotifs.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{n.content.title}</Text>
                    <Text style={styles.rowSubtitle}>{JSON.stringify(n.trigger)}</Text>
                  </View>
                </View>
              ))
            )}
            <TouchableOpacity
              style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border + '15' }]}
              onPress={() => {
                NotificationService.triggerInstantNotification();
                Alert.alert("Test Notification", "An instant notification has been queued.");
              }}
            >
              <Text style={[styles.rowTitle, { fontSize: 13, color: colors.primary }]}>TRIGGER SAMPLE NOTIFICATION</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border + '15' }]}
              onPress={fetchScheduled}
            >
              <Text style={[styles.rowTitle, { fontSize: 13, color: colors.primary }]}>REFRESH SCHEDULES</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SYSTEM INFO</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Environment</Text>
              <Text style={styles.infoValue}>{__DEV__ ? 'DEVELOPMENT' : 'PRODUCTION'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoValue}>{process.env.EXPO_PUBLIC_PLATFORM || 'native'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>LUNO / DEV_TOOLS</Text>
          <Text style={styles.footerCopy}>INTERNAL TOOLS FOR DEBUGGING AND TESTING ONLY.</Text>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showSeedConfirm}
        onClose={() => setShowSeedConfirm(false)}
        title="Seed Test Data"
        message="This will add 12 months of transactions to your default account. Are you sure?"
        confirmLabel="Generate"
        isLoading={isSeeding}
        onConfirm={handleRunSeed}
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
  overrideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 10,
  },
  tripleButtonGroup: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  smallBtn: {
    flex: 1,
    height: 36,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#00000010',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000005',
  },
  btnLabel: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 0.5,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text + '08',
  },
  infoLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
  footer: {
    marginTop: 48,
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
});
