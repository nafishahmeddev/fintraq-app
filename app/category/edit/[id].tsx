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
import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { Header } from '@/src/components/ui/Header';
import { IconPickerDialog } from '@/src/components/ui/IconPickerDialog';
import { CATEGORY_COLORS } from '@/src/constants/picker';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemeColors } from '@/src/theme/colors';
import { TYPOGRAPHY } from '@/src/theme/typography';
import { toDbColor } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';

import { useCategoryById, useUpdateCategory } from '@/src/features/categories/hooks/categories';

type CategoryFormValues = {
  name: string;
};

export default function CategoryEditPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
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
        <BlurBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title="Edit Category" subtitle="Update your category details" showBack />

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
            <View style={[styles.iconPreviewBox, { backgroundColor: colorHex + '20' }]}>
              <Ionicons name={resolveIcon(iconKey, 'pricetag-outline')} size={24} color={colorHex} />
            </View>
            <Text style={styles.iconSelectorText}>{iconKey.replace('-outline', '').replace('-', ' ')}</Text>
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
                {colorHex === item ? <Ionicons name="checkmark" size={14} color="#000100" /> : null}
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
          <Text style={styles.primaryBtnText}>Save Category</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      <IconPickerDialog
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Select Category Icon"
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      borderBottomColor: colors.border,
      marginBottom: 22,
    },
    sectionLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    label: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 13,
      color: colors.textMuted,
      letterSpacing: 0.1,
      marginBottom: 6,
    },
    answerInput: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.7,
      paddingHorizontal: 0,
      paddingVertical: 4,
    },
    answerLine: {
      height: 2,
      borderRadius: 999,
      backgroundColor: colors.primary + '55',
      marginTop: 4,
    },
    answerLineError: {
      backgroundColor: colors.danger + '88',
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
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconSelectorText: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 20,
      color: colors.text,
      textTransform: 'capitalize',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    colorCell: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderColor: colors.text,
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
      borderRadius: 16,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: 0.3,
      marginRight: 10,
    },
  });
