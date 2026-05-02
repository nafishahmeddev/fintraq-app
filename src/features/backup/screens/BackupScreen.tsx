import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Header } from '@/src/components/ui/Header';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackupService } from '../api/backup.service';

export function BackupScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportedData, setExportedData] = useState<{ content: string; filename: string } | null>(null);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [backupSummary, setBackupSummary] = useState<{
    version: string;
    exportedAt: string;
    accountsCount: number;
    categoriesCount: number;
    transactionsCount: number;
    hasProfile: boolean;
  } | null>(null);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const result = await BackupService.createBackup();
      setExportedData(result);
      setShowExportOptions(true);
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to create backup'
      );
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleSaveToFolder = useCallback(async () => {
    if (!exportedData) return;

    setShowExportOptions(false);

    try {
      await BackupService.saveToFolder(exportedData.content, exportedData.filename);
    } catch (error) {
      Alert.alert(
        'Save Failed',
        error instanceof Error ? error.message : 'Failed to save backup'
      );
    } finally {
      setExportedData(null);
    }
  }, [exportedData]);

  const handleShare = useCallback(async () => {
    if (!exportedData) return;

    setShowExportOptions(false);

    try {
      await BackupService.shareFile(exportedData.content, exportedData.filename);
    } catch (error) {
      Alert.alert(
        'Share Failed',
        error instanceof Error ? error.message : 'Failed to share backup'
      );
    } finally {
      setExportedData(null);
    }
  }, [exportedData]);

  const handleImport = useCallback(async () => {
    try {
      setIsImporting(true);
      const file = await BackupService.pickBackupFile();

      if (!file) {
        setIsImporting(false);
        return;
      }

      const summary = await BackupService.getBackupSummary(file);
      setBackupSummary(summary);
      setSelectedBackupFile(file);
      setShowRestoreDialog(true);
    } catch (error) {
      Alert.alert(
        'Invalid Backup',
        error instanceof Error ? error.message : 'Failed to read backup file'
      );
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleConfirmRestore = useCallback(async () => {
    if (!selectedBackupFile) return;

    try {
      setIsImporting(true);
      setShowRestoreDialog(false);

      const data = await BackupService.readBackupFile(selectedBackupFile);
      await BackupService.restoreBackup(data);

      Alert.alert(
        'Restore Complete',
        'Your data has been restored successfully. The app will now reload.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(main)'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        error instanceof Error ? error.message : 'Failed to restore backup'
      );
    } finally {
      setIsImporting(false);
      setSelectedBackupFile(null);
      setBackupSummary(null);
    }
  }, [selectedBackupFile, router]);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      <Header title="Backup & Restore" subtitle="Data management" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumGuard label="Data Backup">
          <View style={styles.heroCard}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Protect your data</Text>
            <Text style={styles.heroSubtitle}>
              Create backups of your financial data. Save to device storage or share to cloud storage for safekeeping.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Backup options</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleExport}
                disabled={isExporting || isImporting}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                  {isExporting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                  )}
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Export data</Text>
                  <Text style={styles.actionSubtitle}>Create a backup file</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleImport}
                disabled={isExporting || isImporting}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.success + '15' }]}>
                  {isImporting ? (
                    <ActivityIndicator size="small" color={colors.success} />
                  ) : (
                    <Ionicons name="cloud-download-outline" size={20} color={colors.success} />
                  )}
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Restore data</Text>
                  <Text style={styles.actionSubtitle}>Import from a backup file</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                <Text style={styles.infoText}>Format: JSON (human-readable)</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="folder-open-outline" size={16} color={colors.textMuted} />
                <Text style={styles.infoText}>
                  {Platform.OS === 'ios'
                    ? 'Save to Files app or share to other apps'
                    : 'Save to any folder or share to apps'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
                <Text style={styles.infoText}>Not encrypted - keep files secure</Text>
              </View>
            </View>
          </View>

          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={20} color={colors.danger} />
            <Text style={styles.warningText}>
              Restoring will replace all existing data. This action cannot be undone.
            </Text>
          </View>
        </PremiumGuard>
      </ScrollView>

      <OptionsDialog
        visible={showExportOptions}
        onClose={() => {
          setShowExportOptions(false);
          setExportedData(null);
        }}
        title="Export Complete"
        subtitle={exportedData ? `File: ${exportedData.filename}` : 'Choose how to save your backup'}
        options={[
          {
            key: 'save',
            label: Platform.OS === 'ios' ? 'Save to Files' : 'Save to folder',
            icon: 'folder-outline',
            selected: false,
            onPress: handleSaveToFolder,
          },
          {
            key: 'share',
            label: 'Share to apps',
            icon: 'share-outline',
            selected: false,
            onPress: handleShare,
          },
        ]}
      />

      <ConfirmDialog
        visible={showRestoreDialog}
        onClose={() => {
          setShowRestoreDialog(false);
          setSelectedBackupFile(null);
          setBackupSummary(null);
        }}
        title="Confirm Restore"
        confirmLabel="Restore"
        destructive
        message={
          backupSummary
            ? `This backup contains:\n\n` +
            `• ${backupSummary.accountsCount} account${backupSummary.accountsCount !== 1 ? 's' : ''}\n` +
            `• ${backupSummary.categoriesCount} categor${backupSummary.categoriesCount !== 1 ? 'ies' : 'y'}\n` +
            `• ${backupSummary.transactionsCount} transaction${backupSummary.transactionsCount !== 1 ? 's' : ''}\n` +
            `• ${backupSummary.hasProfile ? 'Settings & profile' : 'No settings'}\n\n` +
            `Exported: ${formatDate(backupSummary.exportedAt)}\n\n` +
            `Your current data will be replaced.`
            : 'Are you sure you want to restore this backup?'
        }
        onConfirm={handleConfirmRestore}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 48,
    },
    heroCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 24,
      alignItems: 'center',
      marginBottom: 32,
    },
    heroIconContainer: {
      width: 64,
      height: 64,
      borderRadius: theme.radius['2xl'],
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    heroTitle: {
      fontFamily: theme.fontFamilies.heading,
      fontSize: 20,
      color: theme.colors.text,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    section: {
      marginBottom: 24,
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
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    actionTextContainer: {
      flex: 1,
    },
    actionTitle: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 2,
    },
    actionSubtitle: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginLeft: 74,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 16,
      gap: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoText: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: theme.colors.danger + '10',
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.danger + '25',
      padding: 16,
      marginTop: 8,
    },
    warningText: {
      flex: 1,
      fontFamily: theme.fontFamilies.sans,
      fontSize: 13,
      color: theme.colors.danger,
      lineHeight: 18,
    },
  });
