import { Ionicons } from '@expo/vector-icons';
import { resolveIcon } from '../../../utils/icons';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
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
      <View style={[styles.cardGlow, { backgroundColor: catColor + '15' }]} />

      <View style={styles.cardTopRow}>
        <View style={[styles.categoryIconBox, { backgroundColor: catColor + '15' }]}>
          <Ionicons name={resolveIcon(item.icon, 'grid-outline')} size={20} color={catColor} />
        </View>
        <View style={[styles.typeBadge, item.type === 'DR' ? styles.typeBadgeDanger : styles.typeBadgeSuccess]}>
          <Text style={[styles.typeBadgeText, item.type === 'DR' ? styles.typeBadgeTextDanger : styles.typeBadgeTextSuccess]}>
            {item.type === 'DR' ? 'Expense' : 'Income'}
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

const createStyles = (theme: Theme) => StyleSheet.create({
  categoryCard: {
    position: 'relative',
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    overflow: 'hidden',
    minHeight: 156,
  },
  categoryCardLeft: {
    marginRight: 6,
  },
  categoryCardRight: {
    marginLeft: 6,
  },
  cardGlow: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 88,
    height: 88,
    borderRadius: theme.radius.full,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconBox: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeBadge: {
    height: 22,
    borderRadius: theme.radius.full,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeDanger: {
    backgroundColor: theme.colors.danger + '15',
  },
  typeBadgeSuccess: {
    backgroundColor: theme.colors.success + '15',
  },
  typeBadgeText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  typeBadgeTextDanger: {
    color: theme.colors.danger,
  },
  typeBadgeTextSuccess: {
    color: theme.colors.success,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  categoryName: {
    fontFamily: theme.fontFamilies.sansBold,
    color: theme.colors.text,
    fontSize: 18,
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  categorySubtext: {
    fontFamily: theme.fontFamilies.sans,
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooterText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.2,
    color: theme.colors.textMuted,
  },
});
