import { Header } from '@/src/components/ui/Header';
import { IconPickerDialog } from '@/src/components/ui/IconPickerDialog';
import { CATEGORY_COLORS } from '@/src/constants/picker';
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
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCategoryById, useUpdateCategory } from '@/src/features/categories/hooks/categories';

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
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
      });
      setColorHex(`#${category.color.toString(16).padStart(6, '0').toUpperCase()}`);
      const matchedIcon = category.icon ? `${category.icon}-outline` : 'pricetag-outline';
      setIconKey(matchedIcon);
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Edit category" subtitle="Update your category details" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <Controller
            control={control}
            name="name"
            rules={{ required: 'Category name is required' }}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Groceries"
                placeholderTextColor={colors.textMuted + '50'}
                autoFocus
                style={styles.answerInput}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            )}
          />
          <View style={[styles.answerLine, errors.name && styles.answerLineError]} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Icon</Text>
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={() => setShowIconPicker(true)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconPreviewBox, { backgroundColor: colorHex + '15' }]}>
              <Ionicons name={resolveIcon(iconKey, 'pricetag-outline')} size={24} color={colorHex} />
            </View>
            <Text style={styles.iconSelectorText}>{iconKey.replace('-outline', '').replace(/-/g, ' ')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.answerLine} />
        </View>

        <View style={[styles.section, styles.sectionLast]}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {CATEGORY_COLORS.map((item: string) => (
              <TouchableOpacity
                key={item}
                activeOpacity={0.9}
                onPress={() => setColorHex(item)}
                style={[
                  styles.colorCell,
                  { backgroundColor: item },
                  colorHex === item && styles.colorCellActive,
                ]}
              >
                {colorHex === item ? <Ionicons name="checkmark" size={14} color={colors.background} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.primaryBtn, (!isValid || isPending) && styles.primaryBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || isPending}
        >
          <Text style={styles.primaryBtnText}>Save category</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <IconPickerDialog
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Select category icon"
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 120,
    },
    section: {
      paddingBottom: 22,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: 22,
    },
    sectionLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    label: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: 6,
    },
    answerInput: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 28,
      lineHeight: 34,
      color: theme.colors.text,
      letterSpacing: -0.7,
      paddingHorizontal: 0,
      paddingVertical: 4,
    },
    answerLine: {
      height: 2,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary + '30',
      marginTop: 4,
    },
    answerLineError: {
      backgroundColor: theme.colors.danger + '50',
    },
    iconSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 6,
    },
    iconPreviewBox: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconSelectorText: {
      flex: 1,
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 20,
      color: theme.colors.text,
      textTransform: 'capitalize',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorCell: {
      width: 38,
      height: 38,
      borderRadius: theme.radius.full,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderColor: theme.colors.primary,
      transform: [{ scale: 1.08 }],
    },
    footer: {
      position: 'absolute',
      bottom: 34,
      left: 24,
      right: 24,
    },
    primaryBtn: {
      height: 56,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadow.md,
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 16,
      color: theme.colors.onPrimary,
      marginRight: 10,
    },
  });
