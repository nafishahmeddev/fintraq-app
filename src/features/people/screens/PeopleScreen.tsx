import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { usePremium } from '../../../providers/PremiumProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { fromDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { useDeletePerson, usePeople } from '../api/people';

type Person = {
  id: number;
  name: string;
  icon: string;
  color: number;
  email?: string | null;
  phone?: string | null;
};

const PersonCard = React.memo(function PersonCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Person;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createCardStyles(theme), [theme]);
  const personColor = fromDbColor(item.color);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={[styles.accentStrip, { backgroundColor: personColor }]} />
      <View style={styles.cardBody}>
        <View style={[styles.avatar, { backgroundColor: personColor + '20' }]}>
          <Ionicons name={resolveIcon(item.icon, 'person-outline')} size={22} color={personColor} />
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>{item.name}</Text>
          {(item.email || item.phone) && (
            <Text style={styles.personMeta} numberOfLines={1}>{item.email || item.phone}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
      </View>
    </TouchableOpacity>
  );
});

export const PeopleScreen = React.memo(function PeopleScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { isPremium, showAlert } = usePremium();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: people, isLoading: loadingPeople } = usePeople();
  const { mutate: deletePerson } = useDeletePerson();

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreate = useCallback(() => {
    if (!isPremium && (people?.length || 0) >= 5) {
      showAlert({
        title: 'Limit reached',
        message: 'Free users can track up to 5 people. Upgrade to Pro for unlimited contacts!',
        type: 'warning',
        buttons: [
          { text: 'Maybe later', style: 'cancel' },
          { text: 'Upgrade now', onPress: () => router.push('/premium') },
        ],
      });
      return;
    }
    router.push('/people/create');
  }, [router, isPremium, people, showAlert]);

  const handlePersonPress = useCallback((id: number) => {
    router.push(`/people/details/${id}`);
  }, [router]);

  const options = useMemo(() => [
    {
      key: 'view',
      label: 'View history',
      icon: 'time-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedPerson) handlePersonPress(selectedPerson.id);
      },
    },
    {
      key: 'edit',
      label: 'Edit person',
      icon: 'create-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedPerson) router.push(`/people/edit/${selectedPerson.id}`);
      },
    },
    {
      key: 'delete',
      label: 'Delete person',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => {
        setShowOptions(false);
        setShowDeleteConfirm(true);
      },
    },
  ], [selectedPerson, handlePersonPress, router]);

  const renderItem = useCallback(({ item }: { item: Person }) => (
    <PersonCard
      item={item}
      onPress={() => handlePersonPress(item.id)}
      onLongPress={() => { setSelectedPerson(item); setShowOptions(true); }}
    />
  ), [handlePersonPress]);

  const keyExtractor = useCallback((item: Person) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="People"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleCreate} activeOpacity={0.75}>
            <Ionicons name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {loadingPeople ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={people as Person[]}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptyText}>Track transactions with people you know.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate} activeOpacity={0.8}>
                <Text style={styles.emptyBtnText}>Add first person</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <OptionsDialog
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        title="Person options"
        subtitle={selectedPerson?.name}
        options={options}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete person"
        message={`Delete "${selectedPerson?.name}"? Linked transactions and loans will remain but won't be associated with this person.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selectedPerson) deletePerson(selectedPerson.id);
          setShowDeleteConfirm(false);
        }}
      />
    </SafeAreaView>
  );
});

const createCardStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    overflow: 'hidden',
  },
  accentStrip: {
    height: 3,
    width: '100%',
    opacity: 0.7,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[16],
    gap: theme.spacing[12],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInfo: {
    flex: 1,
    gap: 3,
  },
  personName: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  personMeta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
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
  },
  listContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[16],
    paddingBottom: 40,
    gap: theme.spacing[12],
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  emptyTitle: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
    marginTop: theme.spacing[8],
  },
  emptyText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyBtn: {
    marginTop: theme.spacing[8],
    height: 40,
    paddingHorizontal: theme.spacing[20],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtnText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
});
