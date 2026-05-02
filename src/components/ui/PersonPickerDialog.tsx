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
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { usePeople } from '../../features/people/api/people';
import { fromDbColor } from '../../utils/format';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  title?: string;
  onAddPerson?: () => void;
};

export const PersonPickerDialog = React.memo(function PersonPickerDialog({
  visible,
  onClose,
  selectedId,
  onSelect,
  title = 'Select person',
  onAddPerson,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { data: people, isLoading } = usePeople();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPeople = useMemo(() => {
    if (!people) return [];
    if (!searchQuery.trim()) return people;
    const query = searchQuery.toLowerCase();
    return people.filter(
      (p) => p.name.toLowerCase().includes(query) || (p.phone && p.phone.includes(query)),
    );
  }, [people, searchQuery]);

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
              {onAddPerson && (
                <TouchableOpacity 
                  onPress={() => {
                    onClose();
                    onAddPerson();
                  }} 
                  style={styles.addBtn}
                >
                  <Ionicons name="person-add-outline" size={20} color={colors.primary} />
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
              placeholder="Search people..."
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
              style={[styles.personRow, selectedId === null && styles.personRowSelected]}
              onPress={() => handleSelect(null)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                <Ionicons name="people-outline" size={20} color={colors.textMuted} />
              </View>
              <Text style={[styles.personName, selectedId === null && styles.selectedText]}>
                No person
              </Text>
              {selectedId === null && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            {filteredPeople.map((person) => {
              const isSelected = selectedId === person.id;
              return (
                <TouchableOpacity
                  key={person.id}
                  style={[styles.personRow, isSelected && styles.personRowSelected]}
                  onPress={() => handleSelect(person.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, { backgroundColor: fromDbColor(person.color) + '15' }]}>
                    <Ionicons 
                      name={(person.icon as any) || 'person'} 
                      size={20} 
                      color={fromDbColor(person.color)} 
                    />
                  </View>
                  <View style={styles.personInfo}>
                    <Text style={[styles.personName, isSelected && styles.selectedText]}>
                      {person.name}
                    </Text>
                    {person.phone && (
                      <Text style={styles.personPhone}>{person.phone}</Text>
                    )}
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            {!isLoading && filteredPeople.length === 0 && searchQuery.length > 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No one found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const createStyles = (theme: Theme) =>
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
      paddingTop: 16,
      paddingBottom: 16,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    title: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 24,
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    closeBtn: {
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
      fontSize: 16,
      color: theme.colors.text,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    personRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 16,
    },
    personRowSelected: {
      backgroundColor: theme.colors.primary + '08',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    personInfo: {
      flex: 1,
    },
    personName: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 16,
      color: theme.colors.text,
    },
    selectedText: {
      color: theme.colors.primary,
    },
    personPhone: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    emptyState: {
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
