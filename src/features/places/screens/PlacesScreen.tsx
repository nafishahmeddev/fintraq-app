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
import { useDeletePlace, usePlaces, Place } from '../api/places';

export const PlacesScreen = React.memo(function PlacesScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { isPremium, showAlert } = usePremium();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: places, isLoading: loadingPlaces } = usePlaces();
  const { mutate: deletePlace } = useDeletePlace();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreate = useCallback(() => {
    if (!isPremium && (places?.length || 0) >= 5) {
      showAlert({
        title: 'Limit reached',
        message: 'Free users can track up to 5 places. Upgrade to Pro for unlimited locations!',
        type: 'warning',
        buttons: [
          { text: 'Maybe later', style: 'cancel' },
          { text: 'Upgrade now', onPress: () => router.push('/premium') },
        ],
      });
      return;
    }
    router.push('/places/create');
  }, [router, isPremium, places, showAlert]);

  const handlePlacePress = useCallback((id: number) => {
    router.push(`/places/details/${id}`);
  }, [router]);

  const options = useMemo(() => [
    {
      key: 'view',
      label: 'View history',
      icon: 'time-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedPlace) handlePlacePress(selectedPlace.id);
      },
    },
    {
      key: 'edit',
      label: 'Edit place',
      icon: 'create-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedPlace) router.push(`/places/edit/${selectedPlace.id}`);
      },
    },
    {
      key: 'delete',
      label: 'Delete place',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => {
        setShowOptions(false);
        setShowDeleteConfirm(true);
      },
    },
  ], [selectedPlace, handlePlacePress, router]);

  const renderItem = useCallback(({ item }: { item: Place }) => {
    const placeColor = fromDbColor(item.color);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handlePlacePress(item.id)}
        onLongPress={() => {
          setSelectedPlace(item);
          setShowOptions(true);
        }}
      >
        <View style={[styles.avatar, { backgroundColor: placeColor + '20' }]}>
          <Ionicons name={resolveIcon(item.icon, 'location-outline')} size={24} color={placeColor} />
        </View>
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
          {item.description && (
            <Text style={styles.placeMeta} numberOfLines={1}>{item.description}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </TouchableOpacity>
    );
  }, [colors, styles, handlePlacePress]);

  const keyExtractor = useCallback((item: Place) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Places"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleCreate} activeOpacity={0.75}>
            <Ionicons name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {loadingPlaces ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={places}
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
              <Ionicons name="location-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No places yet</Text>
              <Text style={styles.emptyText}>Tag transactions with locations you visit.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate} activeOpacity={0.8}>
                <Text style={styles.emptyBtnText}>Add first place</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <OptionsDialog
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        title="Place options"
        subtitle={selectedPlace?.name}
        options={options}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete place"
        message={`Delete "${selectedPlace?.name}"? Linked transactions will remain but won't be associated with this place.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selectedPlace) deletePlace(selectedPlace.id);
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
  listContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[16],
    paddingBottom: 40,
    gap: theme.spacing[12],
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    padding: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[16],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    gap: 3,
  },
  placeName: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  placeMeta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
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
