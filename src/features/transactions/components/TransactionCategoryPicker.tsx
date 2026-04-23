import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import type { Category } from '../../categories/api/categories';

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd?: () => void;
  colors: ThemeColors;
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

const resolveIconName = (raw: string | null | undefined): keyof typeof Ionicons.glyphMap => {
  if (raw && raw in Ionicons.glyphMap) return raw as keyof typeof Ionicons.glyphMap;
  return 'pricetag-outline';
};

export const TransactionCategoryPicker = ({ categories, selectedId, onSelect, onAdd, colors }: Props) => {

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>CATEGORY</Text>
      <View style={styles.grid}>
        {categories.map((cat) => {
          const selected = selectedId === cat.id;
          const catColor = toHexColor(cat.color);
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selected && { backgroundColor: catColor, borderColor: catColor },
              ]}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={resolveIconName(cat.icon)}
                size={14}
                color={selected ? colors.background : catColor}
              />
              <Text
                style={[
                  styles.name,
                  { color: selected ? colors.background : colors.text },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {/* Add Category Button */}
        {onAdd && (
          <TouchableOpacity
            style={[styles.pill, styles.addPill]}
            onPress={onAdd}
            activeOpacity={0.8}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add-outline" size={14} color={colors.textMuted} />
            </View>
            <Text style={styles.addName}>New</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

