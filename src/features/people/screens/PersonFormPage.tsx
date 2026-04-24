import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Input, Button, IconPickerDialog, Typography } from '../../../components/ui';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { spacing, LAYOUT, radius } from '../../../theme/tokens';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { toDbColor, fromDbColor } from '../../../utils/format';
import { useCreatePerson, useUpdatePerson, usePersonById } from '../api/people';

type Props = {
  mode: 'create' | 'edit';
  personId?: number | null;
};

export const PersonFormPage = React.memo(function PersonFormPage({ mode, personId }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      <Header 
        title={isEditMode ? 'Edit Person' : 'New Person'} 
        showBack 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Typography variant="label">Name</Typography>
          <Input
            placeholder="e.g. John Doe"
            value={name}
            onChangeText={setName}
            autoFocus={!isEditMode}
          />
        </View>

        <View style={styles.section}>
          <Typography variant="label">Contact Info (Optional)</Typography>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={[styles.row, { marginTop: spacing('2') }]}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="label">Appearance</Typography>
          <View style={styles.visualsRow}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => setShowIconPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colorHex + '20' }]}>
                <Ionicons name={iconKey as any} size={24} color={colorHex} />
              </View>
              <Typography variant="bodySm" color={colors.textMuted}>Icon</Typography>
            </TouchableOpacity>

            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.slice(0, 10).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    colorHex === c && { borderWidth: 2, borderColor: colors.text }
                  ]}
                  onPress={() => setColorHex(c)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isEditMode ? 'Update Person' : 'Add Person'}
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
        title="Person Icon"
      />
    </SafeAreaView>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: spacing('4'),
    paddingBottom: spacing('12'),
    gap: spacing('6'),
  },
  section: {
    gap: spacing('2'),
  },
  row: {
    flexDirection: 'row',
    gap: spacing('4'),
  },
  visualsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('6'),
    padding: spacing('4'),
    backgroundColor: colors.surface,
    borderRadius: radius('lg'),
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtn: {
    alignItems: 'center',
    gap: spacing('2'),
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius('md'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing('2'),
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  footer: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: spacing('6'),
    paddingTop: spacing('2'),
    backgroundColor: colors.background,
  },
});
