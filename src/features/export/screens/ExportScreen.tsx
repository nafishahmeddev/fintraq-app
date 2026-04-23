import { Ionicons } from '@expo/vector-icons';
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
