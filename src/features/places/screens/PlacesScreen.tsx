import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ConfirmDialog, EmptyState, Header, OptionsDialog, Typography } from '../../../components/ui';
import { usePremium } from '../../../providers/PremiumProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useDeletePlace, usePlaces, Place } from '../api/places';
import { fromDbColor } from '../../../utils/format';

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
          { text: 'Upgrade now', onPress: () => router.push('/premium') }
        ]
      });
      return;
    }
    router.push('/places/create');
  }, [router, isPremium, places, showAlert]);

  const handlePlacePress = useCallback((id: number) => {
    router.push(`/places/details/${id}`);
  }, [router]);

  const handlePlaceLongPress = useCallback((place: Place) => {
    setSelectedPlace(place);
    setShowOptions(true);
  }, []);

  const options = useMemo(() => [
    {
      key: 'view',
      label: 'View history',
      icon: 'time-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedPlace) handlePlacePress(selectedPlace.id);
      }
    },
    {
      key: 'edit',
      label: 'Edit place',
      icon: 'create-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedPlace) router.push(`/places/edit/${selectedPlace.id}`);
      }
    },
    {
      key: 'delete',
      label: 'Delete place',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => {
        setShowOptions(false);
        setShowDeleteConfirm(true);
      }
    }
  ], [selectedPlace, handlePlacePress, router]);

  const renderItem = useCallback(({ item }: { item: Place }) => {
    return (
      <Card size="lg" variant="outlined" shadow="none" style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePlacePress(item.id)}
          onLongPress={() => handlePlaceLongPress(item)}
          style={styles.cardContent}
        >
          <View style={[styles.avatar, { backgroundColor: fromDbColor(item.color) + '20' }]}>
            <Ionicons name={(item.icon as any) || 'location'} size={24} color={fromDbColor(item.color)} />
          </View>
          <View style={styles.placeInfo}>
            <Typography variant="h3" numberOfLines={1}>{item.name}</Typography>
            {item.description && (
              <Typography variant="bodySm" color={colors.textMuted} numberOfLines={1}>
                {item.description}
              </Typography>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>
      </Card>
    );
  }, [colors, styles, handlePlacePress, handlePlaceLongPress]);

  const keyExtractor = useCallback((item: Place) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Places" 
        
        showBack 
        rightAction={
          <TouchableOpacity onPress={handleCreate} style={styles.headerBtn}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
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
            <EmptyState
              title="No places found"
             
              icon="location-outline"
              actionLabel="Add first place"
              onAction={handleCreate}
            />
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
        message={`Are you sure you want to delete "${selectedPlace?.name}"? Linked transactions will remain but won't be associated with this place.`}
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
  placeInfo: {
    flex: 1,
    gap: 2,
  },
});
