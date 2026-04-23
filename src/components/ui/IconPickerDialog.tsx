import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { resolveIcon } from '../../utils/icons';
import { Box, HStack, VStack } from './Stack';
import { Pressable } from './Pressable';
import { Text, cn } from './Text';

export const ICON_GROUPS = {
  'Finance & Money': [
    'cash-outline',
    'wallet-outline',
    'card-outline',
    'briefcase-outline',
    'trending-up-outline',
    'trending-down-outline',
    'refresh-outline',
    'receipt-outline',
    'document-text-outline',
    'server-outline',
    'diamond-outline',
  ],
  'Food & Drink': [
    'fast-food-outline',
    'restaurant-outline',
    'cafe-outline',
    'pizza-outline',
    'wine-outline',
    'beer-outline',
    'ice-cream-outline',
    'basket-outline',
  ],
  'Transport': [
    'car-outline',
    'bus-outline',
    'airplane-outline',
    'train-outline',
    'bicycle-outline',
    'boat-outline',
    'speedometer-outline',
    'locate-outline',
  ],
  'Home & Utilities': [
    'home-outline',
    'business-outline',
    'flash-outline',
    'wifi-outline',
    'build-outline',
    'bed-outline',
    'leaf-outline',
    'water-outline',
  ],
  'Health & Fitness': [
    'medkit-outline',
    'bandage-outline',
    'barbell-outline',
    'fitness-outline',
    'heart-outline',
  ],
  'Tech & Communication': [
    'phone-portrait-outline',
    'hardware-chip-outline',
    'globe-outline',
    'chatbubble-outline',
    'mail-outline',
  ],
  'Shopping': [
    'bag-outline',
    'cart-outline',
    'pricetag-outline',
    'gift-outline',
  ],
  'Entertainment': [
    'film-outline',
    'game-controller-outline',
    'musical-notes-outline',
    'camera-outline',
    'color-palette-outline',
    'book-outline',
    'tv-outline',
  ],
  'Education': [
    'school-outline',
    'library-outline',
    'pencil-outline',
  ],
  'Personal & Social': [
    'person-outline',
    'people-outline',
    'happy-outline',
    'paw-outline',
    'ribbon-outline',
    'trophy-outline',
    'star-outline',
  ],
  'Security': [
    'shield-checkmark-outline',
    'umbrella-outline',
    'lock-closed-outline',
    'key-outline',
  ],
  'Miscellaneous': [
    'sparkles-outline',
    'bulb-outline',
    'grid-outline',
    'ellipsis-horizontal-outline',
    'flag-outline',
    'location-outline',
    'time-outline',
    'calendar-outline',
    'sunny-outline',
    'moon-outline',
  ],
} as const;

export type IconGroupName = keyof typeof ICON_GROUPS;
export type IconName = (typeof ICON_GROUPS)[IconGroupName][number];

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedIcon: string;
  onSelect: (icon: string) => void;
  title?: string;
};

export const IconPickerDialog = React.memo(function IconPickerDialog({
  visible,
  onClose,
  selectedIcon,
  onSelect,
  title = 'Select icon',
}: Props) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return ICON_GROUPS;
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, string[]> = {};
    Object.entries(ICON_GROUPS).forEach(([group, icons]) => {
      const matching = icons.filter(
        (icon) => icon.toLowerCase().includes(query) || group.toLowerCase().includes(query),
      );
      if (matching.length > 0) filtered[group] = matching;
    });
    return filtered;
  }, [searchQuery]);

  const handleSelect = useCallback((icon: string) => {
    onSelect(icon);
    onClose();
  }, [onSelect, onClose]);

  const handleClearSearch = useCallback(() => setSearchQuery(''), []);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/55 justify-end"
      >
        <Pressable className="flex-1" onPress={handleClose} />

        <VStack className="h-[82%] bg-background rounded-t-[28px] border-t border-border overflow-hidden">

          <Box className="self-center w-10 h-1 rounded-full mt-2.5 bg-text-muted/30" />

          <HStack className="px-6 pt-3.5 pb-2.5 items-center justify-between">
            <Text className="font-heading text-[28px] text-text tracking-tight">
              {title}
            </Text>
            <Pressable
              onPress={handleClose}
              className="w-9 h-9 rounded-full bg-surface border border-border justify-center items-center"
            >
              <Ionicons name="close" size={16} color={isDark ? '#fbfff3' : '#000100'} />
            </Pressable>
          </HStack>

          <HStack className="items-center mx-6 mb-2.5 h-11 rounded-full bg-surface px-3 space-x-2">
            <Ionicons name="search-outline" size={16} color={isDark ? '#b2bb8b' : '#737a5f'} />
            <TextInput
              className="flex-1 font-regular text-sm text-text py-0"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search icons..."
              placeholderTextColor={isDark ? '#b2bb8b' : '#737a5f'}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={16} color={isDark ? '#b2bb8b' : '#737a5f'} />
              </Pressable>
            )}
          </HStack>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {Object.entries(filteredGroups).map(([groupName, icons]) => (
              <VStack key={groupName} className="mb-5">
                <Text className="font-semibold text-[10px] text-text-muted tracking-widest uppercase mb-2.5">
                  {groupName}
                </Text>
                <Box className="flex-row flex-wrap gap-2">
                  {icons.map((icon: string) => {
                    const isSelected = selectedIcon === icon;
                    return (
                      <Pressable
                        key={icon}
                        className={cn(
                          "w-12 h-12 rounded-full justify-center items-center",
                          isSelected ? "bg-primary" : "bg-surface"
                        )}
                        onPress={() => handleSelect(icon)}
                      >
                        <Ionicons
                          name={resolveIcon(icon, 'grid-outline')}
                          size={20}
                          color={isSelected
                            ? (isDark ? '#000100' : '#F6FFF9') // background
                            : (isDark ? '#fbfff3' : '#000100') // text
                          }
                        />
                      </Pressable>
                    );
                  })}
                </Box>
              </VStack>
            ))}

            {Object.keys(filteredGroups).length === 0 && (
              <VStack className="items-center py-12 space-y-3">
                <Ionicons name="search-outline" size={40} color={isDark ? '#b2bb8b' : '#737a5f'} />
                <Text className="font-medium text-sm text-text-muted">
                  No icons found
                </Text>
              </VStack>
            )}
          </ScrollView>
        </VStack>
      </KeyboardAvoidingView>
    </Modal>
  );
});

IconPickerDialog.displayName = 'IconPickerDialog';