import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Remove old StyleSheet imports
    content = re.sub(r'import\s+{[^}]*StyleSheet[^}]*}\s+from\s+[\'"]react-native[\'"];?\n?', lambda m: m.group(0).replace('StyleSheet,', '').replace('StyleSheet', '').replace('import {  } from \'react-native\';\n', ''), content)
    content = re.sub(r'import\s+StyleSheet\s+from\s+[\'"]react-native[\'"];?\n?', '', content)

    # Remove createStyles
    content = re.sub(r'const\s+createStyles\s*=\s*\([^)]*\)\s*=>\s*StyleSheet\.create\({.*?}\);?\n*', '', content, flags=re.DOTALL)
    content = re.sub(r'const\s+styles\s*=\s*StyleSheet\.create\({.*?}\);?\n*', '', content, flags=re.DOTALL)

    # Convert to tailwind
    if 'ExportScreen' in filepath:
        # Hardcode the tailwind version since we did it manually before
        content = """import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/ui/Header';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { useCsvExport } from '@/src/features/export/api/csv-export.service';
import { useSettings } from '@/src/providers/SettingsProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { Box, HStack, VStack, Pressable, Text, cn } from '@/src/components/ui';

export function ExportScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { profile } = useSettings();
  const { data: accounts } = useAccounts();
  const { generateCsv, isExporting } = useCsvExport();

  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('all');
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [includeTransfers, setIncludeTransfers] = useState(false);

  const handleAccountToggle = (id: number) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    try {
      if (exportFormat === 'csv') {
        await generateCsv({
          dateRange,
          accountIds: selectedAccounts.length > 0 ? selectedAccounts : undefined,
          includeTransfers,
        });
      } else {
        Alert.alert('JSON Export', 'This feature is coming soon.');
      }
    } catch (error) {
      Alert.alert('Export Failed', 'There was an error exporting your data.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BlurBackground />
      <Header title="Export Data" showBack />

      <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>

        {/* Date Range */}
        <VStack className="mb-6">
          <Text className="font-semibold text-xs text-text-muted uppercase tracking-widest mb-3">Date Range</Text>
          <VStack className="bg-surface rounded-2xl border border-border overflow-hidden">
            {[
              { id: 'all', label: 'All time' },
              { id: 'this_month', label: 'This month' },
              { id: 'last_month', label: 'Last month' },
              { id: 'this_year', label: 'This year' }
            ].map((option, index, arr) => (
              <Pressable
                key={option.id}
                className={cn(
                  "flex-row items-center justify-between p-4",
                  index !== arr.length - 1 && "border-b border-border"
                )}
                onPress={() => setDateRange(option.id as any)}
              >
                <Text className="font-medium text-text text-[15px]">{option.label}</Text>
                {dateRange === option.id && (
                  <Ionicons name="checkmark" size={20} color={isDark ? '#B8D641' : '#a6c13a'} />
                )}
              </Pressable>
            ))}
          </VStack>
        </VStack>

        {/* Format */}
        <VStack className="mb-6">
          <Text className="font-semibold text-xs text-text-muted uppercase tracking-widest mb-3">Format</Text>
          <HStack className="space-x-3">
            {[
              { id: 'csv', label: 'CSV', desc: 'Best for spreadsheets' },
              { id: 'json', label: 'JSON', desc: 'Best for developers' }
            ].map((format) => (
              <Pressable
                key={format.id}
                className={cn(
                  "flex-1 p-4 rounded-2xl border",
                  exportFormat === format.id ? "bg-primary/10 border-primary" : "bg-surface border-border"
                )}
                onPress={() => setExportFormat(format.id as any)}
              >
                <Text className={cn(
                  "font-semibold text-base mb-1",
                  exportFormat === format.id ? "text-primary" : "text-text"
                )}>
                  {format.label}
                </Text>
                <Text className={cn(
                  "font-regular text-xs",
                  exportFormat === format.id ? "text-primary/80" : "text-text-muted"
                )}>
                  {format.desc}
                </Text>
              </Pressable>
            ))}
          </HStack>
        </VStack>

        {/* Accounts (Optional) */}
        {accounts && accounts.length > 0 && (
          <VStack className="mb-6">
            <Text className="font-semibold text-xs text-text-muted uppercase tracking-widest mb-3">Accounts (Optional)</Text>
            <Text className="font-regular text-sm text-text-muted mb-3">
              Leave all unselected to export data from all accounts.
            </Text>
            <VStack className="bg-surface rounded-2xl border border-border overflow-hidden">
              {accounts.map((account, index) => {
                const isSelected = selectedAccounts.includes(account.id);
                return (
                  <Pressable
                    key={account.id}
                    className={cn(
                      "flex-row items-center justify-between p-4",
                      index !== accounts.length - 1 && "border-b border-border"
                    )}
                    onPress={() => handleAccountToggle(account.id)}
                  >
                    <HStack className="items-center space-x-3">
                      <Box className="w-8 h-8 rounded-full bg-background border border-border items-center justify-center">
                        <Ionicons name="wallet-outline" size={16} color={isDark ? '#fbfff3' : '#000100'} />
                      </Box>
                      <Text className="font-medium text-text text-[15px]">{account.name}</Text>
                    </HStack>
                    <Box className={cn(
                      "w-6 h-6 rounded-full border items-center justify-center",
                      isSelected ? "bg-primary border-primary" : "border-text-muted/30"
                    )}>
                      {isSelected && <Ionicons name="checkmark" size={14} color={isDark ? '#000100' : '#F6FFF9'} />}
                    </Box>
                  </Pressable>
                );
              })}
            </VStack>
          </VStack>
        )}

        {/* Options */}
        <VStack className="mb-8">
          <Text className="font-semibold text-xs text-text-muted uppercase tracking-widest mb-3">Options</Text>
          <VStack className="bg-surface rounded-2xl border border-border overflow-hidden">
            <HStack className="items-center justify-between p-4">
              <VStack className="flex-1 pr-4">
                <Text className="font-medium text-text text-[15px] mb-0.5">Include Transfers</Text>
                <Text className="font-regular text-xs text-text-muted">Export internal account transfers</Text>
              </VStack>
              <Switch
                value={includeTransfers}
                onValueChange={setIncludeTransfers}
                trackColor={{ false: isDark ? '#1f2b1f' : '#dbead5', true: isDark ? '#B8D641' : '#a6c13a' }}
                thumbColor={isDark ? '#fbfff3' : '#F6FFF9'}
              />
            </HStack>
          </VStack>
        </VStack>

        <Box className="pb-12">
          <Button
            title="Export Data"
            icon="download-outline"
            onPress={handleExport}
            isLoading={isExporting}
            size="lg"
          />
        </Box>

      </ScrollView>
    </SafeAreaView>
  );
}
"""
    elif 'BackupScreen' in filepath:
        content = """import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Header } from '@/src/components/ui/Header';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';
import { BackupService } from '@/src/features/backup/api/backup.service';
import { useTheme } from '@/src/providers/ThemeProvider';
import { Box, HStack, VStack, Pressable, Text, cn } from '@/src/components/ui';

export function BackupScreen() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportedData, setExportedData] = useState<{ uri: string; filename: string } | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<string | null>(null);
  const [backupSummary, setBackupSummary] = useState<any | null>(null);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await BackupService.exportDatabase();
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

  const handleShare = useCallback(async () => {
    if (!exportedData) return;

    try {
      await BackupService.shareBackup(exportedData.uri);
      setShowExportOptions(false);
      setExportedData(null);
    } catch (error) {
      Alert.alert('Share Failed', 'Failed to share the backup file.');
    }
  }, [exportedData]);

  const handleSaveToFolder = useCallback(async () => {
    if (!exportedData) return;

    try {
      await BackupService.saveToFolder(exportedData.uri, exportedData.filename);
      setShowExportOptions(false);
      setExportedData(null);
      Alert.alert('Success', 'Backup saved successfully.');
    } catch (error) {
      Alert.alert('Save Failed', 'Failed to save the backup file.');
    }
  }, [exportedData]);

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      const result = await BackupService.pickBackupFile();

      if (!result) {
        setIsImporting(false);
        return;
      }

      setSelectedBackupFile(result.uri);
      setBackupSummary(result.summary);
      setShowRestoreDialog(true);

    } catch (error) {
      Alert.alert(
        'Import Failed',
        error instanceof Error ? error.message : 'Failed to read backup file'
      );
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleConfirmRestore = useCallback(async () => {
    if (!selectedBackupFile) return;

    setIsImporting(true);
    try {
      await BackupService.restoreDatabase(selectedBackupFile);

      Alert.alert(
        'Restore Complete',
        'Your data has been successfully restored.',
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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BlurBackground />

      <Header title="Backup & Restore" subtitle="Data management" showBack />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <PremiumGuard label="Data Backup">
          <VStack className="bg-surface rounded-[20px] border border-border p-6 items-center mb-7">
            <Box className="w-16 h-16 rounded-[24px] bg-primary/15 items-center justify-center mb-4">
              <Ionicons name="shield-checkmark" size={32} color={isDark ? '#B8D641' : '#a6c13a'} />
            </Box>
            <Text className="font-heading text-xl text-text mb-2">Protect Your Data</Text>
            <Text className="font-regular text-sm text-text-muted text-center leading-5">
              Create backups of your financial data. Save to device storage or share to cloud storage for safekeeping.
            </Text>
          </VStack>

          <VStack className="mb-6">
            <Text className="font-semibold text-[10px] text-text-muted tracking-widest uppercase mb-3 pl-1">BACKUP OPTIONS</Text>
            <VStack className="bg-surface rounded-xl border border-border overflow-hidden">
              <Pressable
                className="flex-row items-center p-4"
                onPress={handleExport}
                disabled={isExporting || isImporting}
              >
                <Box className="w-11 h-11 rounded-lg items-center justify-center mr-3.5 bg-primary/15">
                  {isExporting ? (
                    <ActivityIndicator size="small" color={isDark ? '#B8D641' : '#a6c13a'} />
                  ) : (
                    <Ionicons name="download-outline" size={20} color={isDark ? '#B8D641' : '#a6c13a'} />
                  )}
                </Box>
                <VStack className="flex-1">
                  <Text className="font-semibold text-base text-text mb-0.5">Export Data</Text>
                  <Text className="font-regular text-[13px] text-text-muted">Create a backup file</Text>
                </VStack>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#b2bb8b' : '#737a5f'} />
              </Pressable>

              <Box className="h-px bg-border ml-[74px]" />

              <Pressable
                className="flex-row items-center p-4"
                onPress={handleImport}
                disabled={isExporting || isImporting}
              >
                <Box className="w-11 h-11 rounded-lg items-center justify-center mr-3.5 bg-success/15">
                  {isImporting ? (
                    <ActivityIndicator size="small" color={isDark ? '#6BD498' : '#43B875'} />
                  ) : (
                    <Ionicons name="cloud-download-outline" size={20} color={isDark ? '#6BD498' : '#43B875'} />
                  )}
                </Box>
                <VStack className="flex-1">
                  <Text className="font-semibold text-base text-text mb-0.5">Restore Data</Text>
                  <Text className="font-regular text-[13px] text-text-muted">Import from a backup file</Text>
                </VStack>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#b2bb8b' : '#737a5f'} />
              </Pressable>
            </VStack>
          </VStack>

          <VStack className="mb-6">
            <Text className="font-semibold text-[10px] text-text-muted tracking-widest uppercase mb-3 pl-1">INFORMATION</Text>
            <VStack className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <HStack className="items-center space-x-3">
                <Ionicons name="document-text-outline" size={16} color={isDark ? '#b2bb8b' : '#737a5f'} />
                <Text className="font-regular text-sm text-text-muted">Format: JSON (human-readable)</Text>
              </HStack>
              <HStack className="items-center space-x-3">
                <Ionicons name="folder-open-outline" size={16} color={isDark ? '#b2bb8b' : '#737a5f'} />
                <Text className="font-regular text-sm text-text-muted">
                  {Platform.OS === 'ios'
                    ? 'Save to Files app or Share to other apps'
                    : 'Save to any folder or Share to apps'}
                </Text>
              </HStack>
              <HStack className="items-center space-x-3">
                <Ionicons name="lock-closed-outline" size={16} color={isDark ? '#b2bb8b' : '#737a5f'} />
                <Text className="font-regular text-sm text-text-muted">Not encrypted - keep files secure</Text>
              </HStack>
            </VStack>
          </VStack>

          <HStack className="items-start space-x-3 bg-danger/10 rounded-lg border border-danger/25 p-4 mt-2">
            <Ionicons name="warning-outline" size={20} color={isDark ? '#EF4444' : '#DC2626'} />
            <Text className="flex-1 font-regular text-[13px] text-danger leading-tight">
              Restoring will replace all existing data. This action cannot be undone.
            </Text>
          </HStack>
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
            label: Platform.OS === 'ios' ? 'Save to Files' : 'Save to Folder',
            icon: 'folder-outline',
            selected: false,
            onPress: handleSaveToFolder,
          },
          {
            key: 'share',
            label: 'Share to Apps',
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
"""

    with open(filepath, 'w') as f:
        f.write(content)

process_file('src/features/export/screens/ExportScreen.tsx')
process_file('src/features/backup/screens/BackupScreen.tsx')
