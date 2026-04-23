import { Ionicons } from '@expo/vector-icons';
import { resolveIcon } from '../../../utils/icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,

    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../../constants/picker';
import { useTheme } from '../../../providers/ThemeProvider';
import { Category } from '../api/categories';
import { useCreateCategory, useUpdateCategory } from '../hooks/categories';
import { CategoryType } from '../../../db/schema';

type CategoryFormValues = {
  name: string;
};

export type CategoryFormModalProps = {
  visible: boolean;
  onClose: () => void;
  category?: Category;
};

export function CategoryFormModal({ visible, onClose, category }: CategoryFormModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isEditing = !!category;
  const ModalWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();

  const [type, setType] = useState<CategoryType>('DR');
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[0]);

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
    if (!visible) return;

    if (category) {
      reset({
        name: category.name,
      });
      setType(category.type);
      setIcon(typeof category.icon === 'string' ? category.icon : CATEGORY_ICONS[0]);
      setColorHex(`#${category.color.toString(16).padStart(6, '0').toUpperCase()}`);
      return;
    }

    reset({ name: '' });
    setType('DR');
    setIcon(CATEGORY_ICONS[0]);
    setColorHex(CATEGORY_COLORS[0]);
  }, [category, visible, reset]);

  const handleSave = handleSubmit(async (data) => {
    const payload = {
      name: data.name.trim(),
      type,
      icon,
      color: parseInt(colorHex.replace('#', ''), 16),
    };

    try {
      if (isEditing && category) {
        await updateCategory({ id: category.id, data: payload });
      } else {
        await createCategory(payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <ModalWrapper
        style={styles.overlay}
        {...(Platform.OS === 'ios' ? { behavior: 'padding' as const, keyboardVerticalOffset: 0 } : {})}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View className="absolute inset-0" pointerEvents="none">
            <View style={[styles.glow, { top: -70, left: -70, width: 330, height: 330, backgroundColor: colors.primary + '2E' }]} />
            <View style={[styles.glow, { top: 260, right: -140, width: 480, height: 480, backgroundColor: colors.text + '0E' }]} />
            <View style={[styles.glow, { bottom: -90, left: 40, width: 320, height: 320, backgroundColor: colors.primary + '1C' }]} />
          </View>

          <BlurView
            blurAmount={Platform.OS === 'ios' ? 80 : 96}
            blurType={isDark ? 'dark' : 'light'}
            className="absolute inset-0"
          />

          {Platform.OS === 'android' && (
            <View
              pointerEvents="none"
              className="absolute inset-0" style={[ { backgroundColor: colors.background + '60' }]}
            />
          )}

          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isEditing ? 'Edit Category' : 'New Category'}</Text>
              <Text style={styles.subtitle}>Make your transaction groups clear and clean</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeTabsRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => !isEditing && setType('DR')}
                  disabled={isEditing}
                  style={[styles.typeTab, type === 'DR' && styles.typeTabActive]}
                >
                  <Text style={[styles.typeTabText, type === 'DR' && styles.typeTabTextActive]}>EXPENSE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => !isEditing && setType('CR')}
                  disabled={isEditing}
                  style={[styles.typeTab, type === 'CR' && styles.typeTabActive]}
                >
                  <Text style={[styles.typeTabText, type === 'CR' && styles.typeTabTextActive]}>INCOME</Text>
                </TouchableOpacity>
              </View>
              {isEditing && <Text style={styles.lockHint}>Type cannot be changed for existing categories</Text>}
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
                    autoFocus={!isEditing}
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
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setIcon(item)}
                    style={[
                      styles.iconCell,
                      icon === item && { backgroundColor: colorHex, borderColor: colorHex },
                      icon === item && styles.iconCellActive,
                    ]}
                  >
                    <Ionicons name={resolveIcon(item, 'grid-outline')} size={18} color={icon === item ? '#000100' : colors.text} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.section, styles.sectionLast]}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map((item) => (
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

          <View
            style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, Platform.OS === 'ios' ? 36 : 22) }]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={styles.primaryBtnText}>{isEditing ? 'Save Category' : 'Create Category'}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ModalWrapper>
    </Modal>
  );
}

