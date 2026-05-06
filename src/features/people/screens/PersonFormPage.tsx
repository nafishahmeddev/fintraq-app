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
import { Header, IconPickerDialog, Input, SectionLabel } from '../../../components/ui';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { fromDbColor, toDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { useCreatePerson, usePersonById, useUpdatePerson } from '../api/people';

type Props = {
  mode: 'create' | 'edit';
  personId?: number | null;
};

export const PersonFormPage = React.memo(function PersonFormPage({ mode, personId }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isEditMode = mode === 'edit';
  const { data: editingPerson, isLoading: loadingPerson } = usePersonById(isEditMode ? personId ?? null : null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [iconKey, setIconKey] = useState('person-outline');
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { mutateAsync: createPerson } = useCreatePerson();
  const { mutateAsync: updatePerson } = useUpdatePerson();

  useEffect(() => {
    if (editingPerson) {
      setName(editingPerson.name);
      setEmail(editingPerson.email || '');
      setPhone(editingPerson.phone || '');
      setIconKey(editingPerson.icon + '-outline');
      setColorHex(fromDbColor(editingPerson.color));
    }
  }, [editingPerson]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        icon: iconKey.replace('-outline', ''),
        color: toDbColor(colorHex),
      };

      if (isEditMode && personId) {
        await updatePerson({ id: personId, data: payload });
      } else {
        await createPerson(payload);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save person. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, email, phone, iconKey, colorHex, isEditMode, personId, createPerson, updatePerson, router]);

  if (loadingPerson) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title={isEditMode ? 'Edit person' : 'New person'} showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formBody}>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Name" />
            <Input
              placeholder="e.g. John Doe"
              value={name}
              onChangeText={setName}
              autoFocus={!isEditMode}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Contact info (optional)" />
            <Input
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
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
                <Ionicons name={resolveIcon(iconKey, 'person-outline')} size={18} color={colorHex} />
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
              {isEditMode ? 'Update person' : 'Add person'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <IconPickerDialog
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Person icon"
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
