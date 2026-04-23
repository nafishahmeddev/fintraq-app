import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState, useCallback } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
} from 'react-native';
import { CURRENCIES } from '../../constants/currency';
import { useTheme } from '../../providers/ThemeProvider';
import { Box, HStack, VStack } from './Stack';
import { Pressable } from './Pressable';
import { Text, cn } from './Text';

export type CurrencyPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (code: string) => void;
};

const ITEM_HEIGHT = 54;

export const CurrencyPickerModal = React.memo(function CurrencyPickerModal({
  visible,
  onClose,
  value,
  onChange
}: CurrencyPickerModalProps) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = useCallback((code: string) => {
    onChange(code);
    onClose();
  }, [onChange, onClose]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const handleClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  const renderItem = useCallback(({ item }: { item: typeof CURRENCIES[0] }) => {
    const selected = item.code === value;
    return (
      <Pressable
        className="flex-row items-center py-3 space-x-3"
        onPress={() => handleSelect(item.code)}
      >
        <Box
          className={cn(
            "w-11 h-8 rounded-full border items-center justify-center",
            selected ? "bg-primary/20 border-primary/50" : "bg-surface border-border"
          )}
        >
          <Text className={cn(
            "font-semibold text-[11px] tracking-wide",
            selected ? "text-primary" : "text-text-muted"
          )}>
            {item.code}
          </Text>
        </Box>
        <Text
          className={cn(
            "flex-1 text-sm text-text",
            selected ? "font-semibold" : "font-regular"
          )}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {selected && (
          <Ionicons name="checkmark-circle" size={18} color={isDark ? '#B8D641' : '#a6c13a'} />
        )}
      </Pressable>
    );
  }, [value, handleSelect, isDark]);

  const getItemLayout = useCallback((data: ArrayLike<typeof CURRENCIES[0]> | null | undefined, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: typeof CURRENCIES[0]) => item.code, []);

  const ItemSeparatorComponent = useCallback(() => <Box className="h-px bg-border ml-14" />, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/55 justify-end"
      >
        <Pressable className="flex-1" onPress={handleClose} />

        <VStack className="h-[82%] bg-background rounded-t-[30px] border-t border-border overflow-hidden">

          <Box className="self-center w-10 h-1 rounded-full mt-2.5 bg-text-muted/30" />

          {/* Header */}
          <HStack className="px-6 pt-3.5 pb-2.5 items-center justify-between">
            <VStack className="flex-1">
              <Text className="font-heading text-[28px] text-text tracking-tight leading-8">
                Select Currency
              </Text>
              <Text className="font-regular text-xs text-text-muted mt-0.5">
                {CURRENCIES.length} currencies worldwide
              </Text>
            </VStack>
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 rounded-full bg-surface border border-border justify-center items-center"
            >
              <Ionicons name="close" size={18} color={isDark ? '#fbfff3' : '#000100'} />
            </Pressable>
          </HStack>

          {/* Search */}
          <HStack className="items-center mx-6 mb-2.5 h-11 rounded-full bg-surface border border-border px-3 space-x-2">
            <Ionicons name="search-outline" size={16} color={isDark ? '#b2bb8b' : '#737a5f'} className="flex-shrink-0" />
            <TextInput
              className="flex-1 font-regular text-sm text-text py-0"
              value={query}
              onChangeText={setQuery}
              placeholder="Search by code or name…"
              placeholderTextColor={isDark ? '#b2bb8b' : '#737a5f'}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={handleClearQuery} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={isDark ? '#b2bb8b' : '#737a5f'} />
              </Pressable>
            )}
          </HStack>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 24 : 32 }}
            ItemSeparatorComponent={ItemSeparatorComponent}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <Box className="py-12 items-center">
                <Text className="font-regular text-sm text-text-muted">
                  No currencies match &ldquo;{query}&rdquo;
                </Text>
              </Box>
            }
          />
        </VStack>
      </KeyboardAvoidingView>
    </Modal>
  );
});