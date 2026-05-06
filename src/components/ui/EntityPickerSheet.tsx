import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { IoniconName, resolveIcon } from '../../utils/icons';

export type EntityPickerItem = {
  id: number;
  name: string;
  subtitle?: string | null;
  icon?: string | null;
  color?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: EntityPickerItem[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  allowNull?: boolean;
  nullLabel?: string;
  nullIcon?: IoniconName;
  onAdd?: () => void;
  addIcon?: IoniconName;
  searchPlaceholder?: string;
  searchFilter?: (item: EntityPickerItem, query: string) => boolean;
  isLoading?: boolean;
};

const defaultFilter = (item: EntityPickerItem, query: string) =>
  item.name.toLowerCase().includes(query) ||
  (item.subtitle?.toLowerCase().includes(query) ?? false);

export const EntityPickerSheet = React.memo(function EntityPickerSheet({
  visible,
  onClose,
  title,
  items,
  selectedId,
  onSelect,
  allowNull = true,
  nullLabel = 'None',
  nullIcon = 'remove-circle-outline',
  onAdd,
  addIcon = 'add-circle-outline',
  searchPlaceholder = 'Search...',
  searchFilter = defaultFilter,
  isLoading = false,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(item => searchFilter(item, q));
  }, [items, query, searchFilter]);

  const handleSelect = useCallback(
    (id: number | null) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const handleAdd = useCallback(() => {
    onClose();
    onAdd?.();
  }, [onClose, onAdd]);

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
              {onAdd && (
                <TouchableOpacity onPress={handleAdd} style={styles.iconBtn}>
                  <Ionicons name={addIcon} size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
                <Ionicons name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {allowNull && (
                <TouchableOpacity
                  style={[styles.row, selectedId === null && styles.rowSelected]}
                  onPress={() => handleSelect(null)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                    <Ionicons name={nullIcon} size={20} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.name, selectedId === null && styles.nameSelected]}>
                    {nullLabel}
                  </Text>
                  {selectedId === null && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}

              {filtered.map(item => {
                const isSelected = selectedId === item.id;
                const avatarBg = item.color ? item.color + '20' : colors.surface;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => handleSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                      <Ionicons
                        name={resolveIcon(item.icon, 'ellipse-outline')}
                        size={20}
                        color={item.color ?? colors.textMuted}
                      />
                    </View>
                    <View style={styles.info}>
                      <Text style={[styles.name, isSelected && styles.nameSelected]}>
                        {item.name}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.subtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {!isLoading && filtered.length === 0 && query.length > 0 && (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyText}>Nothing found</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
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
    backdrop: {
      flex: 1,
    },
    sheet: {
      height: '72%',
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.radius['2xl'],
      borderTopRightRadius: theme.radius['2xl'],
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: theme.radius.full,
      marginTop: 12,
      backgroundColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 22,
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 24,
      marginBottom: 16,
      height: 48,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.fontFamilies.sans,
      fontSize: 15,
      color: theme.colors.text,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 16,
    },
    rowSelected: {
      backgroundColor: theme.colors.primary + '08',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    info: {
      flex: 1,
    },
    name: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 15,
      color: theme.colors.text,
    },
    nameSelected: {
      color: theme.colors.primary,
    },
    subtitle: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: 48,
      gap: 12,
    },
    emptyText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 14,
      color: theme.colors.textMuted,
    },
  });
