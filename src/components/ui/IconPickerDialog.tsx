import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';
import { resolveIcon } from '../../utils/icons';

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
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <BlurView
            blurAmount={Platform.OS === 'ios' ? 80 : 96}
            blurType={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
          {Platform.OS === 'android' && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]}
            />
          )}

          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search icons..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {Object.entries(filteredGroups).map(([groupName, icons]) => (
              <View key={groupName} style={styles.groupSection}>
                <Text style={styles.groupTitle}>{groupName}</Text>
                <View style={styles.iconGrid}>
                  {icons.map((icon: string) => {
                    const isSelected = selectedIcon === icon;
                    return (
                      <TouchableOpacity
                        key={icon}
                        style={[styles.iconCell, isSelected && styles.iconCellSelected]}
                        onPress={() => handleSelect(icon)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={resolveIcon(icon, 'grid-outline')}
                          size={20}
                          color={isSelected ? colors.background : colors.text}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {Object.keys(filteredGroups).length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No icons found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

IconPickerDialog.displayName = 'IconPickerDialog';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
    },
    sheet: {
      height: '82%',
      borderTopLeftRadius: RADIUS['3xl'],
      borderTopRightRadius: RADIUS['3xl'],
      borderTopWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    handle: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: 999,
      marginTop: SPACING['2.5'],
      backgroundColor: colors.textMuted + '55',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING['6'],
      paddingTop: SPACING['3.5'],
      paddingBottom: SPACING['2.5'],
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      color: colors.text,
      letterSpacing: -0.8,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: SPACING['6'],
      marginBottom: SPACING['2.5'],
      height: 44,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING['3'],
      gap: SPACING['2'],
    },
    searchInput: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.text,
      padding: 0,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SPACING['6'],
      paddingBottom: SPACING['6'],
    },
    groupSection: {
      marginBottom: SPACING['5'],
    },
    groupTitle: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: SPACING['2.5'],
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING['2'],
    },
    iconCell: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCellSelected: {
      backgroundColor: colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: SPACING['12'],
      gap: SPACING['3'],
    },
    emptyText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 14,
      color: colors.textMuted,
    },
  });
