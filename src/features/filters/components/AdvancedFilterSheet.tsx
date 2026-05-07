import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Account } from '@/src/features/accounts/api/accounts';
import { Category } from '@/src/features/categories/api/categories';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { resolveIcon } from '@/src/utils/icons';
import { AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '../api/advanced-filters.service';

interface AdvancedFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
  onReset: () => void;
  accounts: Account[];
  categories: Category[];
  resultCount: number;
}

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

export const AdvancedFilterSheet = React.memo(function AdvancedFilterSheet({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
  accounts,
  categories,
  resultCount,
}: AdvancedFilterSheetProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [minAmount, setMinAmount] = useState(filters.amountRange?.min?.toString() || '');
  const [maxAmount, setMaxAmount] = useState(filters.amountRange?.max?.toString() || '');

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      setMinAmount(filters.amountRange?.min?.toString() || '');
      setMaxAmount(filters.amountRange?.max?.toString() || '');
    }
  }, [visible, filters]);

  const toggleSelection = useCallback(<T,>(current: T[] | undefined, value: T): T[] => {
    const arr = current || [];
    if (arr.includes(value)) return arr.filter(item => item !== value);
    return [...arr, value];
  }, []);

  const toggleAccount = useCallback((accountId: number) => {
    setLocalFilters(prev => ({
      ...prev,
      accountIds: toggleSelection(prev.accountIds, accountId),
    }));
  }, [toggleSelection]);

  const toggleCategory = useCallback((categoryId: number) => {
    setLocalFilters(prev => ({
      ...prev,
      categoryIds: toggleSelection(prev.categoryIds, categoryId),
    }));
  }, [toggleSelection]);

  const toggleType = useCallback((type: 'CR' | 'DR') => {
    setLocalFilters(prev => ({
      ...prev,
      types: toggleSelection(prev.types, type),
    }));
  }, [toggleSelection]);

  const handleStartDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowStartDatePicker(false);
    if (date && event.type === 'set') {
      setLocalFilters(prev => ({
        ...prev,
        dateRange: {
          startDate: date,
          endDate: prev.dateRange?.endDate || new Date(),
        },
      }));
    }
  }, []);

  const handleEndDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowEndDatePicker(false);
    if (date && event.type === 'set') {
      date.setHours(23, 59, 59, 999);
      setLocalFilters(prev => ({
        ...prev,
        dateRange: {
          startDate: prev.dateRange?.startDate || new Date(),
          endDate: date,
        },
      }));
    }
  }, []);

  const clearDateRange = useCallback(() => {
    setLocalFilters(prev => ({ ...prev, dateRange: undefined }));
  }, []);

  const handleApply = useCallback(() => {
    const min = minAmount ? parseFloat(minAmount) : undefined;
    const max = maxAmount ? parseFloat(maxAmount) : undefined;
    const finalFilters: AdvancedFilters = {
      ...localFilters,
      amountRange: (min !== undefined || max !== undefined) ? { min, max } : undefined,
    };
    onApply(finalFilters);
    onClose();
  }, [localFilters, minAmount, maxAmount, onApply, onClose]);

  const handleReset = useCallback(() => {
    setLocalFilters(DEFAULT_ADVANCED_FILTERS);
    setMinAmount('');
    setMaxAmount('');
    onReset();
  }, [onReset]);

  const activeFilterCount = useMemo(() =>
    (localFilters.accountIds?.length || 0) +
    (localFilters.categoryIds?.length || 0) +
    (localFilters.types?.length || 0) +
    (localFilters.dateRange ? 1 : 0) +
    (minAmount || maxAmount ? 1 : 0) +
    (localFilters.searchQuery?.trim() ? 1 : 0),
    [localFilters, minAmount, maxAmount]
  );

  const formatDate = useCallback((date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    []
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Filters</Text>
              {activeFilterCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </View>
            {activeFilterCount > 0 ? (
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
                <Text style={styles.resetBtnText}>Reset all</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.closeIconBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search — always visible, above scroll */}
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={localFilters.searchQuery || ''}
                onChangeText={(text) => setLocalFilters(prev => ({ ...prev, searchQuery: text }))}
                placeholder="Notes, categories, accounts..."
                placeholderTextColor={colors.textMuted + '80'}
              />
              {!!localFilters.searchQuery && (
                <TouchableOpacity onPress={() => setLocalFilters(prev => ({ ...prev, searchQuery: '' }))}>
                  <Ionicons name="close-circle" size={15} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* TYPE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Type</Text>
              <View style={styles.typeRow}>
                {(['CR', 'DR'] as const).map((type) => {
                  const isSelected = localFilters.types?.includes(type) || false;
                  const accentColor = type === 'CR' ? colors.success : colors.danger;
                  const icon = type === 'CR' ? 'arrow-down' : 'arrow-up';
                  const label = type === 'CR' ? 'Income' : 'Expense';

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeCard,
                        isSelected && { backgroundColor: accentColor + '12' },
                      ]}
                      onPress={() => toggleType(type)}
                      activeOpacity={0.75}
                    >
                      <View style={[
                        styles.typeAccentBar,
                        { backgroundColor: isSelected ? accentColor : colors.text + '15' },
                      ]} />
                      <View style={styles.typeBody}>
                        <View style={[styles.typeIconBox, { backgroundColor: accentColor + '18' }]}>
                          <Ionicons name={icon} size={15} color={accentColor} />
                        </View>
                        <Text style={[
                          styles.typeLabel,
                          { color: isSelected ? accentColor : colors.textMuted },
                        ]}>
                          {label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DATE RANGE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date range</Text>
              <View style={styles.card}>
                {localFilters.dateRange ? (
                  <View style={styles.dateActiveRow}>
                    <TouchableOpacity
                      style={styles.dateField}
                      onPress={() => setShowStartDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dateFieldLabel}>From</Text>
                      <Text style={styles.dateFieldValue}>
                        {formatDate(localFilters.dateRange.startDate)}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.dateFieldSep} />
                    <TouchableOpacity
                      style={styles.dateField}
                      onPress={() => setShowEndDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dateFieldLabel}>To</Text>
                      <Text style={styles.dateFieldValue}>
                        {formatDate(localFilters.dateRange.endDate)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={clearDateRange} style={styles.dateClearBtn}>
                      <Ionicons name="close" size={13} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.dateInactiveRow}>
                    <TouchableOpacity
                      style={styles.datePickerBtn}
                      onPress={() => setShowStartDatePicker(true)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Text style={styles.datePickerBtnText}>Set start date</Text>
                    </TouchableOpacity>
                    <View style={styles.datePickerInternalSep} />
                    <TouchableOpacity
                      style={styles.datePickerBtn}
                      onPress={() => setShowEndDatePicker(true)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Text style={styles.datePickerBtnText}>Set end date</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* AMOUNT RANGE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Amount range</Text>
              <View style={styles.card}>
                <View style={styles.amountRow}>
                  <View style={styles.amountField}>
                    <Text style={styles.amountFieldLabel}>Min</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={minAmount}
                      onChangeText={setMinAmount}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted + '60'}
                      returnKeyType="done"
                    />
                  </View>
                  <View style={styles.amountFieldSep} />
                  <View style={styles.amountField}>
                    <Text style={styles.amountFieldLabel}>Max</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={maxAmount}
                      onChangeText={setMaxAmount}
                      keyboardType="decimal-pad"
                      placeholder="Any"
                      placeholderTextColor={colors.textMuted + '60'}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* ACCOUNTS */}
            {accounts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Accounts</Text>
                <View style={styles.card}>
                  {accounts.map((account, index) => {
                    const isSelected = localFilters.accountIds?.includes(account.id) || false;
                    const isLast = index === accounts.length - 1;
                    const accColor = toHexColor(account.color);

                    return (
                      <TouchableOpacity
                        key={account.id}
                        style={[
                          styles.listRow,
                          !isLast && styles.listRowDivider,
                          isSelected && styles.listRowActive,
                        ]}
                        onPress={() => toggleAccount(account.id)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.listIconBox, { backgroundColor: accColor + '18' }]}>
                          <Ionicons name={resolveIcon(account.icon, 'wallet-outline')} size={16} color={accColor} />
                        </View>
                        <Text style={[
                          styles.listRowLabel,
                          isSelected && { color: colors.text },
                        ]}>
                          {account.name}
                        </Text>
                        <View style={[
                          styles.checkbox,
                          isSelected && styles.checkboxActive,
                        ]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={11} color={colors.onPrimary} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* CATEGORIES */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Categories</Text>
                <View style={styles.chipGrid}>
                  {categories.map((category) => {
                    const isSelected = localFilters.categoryIds?.includes(category.id) || false;
                    const catColor = toHexColor(category.color);

                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.chip,
                          isSelected && {
                            backgroundColor: catColor + '18',
                          },
                        ]}
                        onPress={() => toggleCategory(category.id)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={resolveIcon(category.icon, 'pricetag-outline')}
                          size={13}
                          color={isSelected ? catColor : colors.textMuted}
                        />
                        <Text style={[
                          styles.chipText,
                          isSelected && { color: catColor },
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* SORT */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Sort</Text>
              <View style={styles.card}>
                <View style={styles.sortRow}>
                  <Text style={styles.sortRowLabel}>Sort by</Text>
                  <View style={styles.sortToggleGroup}>
                    {(['date', 'amount'] as const).map((sortBy) => {
                      const isActive = localFilters.sortBy === sortBy;
                      return (
                        <TouchableOpacity
                          key={sortBy}
                          style={[styles.sortToggle, isActive && styles.sortToggleActive]}
                          onPress={() => setLocalFilters(prev => ({ ...prev, sortBy }))}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.sortToggleText, isActive && styles.sortToggleTextActive]}>
                            {sortBy === 'date' ? 'Date' : 'Amount'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.sortRowSep} />
                <View style={styles.sortRow}>
                  <Text style={styles.sortRowLabel}>Order</Text>
                  <View style={styles.sortToggleGroup}>
                    {([
                      { order: 'desc' as const, label: 'Newest', icon: 'arrow-down' as const },
                      { order: 'asc' as const, label: 'Oldest', icon: 'arrow-up' as const },
                    ]).map(({ order, label, icon }) => {
                      const isActive = localFilters.sortOrder === order;
                      return (
                        <TouchableOpacity
                          key={order}
                          style={[styles.sortToggle, isActive && styles.sortToggleActive]}
                          onPress={() => setLocalFilters(prev => ({ ...prev, sortOrder: order }))}
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name={icon}
                            size={11}
                            color={isActive ? colors.onPrimary : colors.textMuted}
                          />
                          <Text style={[styles.sortToggleText, isActive && styles.sortToggleTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            <View style={{ height: 110 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>
                Show {resultCount} result{resultCount !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={localFilters.dateRange?.startDate || new Date()}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              maximumDate={new Date()}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={localFilters.dateRange?.endDate || new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.colors.floating,
      borderTopLeftRadius: theme.radius['3xl'],
      borderTopRightRadius: theme.radius['3xl'],
      maxHeight: '88%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: theme.radius.xs,
      backgroundColor: theme.colors.text + '20',
      alignSelf: 'center',
      marginTop: 10,
    },

    // ─── Header ─────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontFamily: theme.fontFamilies.heading,
      fontSize: 28,
      color: theme.colors.text,
      letterSpacing: -1,
    },
    countBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    countBadgeText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 11,
      color: theme.colors.onPrimary,
    },
    resetBtn: {
      height: 30,
      paddingHorizontal: 12,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.danger + '12',
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetBtnText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 12,
      color: theme.colors.danger,
    },
    closeIconBtn: {
      width: 30,
      height: 30,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.text + '08',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ─── Search ──────────────────────────────────────────────────────────────
    searchRow: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 12,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.overlay,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.fontFamilies.sans,
      fontSize: 14,
      color: theme.colors.text,
      padding: 0,
    },

    // ─── Scroll body ─────────────────────────────────────────────────────────
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 4,
    },
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: 8,
      paddingLeft: 4,
    },

    // ─── Shared card surface ─────────────────────────────────────────────────
    card: {
      backgroundColor: theme.colors.overlay,
      borderRadius: theme.radius['3xl'],
      overflow: 'hidden',
    },

    // ─── Type ────────────────────────────────────────────────────────────────
    typeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    typeCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: 60,
      borderRadius: theme.radius['3xl'],
      backgroundColor: theme.colors.overlay,
      overflow: 'hidden',
    },
    typeAccentBar: {
      width: 3,
      alignSelf: 'stretch',
      marginVertical: 12,
      marginLeft: 6,
      borderRadius: theme.radius.full,
    },
    typeBody: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      gap: 8,
    },
    typeIconBox: {
      width: 32,
      height: 32,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeLabel: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 14,
    },

    // ─── Date range ──────────────────────────────────────────────────────────
    dateActiveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dateField: {
      flex: 1,
      paddingVertical: 4,
    },
    dateFieldLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 11,
      color: theme.colors.textMuted,
      marginBottom: 2,
    },
    dateFieldValue: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 15,
      color: theme.colors.text,
    },
    dateFieldSep: {
      width: 1,
      height: 36,
      backgroundColor: theme.colors.text + '10',
      marginHorizontal: 12,
    },
    dateClearBtn: {
      width: 26,
      height: 26,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.text + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    dateInactiveRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    datePickerBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
    },
    datePickerInternalSep: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.text + '10',
    },
    datePickerBtnText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 14,
      color: theme.colors.primary,
    },

    // ─── Amount range ────────────────────────────────────────────────────────
    amountRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    amountField: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 4,
    },
    amountFieldLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    amountInput: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 22,
      color: theme.colors.text,
      letterSpacing: -0.5,
      padding: 0,
    },
    amountFieldSep: {
      width: 1,
      backgroundColor: theme.colors.text + '10',
      marginVertical: 12,
    },

    // ─── Account / Category list rows ─────────────────────────────────────
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    listRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.text + '12',
    },
    listRowActive: {
      backgroundColor: theme.colors.text + '05',
    },
    listIconBox: {
      width: 34,
      height: 34,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listRowLabel: {
      flex: 1,
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: theme.radius.full,
      borderWidth: 1.5,
      borderColor: theme.colors.text + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },

    // ─── Category chips ──────────────────────────────────────────────────────
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      height: 34,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.overlay,
      gap: 4,
    },
    chipText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 13,
      color: theme.colors.textMuted,
    },

    // ─── Sort ────────────────────────────────────────────────────────────────
    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    sortRowSep: {
      height: 1,
      backgroundColor: theme.colors.text + '08',
      marginHorizontal: 16,
    },
    sortRowLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    sortToggleGroup: {
      flexDirection: 'row',
      gap: 6,
    },
    sortToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      height: 30,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.text + '08',
    },
    sortToggleActive: {
      backgroundColor: theme.colors.primary,
    },
    sortToggleText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    sortToggleTextActive: {
      color: theme.colors.onPrimary,
    },

    // ─── Footer ──────────────────────────────────────────────────────────────
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 36,
      backgroundColor: theme.colors.floating,
    },
    applyBtn: {
      height: 52,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyBtnText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 15,
      color: theme.colors.onPrimary,
    },
  });
