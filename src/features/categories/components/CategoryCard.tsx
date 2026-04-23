import { Ionicons } from '@expo/vector-icons';
import { resolveIcon } from '../../../utils/icons';
import React, { useMemo, useCallback } from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import { Category } from '../api/categories';

interface CategoryCardProps {
  item: Category;
  index: number;
  colors: ThemeColors;
  onPress: (item: Category) => void;
  onLongPress: (item: Category) => void;
}

export const CategoryCard = React.memo(function CategoryCard({
  item,
  index,
  colors,
  onPress,
  onLongPress,
}: CategoryCardProps) {
  const catColor = useMemo(() =>
    item.color ? '#' + item.color.toString(16).padStart(6, '0') : colors.primary,
    [item.color, colors.primary]
  );

  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  const handleLongPress = useCallback(() => {
    onLongPress(item);
  }, [onLongPress, item]);

  const cardStyle = useMemo(() => [
    styles.categoryCard,
    index % 2 === 0 ? styles.categoryCardLeft : styles.categoryCardRight,
  ], [styles, index]);

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={280}
      activeOpacity={0.92}
    >
      <View style={[styles.cardGlow, { backgroundColor: catColor + '30' }]} />

      <View style={styles.cardTopRow}>
        <View style={[styles.categoryIconBox, { backgroundColor: catColor + '22' }]}>
          <Ionicons name={resolveIcon(item.icon, 'grid-outline')} size={20} color={catColor} />
        </View>
        <View style={[styles.typeBadge, item.type === 'DR' ? styles.typeBadgeDanger : styles.typeBadgeSuccess]}>
          <Text style={[styles.typeBadgeText, item.type === 'DR' ? styles.typeBadgeTextDanger : styles.typeBadgeTextSuccess]}>
            {item.type === 'DR' ? 'EXPENSE' : 'INCOME'}
          </Text>
        </View>
      </View>

      <View style={styles.cardMainRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.categorySubtext}>Tap to edit</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>Hold for options</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

