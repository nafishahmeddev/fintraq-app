import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import type { Account } from '../../accounts/api/accounts';

type Props = {
  accounts: Account[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd?: () => void;
  colors: ThemeColors;
  label?: string;
};

const resolveIconName = (raw: string | null | undefined): keyof typeof Ionicons.glyphMap => {
  if (raw && raw in Ionicons.glyphMap) return raw as keyof typeof Ionicons.glyphMap;
  return 'wallet-outline';
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

export const TransactionAccountPicker = ({ accounts, selectedId, onSelect, onAdd, colors, label = 'ACCOUNT' }: Props) => {

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.grid}>
        {accounts.map((acc) => {
          const selected = selectedId === acc.id;
          const accColor = toHexColor(acc.color);
          return (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.pill,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selected && { backgroundColor: accColor, borderColor: accColor },
              ]}
              onPress={() => onSelect(acc.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={resolveIconName(acc.icon)}
                size={14}
                color={selected ? colors.background : accColor}
              />
              <Text
                style={[styles.name, { color: selected ? colors.background : colors.text }]}
                numberOfLines={1}
              >
                {acc.name}
              </Text>
            </TouchableOpacity>
          );
        })}

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

