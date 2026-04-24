import { Ionicons } from '@expo/vector-icons';
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
import { RADIUS, spacing } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';
import { usePlaces } from '../../features/places/api/places';
import { fromDbColor } from '../../utils/format';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  title?: string;
  onAddPlace?: () => void;
};

export const PlacePickerDialog = React.memo(function PlacePickerDialog({
  visible,
  onClose,
  selectedId,
  onSelect,
  title = 'Select place',
  onAddPlace,
}: Props) {
  const { colors } = useTheme();
  const { data: places, isLoading } = usePlaces();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaces = useMemo(() => {
    if (!places) return [];
    if (!searchQuery.trim()) return places;
    const query = searchQuery.toLowerCase();
    return places.filter(
      (p) => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)),
    );
  }, [places, searchQuery]);

  const handleSelect = useCallback((id: number | null) => {
    onSelect(id);
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
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.headerRight}>
              {onAddPlace && (
                <TouchableOpacity 
                  onPress={() => {
                    onClose();
                    onAddPlace();
                  }} 
                  style={styles.addBtn}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search places..."
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
            <TouchableOpacity
              style={[styles.placeRow, selectedId === null && styles.placeRowSelected]}
              onPress={() => handleSelect(null)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                <Ionicons name="location-outline" size={20} color={colors.textMuted} />
              </View>
              <Text style={[styles.placeName, selectedId === null && styles.selectedText]}>
                No place
              </Text>
              {selectedId === null && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            {filteredPlaces.map((place) => {
              const isSelected = selectedId === place.id;
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.placeRow, isSelected && styles.placeRowSelected]}
                  onPress={() => handleSelect(place.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, { backgroundColor: fromDbColor(place.color) + '20' }]}>
                    <Ionicons 
                      name={(place.icon as any) || 'location'} 
                      size={20} 
                      color={fromDbColor(place.color)} 
                    />
                  </View>
                  <View style={styles.placeInfo}>
                    <Text style={[styles.placeName, isSelected && styles.selectedText]}>
                      {place.name}
                    </Text>
                    {place.description && (
                      <Text style={styles.placeDescription} numberOfLines={1}>{place.description}</Text>
                    )}
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            {!isLoading && filteredPlaces.length === 0 && searchQuery.length > 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No place found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
    },
    sheet: {
      height: '70%',
      backgroundColor: colors.background,
      borderTopLeftRadius: RADIUS['3xl'],
      borderTopRightRadius: RADIUS['3xl'],
      borderTopWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: RADIUS.full,
      marginTop: spacing('3'),
      backgroundColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('6'),
      paddingTop: spacing('4'),
      paddingBottom: spacing('4'),
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 24,
      color: colors.text,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing('6'),
      marginBottom: spacing('4'),
      height: 48,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      gap: spacing('3'),
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 16,
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing('6'),
      paddingBottom: spacing('8'),
    },
    placeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('4'),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing('4'),
    },
    placeRowSelected: {
      backgroundColor: colors.primary + '08',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeInfo: {
      flex: 1,
    },
    placeName: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 16,
      color: colors.text,
    },
    selectedText: {
      color: colors.primary,
    },
    placeDescription: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing('12'),
      gap: spacing('3'),
    },
    emptyText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 14,
      color: colors.textMuted,
    },
  });
