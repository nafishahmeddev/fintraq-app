import { Header } from '@/src/components/ui/Header';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { CsvExportService, ExportDateRange } from '../api/csv-export.service';

export function ExportScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accountsQuery = useAccounts();

  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [customRange, setCustomRange] = useState<ExportDateRange | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'ALL' | 'CR' | 'DR'>('ALL');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportedData, setExportedData] = useState<{ content: string; filename: string } | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const presets = useMemo(() => CsvExportService.getDateRangePresets(), []);

  const effectiveDateRange = useMemo(() => {
    if (customRange) return customRange;
    return presets[selectedPreset].getRange();
  }, [customRange, selectedPreset, presets]);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const handlePresetSelect = useCallback((index: number) => {
    setSelectedPreset(index);
    setCustomRange(null);
  }, []);

  const handleStartDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(false);
    if (date && event.type === 'set') {
      setCustomRange(prev => ({
        startDate: date,
        endDate: prev?.endDate || new Date(),
      }));
    }
  }, []);

  const handleEndDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(false);
    if (date && event.type === 'set') {
      date.setHours(23, 59, 59, 999);
      setCustomRange(prev => ({
        startDate: prev?.startDate || new Date(),
        endDate: date,
      }));
    }
  }, []);

  // Update preview count when filters change
  useEffect(() => {
    let mounted = true;
    const options = {
      dateRange: effectiveDateRange,
      ...(selectedAccountId !== null && { accountId: selectedAccountId }),
      ...(selectedType !== 'ALL' && { type: selectedType as 'CR' | 'DR' }),
    };
    CsvExportService.getTransactionCount(options).then(count => {
      if (mounted) setPreviewCount(count);
    });
    return () => { mounted = false; };
  }, [effectiveDateRange, selectedAccountId, selectedType]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);

      const options = {
        dateRange: effectiveDateRange,
        ...(selectedAccountId !== null && { accountId: selectedAccountId }),
        ...(selectedType !== 'ALL' && { type: selectedType as 'CR' | 'DR' }),
      };

      const result = await CsvExportService.exportToCsv(options);
      setExportedData(result);
      setShowExportOptions(true);
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export transactions'
      );
    } finally {
      setIsExporting(false);
    }
  }, [effectiveDateRange, selectedAccountId, selectedType]);

  const handleSaveToFolder = useCallback(async () => {
    if (!exportedData) return;

    setShowExportOptions(false);

    try {
      await CsvExportService.saveToFolder(exportedData.content, exportedData.filename);
    } catch (error) {
      Alert.alert(
        'Save Failed',
        error instanceof Error ? error.message : 'Failed to save CSV'
      );
    } finally {
      setExportedData(null);
    }
  }, [exportedData]);

  const handleShare = useCallback(async () => {
    if (!exportedData) return;

    setShowExportOptions(false);

    try {
      await CsvExportService.shareFile(exportedData.content, exportedData.filename);
    } catch (error) {
      Alert.alert(
        'Share Failed',
        error instanceof Error ? error.message : 'Failed to share CSV'
      );
    } finally {
      setExportedData(null);
    }
  }, [exportedData]);

  const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

  return (
    <SafeAreaView style={styles.container}>

      <Header title="Export CSV" subtitle="Download your data" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumGuard label="CSV Export">
          <View style={styles.heroCard}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="document-text" size={32} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Export to spreadsheet</Text>
            <Text style={styles.heroSubtitle}>
              Export your transactions as CSV. Choose to save to a folder or share to other apps.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date range</Text>
            <View style={styles.card}>
              {presets.map((preset, index) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.presetRow,
                    index === presets.length - 1 && styles.presetRowLast,
                  ]}
                  onPress={() => handlePresetSelect(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.presetLeft}>
                    <View style={[
                      styles.radioCircle,
                      selectedPreset === index && !customRange && { borderColor: colors.primary, borderWidth: 2 },
                    ]}>
                      {selectedPreset === index && !customRange && (
                        <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <Text style={styles.presetLabel}>{preset.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.presetRow, styles.presetRowLast]}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.presetLeft}>
                  <View style={[
                    styles.radioCircle,
                    customRange && { borderColor: colors.primary, borderWidth: 2 },
                  ]}>
                    {customRange && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={styles.presetLabel}>Custom Range</Text>
                </View>
              </TouchableOpacity>

              {customRange && (
                <View style={styles.customDatesContainer}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.dateLabel}>From</Text>
                    <Text style={styles.dateValue}>{formatDate(customRange.startDate)}</Text>
                  </TouchableOpacity>
                  <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text style={styles.dateLabel}>To</Text>
                    <Text style={styles.dateValue}>{formatDate(customRange.endDate)}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={customRange?.startDate || new Date()}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              maximumDate={new Date()}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={customRange?.endDate || new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              maximumDate={new Date()}
            />
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account (optional)</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.filterRow, selectedAccountId === null && styles.filterRowSelected]}
                onPress={() => setSelectedAccountId(null)}
                activeOpacity={0.7}
              >
                <View style={styles.filterLeft}>
                  <View style={[styles.filterIconBox, { backgroundColor: colors.surface }]}>
                    <Ionicons name="wallet-outline" size={16} color={colors.textMuted} />
                  </View>
                  <Text style={styles.filterLabel}>All Accounts</Text>
                </View>
                {selectedAccountId === null && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>

              {accountsQuery.data?.map((account, index) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.filterRow,
                    index === (accountsQuery.data?.length || 0) - 1 && styles.filterRowLast,
                    selectedAccountId === account.id && styles.filterRowSelected,
                  ]}
                  onPress={() => setSelectedAccountId(account.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.filterLeft}>
                    <View style={[styles.filterIconBox, { backgroundColor: toHexColor(account.color) + '20' }]}>
                      <Ionicons name={resolveIcon(account.icon, 'wallet-outline')} size={16} color={toHexColor(account.color)} />
                    </View>
                    <Text style={styles.filterLabel}>{account.name}</Text>
                  </View>
                  {selectedAccountId === account.id && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Type (optional)</Text>
            <View style={styles.typeGrid}>
              {(['ALL', 'CR', 'DR'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    selectedType === type && { backgroundColor: colors.text },
                  ]}
                  onPress={() => setSelectedType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.typeChipText,
                    selectedType === type && { color: colors.background },
                  ]}>
                    {type === 'ALL' ? 'All' : type === 'CR' ? 'Income' : 'Expense'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Transactions to export</Text>
              <Text style={styles.summaryValue}>
                {previewCount !== null ? previewCount.toLocaleString() : '...'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date range</Text>
              <Text style={styles.summaryValueSmall}>
                {formatDate(effectiveDateRange.startDate)} - {formatDate(effectiveDateRange.endDate)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.exportButton, isExporting && { opacity: 0.7 }]}
            onPress={handleExport}
            disabled={isExporting || previewCount === 0}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={colors.background} />
                <Text style={styles.exportButtonText}>Export CSV</Text>
              </>
            )}
          </TouchableOpacity>

          {previewCount === 0 && (
            <View style={styles.warningCard}>
              <Ionicons name="information-circle-outline" size={18} color={colors.warning || colors.textMuted} />
              <Text style={styles.warningText}>
                No transactions match the selected filters. Adjust your date range or filters.
              </Text>
            </View>
          )}
        </PremiumGuard>
      </ScrollView>

      <OptionsDialog
        visible={showExportOptions}
        onClose={() => {
          setShowExportOptions(false);
          setExportedData(null);
        }}
        title="Export Complete"
        subtitle={exportedData ? `${previewCount?.toLocaleString()} transactions` : 'Choose how to save your CSV'}
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
      padding: 24,
      alignItems: 'center',
      marginBottom: 32,
    },
    heroIconContainer: {
      width: 64,
      height: 64,
      borderRadius: theme.radius.full,
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
      overflow: 'hidden',
    },
    presetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    presetRowLast: {
      borderBottomWidth: 0,
    },
    presetLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    presetLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 15,
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
    customDatesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      paddingTop: 8,
      backgroundColor: theme.colors.background,
    },
    dateButton: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateLabel: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 10,
      color: theme.colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    dateValue: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 14,
      color: theme.colors.text,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    filterRowLast: {
      borderBottomWidth: 0,
    },
    filterRowSelected: {
      backgroundColor: theme.colors.primary + '08',
    },
    filterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    filterIconBox: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 15,
      color: theme.colors.text,
    },
    typeGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    typeChip: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    typeChipText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 13,
      color: theme.colors.text,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: 16,
      marginBottom: 20,
      gap: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryLabel: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    summaryValue: {
      fontFamily: theme.fontFamilies.heading,
      fontSize: 20,
      color: theme.colors.text,
    },
    summaryValueSmall: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 13,
      color: theme.colors.text,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 56,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.text,
      marginBottom: 16,
    },
    exportButtonText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 16,
      color: theme.colors.background,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: (theme.colors.warning || '#F59E0B') + '10',
      borderRadius: theme.radius.md,
      padding: 12,
    },
    warningText: {
      flex: 1,
      fontFamily: theme.fontFamilies.sans,
      fontSize: 13,
      color: theme.colors.warning || '#F59E0B',
      lineHeight: 18,
    },
  });
