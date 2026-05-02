import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ConfirmDialog, EmptyState, Header, OptionsDialog, Typography } from '../../../components/ui';
import { usePremium } from '../../../providers/PremiumProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useDeletePerson, usePeople } from '../api/people';
import { fromDbColor } from '../../../utils/format';

export const PeopleScreen = React.memo(function PeopleScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { isPremium, showAlert } = usePremium();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: people, isLoading: loadingPeople } = usePeople();
  const { mutate: deletePerson } = useDeletePerson();

  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
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
          { text: 'Upgrade now', onPress: () => router.push('/premium') }
        ]
      });
      return;
    }
    router.push('/people/create');
  }, [router, isPremium, people, showAlert]);

  const handlePersonPress = useCallback((id: number) => {
    router.push(`/people/details/${id}`);
  }, [router]);

  const handlePersonLongPress = useCallback((person: any) => {
    setSelectedPerson(person);
    setShowOptions(true);
  }, []);

  const options = useMemo(() => [
    {
      key: 'view',
      label: 'View history',
      icon: 'time-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedPerson) handlePersonPress(selectedPerson.id);
      }
    },
    {
      key: 'edit',
      label: 'Edit person',
      icon: 'create-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedPerson) router.push(`/people/edit/${selectedPerson.id}`);
      }
    },
    {
      key: 'delete',
      label: 'Delete person',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => {
        setShowOptions(false);
        setShowDeleteConfirm(true);
      }
    }
  ], [selectedPerson, handlePersonPress, router]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <Card size="lg" variant="outlined" shadow="none" style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePersonPress(item.id)}
          onLongPress={() => handlePersonLongPress(item)}
          style={styles.cardContent}
        >
          <View style={[styles.avatar, { backgroundColor: fromDbColor(item.color) + '20' }]}>
            <Ionicons name={item.icon || 'person'} size={24} color={fromDbColor(item.color)} />
          </View>
          <View style={styles.personInfo}>
            <Typography variant="h3" numberOfLines={1}>{item.name}</Typography>
            {(item.email || item.phone) && (
              <Typography variant="bodySm" color={colors.textMuted} numberOfLines={1}>
                {item.email || item.phone}
              </Typography>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>
      </Card>
    );
  }, [colors, styles, handlePersonPress, handlePersonLongPress]);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="People" 
        subtitle="Manage contacts & relationships" 
        showBack 
        rightAction={
          <TouchableOpacity onPress={handleCreate} style={styles.headerBtn}>
            <Ionicons name="person-add" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {loadingPeople ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <EmptyState
              title="No contacts found"
              subtitle="Add people to track money lent or borrowed from them."
              icon="people-outline"
              actionLabel="Add first person"
              onAction={handleCreate}
            />
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
        message={`Are you sure you want to delete "${selectedPerson?.name}"? Linked transactions and loans will remain but won't be associated with this person.`}
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
  headerBtn: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInfo: {
    flex: 1,
    gap: 2,
  },
});
