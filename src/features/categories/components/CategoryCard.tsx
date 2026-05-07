import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../../providers/ThemeProvider';
import { resolveIcon } from '../../../utils/icons';
import { Category } from '../api/categories';

interface CategoryCardProps {
  item: Category;
  index: number;
  theme: Theme;
  onPress: (item: Category) => void;
  onLongPress: (item: Category) => void;
}

export const CategoryCard = React.memo(function CategoryCard({
  item,
  index,
  theme,
  onPress,
  onLongPress,
}: CategoryCardProps) {
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const catColor = useMemo(
    () => item.color ? '#' + item.color.toString(16).padStart(6, '0') : colors.primary,
    [item.color, colors.primary]
  );

  const handlePress = useCallback(() => onPress(item), [onPress, item]);
  const handleLongPress = useCallback(() => onLongPress(item), [onLongPress, item]);

  const isExpense = item.type === 'DR';

  return (
    <TouchableOpacity
      style={[styles.card, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={280}
      activeOpacity={0.85}
    >
      <View style={[styles.glow, { backgroundColor: catColor + '18' }]} />

      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: catColor + '20' }]}>
          <Ionicons name={resolveIcon(item.icon, 'grid-outline')} size={20} color={catColor} />
        </View>
        <View style={[styles.typeBadge, { backgroundColor: isExpense ? colors.dangerSubtle : colors.successSubtle }]}>
          <Text style={[styles.typeBadgeText, { color: isExpense ? colors.danger : colors.success }]}>
            {isExpense ? 'Expense' : 'Income'}
          </Text>
        </View>
      </View>

      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.hint}>Hold for options</Text>
    </TouchableOpacity>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    position: 'relative',
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    minHeight: 148,
  },
  cardLeft: {
    marginRight: 6,
  },
  cardRight: {
    marginLeft: 6,
  },
  glow: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: theme.radius.full,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    height: 22,
    borderRadius: theme.radius.full,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
  },
  name: {
    fontFamily: theme.fontFamilies.sansBold,
    color: theme.colors.text,
    fontSize: 18,
    letterSpacing: -0.5,
    lineHeight: 22,
    flex: 1,
  },
  hint: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 10,
    color: theme.colors.textFaint,
    marginTop: 'auto',
    paddingTop: 10,
  },
});
