import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, IconPickerDialog, Input, SectionLabel } from '../../../components/core';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { fromDbColor, toDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { useCreatePlace, usePlaceById, useUpdatePlace } from '../api/places';

type Props = {
  mode: 'create' | 'edit';
  placeId?: number | null;
};

export const PlaceFormPage = React.memo(function PlaceFormPage({ mode, placeId }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isEditMode = mode === 'edit';
  const { data: editingPlace, isLoading: loadingPlace } = usePlaceById(isEditMode ? placeId ?? null : null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconKey, setIconKey] = useState('location-outline');
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[1]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { mutateAsync: createPlace } = useCreatePlace();
  const { mutateAsync: updatePlace } = useUpdatePlace();

  useEffect(() => {
    if (editingPlace) {
      setName(editingPlace.name);
      setDescription(editingPlace.description || '');
      setIconKey(editingPlace.icon + '-outline');
      setColorHex(fromDbColor(editingPlace.color));
    }
  }, [editingPlace]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        icon: iconKey.replace('-outline', ''),
        color: toDbColor(colorHex),
      };

      if (isEditMode && placeId) {
        await updatePlace({ id: placeId, data: payload });
      } else {
        await createPlace(payload);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save place. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, iconKey, colorHex, isEditMode, placeId, createPlace, updatePlace, router]);

  if (loadingPlace) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title={isEditMode ? 'Edit place' : 'New place'} showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formBody}>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Name" />
            <Input
              placeholder="e.g. Starbucks, Office, Home"
              value={name}
              onChangeText={setName}
              autoFocus={!isEditMode}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Description (optional)" />
            <Input
              placeholder="e.g. Favorite coffee shop"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Icon" />
            <TouchableOpacity
              style={styles.iconSelectorBtn}
              onPress={() => setShowIconPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconPreview, { backgroundColor: colorHex + '15' }]}>
                <Ionicons name={resolveIcon(iconKey, 'location-outline')} size={18} color={colorHex} />
              </View>
              <Text style={styles.iconSelectorText}>
                {iconKey.replace('-outline', '').replace(/-/g, ' ')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Color" />
            <View style={styles.colorRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorWrap}>
                {CATEGORY_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.8}
                    onPress={() => setColorHex(c)}
                    style={[styles.colorCell, { backgroundColor: c }, colorHex === c && styles.colorCellActive]}
                  >
                    {colorHex === c ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.saveBtn, (!name.trim() || isSubmitting) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditMode ? 'Update place' : 'Add place'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <IconPickerDialog
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Place icon"
      />
    </SafeAreaView>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[24],
    paddingBottom: 120,
  },
  formBody: {
    gap: theme.spacing[24],
  },
  section: {
    gap: theme.spacing[12],
  },
  iconSelectorBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
    paddingHorizontal: theme.spacing[16],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconPreview: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSelectorText: {
    flex: 1,
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 14,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  colorRow: {
    marginHorizontal: -theme.layout.screenPadding,
  },
  colorWrap: {
    paddingHorizontal: theme.layout.screenPadding,
  },
  colorCell: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: theme.spacing[12],
  },
  colorCellActive: {
    borderColor: theme.colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 34,
    left: theme.layout.screenPadding,
    right: theme.layout.screenPadding,
  },
  saveBtn: {
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.md,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 16,
    color: theme.colors.onPrimary,
  },
});
