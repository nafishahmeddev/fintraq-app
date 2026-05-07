import { Header } from '../../../components/ui/Header';
import { IconPickerDialog } from '../../../components/ui/IconPickerDialog';
import { Input } from '../../../components/ui/Input';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { CategoryType } from '../../../db/schema';
import { useCategoryById, useCreateCategory, useUpdateCategory } from '../hooks/categories';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { toDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

type Props = {
  mode: 'create' | 'edit';
  categoryId?: number;
};

type CategoryFormValues = {
  name: string;
};

const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: 'DR', label: 'Expense' },
  { value: 'CR', label: 'Income' },
  { value: 'TRANSFER', label: 'Transfer' },
];

export const CategoryFormPage = React.memo(function CategoryFormPage({ mode, categoryId }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isEdit = mode === 'edit';

  const { data: category, isLoading } = useCategoryById(isEdit ? (categoryId ?? null) : null);
  const { mutateAsync: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const isPending = isCreating || isUpdating;

  const [type, setType] = useState<CategoryType>('DR');
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[0]);
  const [iconKey, setIconKey] = useState<string>('pricetag-outline');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<CategoryFormValues>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (category) {
      reset({ name: category.name });
      setColorHex(`#${category.color.toString(16).padStart(6, '0').toUpperCase()}`);
      setIconKey(category.icon ? `${category.icon}-outline` : 'pricetag-outline');
    }
  }, [category, reset]);

  const openIconPicker = useCallback(() => setShowIconPicker(true), []);
  const closeIconPicker = useCallback(() => setShowIconPicker(false), []);

  const handleSave = handleSubmit(async (data) => {
    try {
      if (isEdit && categoryId) {
        await updateCategory({
          id: categoryId,
          data: {
            name: data.name.trim(),
            icon: iconKey.replace('-outline', ''),
            color: toDbColor(colorHex),
          },
        });
      } else {
        await createCategory({
          name: data.name.trim(),
          type,
          icon: iconKey.replace('-outline', ''),
          color: toDbColor(colorHex),
        });
      }
      router.back();
    } catch {
      Alert.alert('Error', isEdit ? 'Failed to update category.' : 'Failed to create category.');
    }
  });

  if (isEdit && isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={isEdit ? 'Edit category' : 'New category'} showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formBody}>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Name" />
            <Controller
              control={control}
              name="name"
              rules={{ required: true }}
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g. Groceries, Salary"
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoFocus={!isEdit}
                />
              )}
            />
          </View>

          {!isEdit && (
            <View style={styles.section}>
              <SectionLabel size="sm" text="Type" />
              <View style={styles.chipRow}>
                {CATEGORY_TYPES.map((catType) => {
                  const isSelected = type === catType.value;
                  return (
                    <TouchableOpacity
                      key={catType.value}
                      activeOpacity={0.7}
                      onPress={() => setType(catType.value)}
                      style={[
                        styles.chip,
                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? colors.onPrimary : colors.text }]}>
                        {catType.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <SectionLabel size="sm" text="Icon" />
            <TouchableOpacity style={styles.iconSelectorBtn} onPress={openIconPicker} activeOpacity={0.7}>
              <View style={[styles.iconPreview, { backgroundColor: colorHex + '15' }]}>
                <Ionicons name={resolveIcon(iconKey, 'pricetag-outline')} size={18} color={colorHex} />
              </View>
              <Text style={styles.iconSelectorText}>
                {iconKey.replace('-outline', '').replace(/-/g, ' ')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Color" />
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((item: string) => (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.8}
                  onPress={() => setColorHex(item)}
                  style={[
                    styles.colorCell,
                    { backgroundColor: item },
                    colorHex === item && styles.colorCellActive,
                  ]}
                >
                  {colorHex === item ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.saveBtn, (!isValid || isPending) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || isPending}
        >
          <Text style={styles.saveBtnText}>
            {isPending
              ? (isEdit ? 'Saving...' : 'Creating...')
              : (isEdit ? 'Save changes' : 'Create category')}
          </Text>
        </TouchableOpacity>
      </View>

      <IconPickerDialog
        visible={showIconPicker}
        onClose={closeIconPicker}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Category icon"
      />
    </SafeAreaView>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    chipRow: {
      flexDirection: 'row',
      gap: theme.spacing[8],
    },
    chip: {
      paddingHorizontal: theme.spacing[16],
      paddingVertical: theme.spacing[8],
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    chipText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 13,
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
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[8],
    },
    colorCell: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
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
