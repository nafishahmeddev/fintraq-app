import { Header } from '@/src/components/ui/Header';
import { IconPickerDialog } from '@/src/components/ui/IconPickerDialog';
import { CATEGORY_COLORS } from '@/src/constants/picker';
import { CategoryType } from '@/src/db/schema';
import { useCreateCategory } from '@/src/features/categories/hooks/categories';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { toDbColor } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CategoryFormValues = {
  name: string;
};

const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: 'DR', label: 'Expense' },
  { value: 'CR', label: 'Income' },
  { value: 'TRANSFER', label: 'Transfer' },
];

export default function CategoryCreatePage() {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { mutateAsync: createCategory, isPending } = useCreateCategory();

  const [type, setType] = useState<CategoryType>('DR');
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[0]);
  const [iconKey, setIconKey] = useState<string>('pricetag-outline');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const handleSave = handleSubmit(async (data) => {
    const payload = {
      name: data.name.trim(),
      type,
      icon: iconKey.replace('-outline', ''),
      color: toDbColor(colorHex),
    };

    try {
      await createCategory(payload);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to create category. Please try again.');
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header title="New category" subtitle="Organize your transactions" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeTabsRow}>
            {CATEGORY_TYPES.map((catType) => (
              <TouchableOpacity
                key={catType.value}
                activeOpacity={0.9}
                onPress={() => setType(catType.value)}
                style={[
                  styles.typeTab,
                  type === catType.value && styles.typeTabActive,
                ]}
              >
                <Text style={[styles.typeTabText, type === catType.value && styles.typeTabTextActive]}>
                  {catType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
                {colorHex === item ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
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
          <Text style={styles.primaryBtnText}>Create category</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
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
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 13,
      color: theme.colors.textMuted,
      letterSpacing: 0.1,
      marginBottom: 6,
    },
    typeTabsRow: {
      flexDirection: 'row',
      gap: 8,
      alignSelf: 'flex-start',
    },
    typeTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    typeTabActive: {
      backgroundColor: theme.colors.text,
      borderColor: theme.colors.text,
    },
    typeTabText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 11,
      color: theme.colors.textMuted,
      letterSpacing: 0.4,
    },
    typeTabTextActive: {
      color: theme.colors.background,
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
      borderRadius: theme.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      borderColor: theme.colors.text,
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
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.3,
      marginRight: 10,
    },
  });
