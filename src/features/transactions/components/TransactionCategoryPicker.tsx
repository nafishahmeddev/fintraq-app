import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import type { Category } from '../../categories/api/categories';

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd?: () => void;
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

const resolveIconName = (raw: string | null | undefined): keyof typeof Ionicons.glyphMap => {
  if (raw && raw in Ionicons.glyphMap) return raw as keyof typeof Ionicons.glyphMap;
  return 'pricetag-outline';
};

export const TransactionCategoryPicker = ({ categories, selectedId, onSelect, onAdd }: Props) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.grid}>
        {categories.map((cat) => {
          const selected = selectedId === cat.id;
          const catColor = toHexColor(cat.color);
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                selected && { backgroundColor: catColor, borderColor: catColor },
              ]}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={resolveIconName(cat.icon)}
                size={14}
                color={selected ? theme.colors.background : catColor}
              />
              <Text
                style={[
                  styles.name,
                  { 
                    color: selected ? theme.colors.background : theme.colors.text,
                    fontFamily: selected ? theme.fontFamilies.sansBold : theme.fontFamilies.sansSemiBold
                  },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {onAdd && (
          <TouchableOpacity
            style={[styles.pill, styles.addPill]}
            onPress={onAdd}
            activeOpacity={0.7}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={14} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.addName}>New</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingVertical: theme.spacing[12],
      paddingHorizontal: 24,
    },
    label: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing[12],
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[8],
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
      paddingHorizontal: theme.spacing[12],
      height: 40,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      ...theme.shadow.xs,
    },
    addPill: {
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
      shadowOpacity: 0,
    },
    addIconCircle: {
      width: 22,
      height: 22,
      borderRadius: theme.radius.xs,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    name: {
      fontSize: 13,
    },
    addName: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 13,
      color: theme.colors.textMuted,
    },
  });
