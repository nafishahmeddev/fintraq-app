import { Header } from '@/src/components/ui/Header';
import { IconPickerDialog } from '@/src/components/ui/IconPickerDialog';
import { Input } from '@/src/components/ui/Input';
import { SectionLabel } from '@/src/components/ui/SectionLabel';
import { CATEGORY_COLORS } from '@/src/constants/picker';
import { useCategoryById, useUpdateCategory } from '@/src/features/categories/hooks/categories';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { toDbColor } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

type CategoryFormValues = {
  name: string;
};

export default function CategoryEditPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const categoryId = parseInt(id, 10);
  const { data: category, isLoading } = useCategoryById(categoryId);
  const { mutateAsync: updateCategory, isPending } = useUpdateCategory();

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

  const handleSave = handleSubmit(async (data) => {
    const payload = {
      name: data.name.trim(),
      icon: iconKey.replace('-outline', ''),
      color: toDbColor(colorHex),
    };

    try {
      await updateCategory({ id: categoryId, data: payload });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update category. Please try again.');
    }
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Edit category" showBack />

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
                />
              )}
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
            {isPending ? 'Saving...' : 'Save changes'}
          </Text>
        </TouchableOpacity>
      </View>

      <IconPickerDialog
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Category icon"
      />
    </SafeAreaView>
  );
}

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
