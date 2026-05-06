import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, IconPickerDialog, Input, SectionLabel } from '../../../components/ui';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { fromDbColor, toDbColor } from '../../../utils/format';
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
            <SectionLabel size="sm" text="Appearance" />
            <View style={styles.visualsRow}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setShowIconPicker(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: colorHex + '20' }]}>
                  <Ionicons name={iconKey as any} size={24} color={colorHex} />
                </View>
              </TouchableOpacity>

              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.slice(0, 12).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      colorHex === c && styles.colorCircleActive,
                    ]}
                    onPress={() => setColorHex(c)}
                  >
                    {colorHex === c ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isEditMode ? 'Update place' : 'Add place'}
          onPress={handleSave}
          isLoading={isSubmitting}
          size="lg"
        />
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
    paddingTop: theme.spacing[16],
    paddingBottom: 120,
  },
  formBody: {
    gap: theme.spacing[24],
  },
  section: {
    gap: theme.spacing[12],
  },
  visualsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[16],
    padding: theme.spacing[16],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBtn: {
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: theme.colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 34,
    left: theme.layout.screenPadding,
    right: theme.layout.screenPadding,
  },
});
