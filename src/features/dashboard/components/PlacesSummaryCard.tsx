import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { usePlaces, Place } from '../../places/api/places';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { radius, spacing, LAYOUT } from '../../../theme/tokens';
import { Typography } from '../../../components/ui';
import { SectionHeader } from './SectionHeader';
import { fromDbColor } from '../../../utils/format';

export const PlacesSummaryCard = React.memo(function PlacesSummaryCard() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { data: places, isLoading } = usePlaces();

  const hasPlaces = places && places.length > 0;

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="PLACES" 
        rightText={hasPlaces ? "See all" : "New"} 
        onPressRight={() => router.push(hasPlaces ? '/places' : '/places/create')} 
      />

      {hasPlaces ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {places.slice(0, 8).map((place: Place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeItem}
              onPress={() => router.push(`/places/details/${place.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: fromDbColor(place.color) + '20' }]}>
                <Ionicons name={(place.icon as any) || 'location'} size={24} color={fromDbColor(place.color)} />
              </View>
              <Typography variant="label" numberOfLines={1} style={styles.name}>
                {place.name}
              </Typography>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/places/create')}
            activeOpacity={0.7}
          >
            <View style={[styles.addIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="add" size={24} color={colors.textMuted} />
            </View>
            <Typography variant="label" color={colors.textMuted}>Add</Typography>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <TouchableOpacity 
          style={styles.emptyCard} 
          onPress={() => router.push('/places/create')}
          activeOpacity={0.7}
        >
          <Typography variant="bodySm" color={colors.textMuted} align="center">
            Track spending by location. Add your frequent places.
          </Typography>
          <Typography variant="bodySm" color={colors.primary} weight="bold" style={{ marginTop: spacing('2') }}>
            + Add Place
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing('6'),
  },
  scrollContent: {
    paddingLeft: LAYOUT.screenPadding,
    paddingRight: LAYOUT.screenPadding - spacing('4'),
    gap: spacing('4'),
  },
  placeItem: {
    alignItems: 'center',
    width: 64,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius('full'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing('2'),
  },
  name: {
    fontSize: 10,
    textAlign: 'center',
  },
  addBtn: {
    alignItems: 'center',
    width: 64,
  },
  addIcon: {
    width: 56,
    height: 56,
    borderRadius: radius('full'),
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing('2'),
  },
  emptyCard: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: spacing('6'),
    borderRadius: radius('xl'),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
