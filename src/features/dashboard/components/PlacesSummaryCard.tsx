import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Text } from 'react-native';
import { usePlaces, Place } from '../../places/api/places';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { SectionHeader } from './SectionHeader';
import { fromDbColor } from '../../../utils/format';

export const PlacesSummaryCard = React.memo(function PlacesSummaryCard() {
  const theme = useTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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
              <View style={[styles.avatar, { backgroundColor: fromDbColor(place.color) + '15' }]}>
                <Ionicons name={(place.icon as any) || 'location-outline'} size={24} color={fromDbColor(place.color)} />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {place.name}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/places/create')}
            activeOpacity={0.7}
          >
            <View style={styles.addIcon}>
              <Ionicons name="add" size={24} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <TouchableOpacity 
          style={styles.emptyCard} 
          onPress={() => router.push('/places/create')}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyText}>
            Track spending by location. Add your frequent places.
          </Text>
          <Text style={styles.emptyAction}>
            + Add Place
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing[24],
  },
  scrollContent: {
    paddingLeft: theme.layout.screenPadding,
    paddingRight: theme.layout.screenPadding - theme.spacing[16],
    gap: theme.spacing[16],
  },
  placeItem: {
    alignItems: 'center',
    width: 64,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[8],
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  name: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.text,
    textAlign: 'center',
  },
  addBtn: {
    alignItems: 'center',
    width: 64,
  },
  addIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[8],
    backgroundColor: theme.colors.card,
  },
  addText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  emptyCard: {
    marginHorizontal: theme.layout.screenPadding,
    padding: theme.spacing[24],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primaryDark,
    marginTop: theme.spacing[12],
  },
});
