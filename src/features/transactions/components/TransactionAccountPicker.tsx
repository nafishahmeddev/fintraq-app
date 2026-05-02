import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import type { Account } from '../../accounts/api/accounts';

type Props = {
  accounts: Account[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd?: () => void;
  label?: string;
};

const resolveIconName = (raw: string | null | undefined): keyof typeof Ionicons.glyphMap => {
  if (raw && raw in Ionicons.glyphMap) return raw as keyof typeof Ionicons.glyphMap;
  return 'wallet-outline';
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

export const TransactionAccountPicker = ({ accounts, selectedId, onSelect, onAdd, label = 'ACCOUNT' }: Props) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.grid}>
        {accounts.map((acc) => {
          const selected = selectedId === acc.id;
          const accColor = toHexColor(acc.color);
          return (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.pill,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                selected && { backgroundColor: accColor, borderColor: accColor },
              ]}
              onPress={() => onSelect(acc.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={resolveIconName(acc.icon)}
                size={14}
                color={selected ? theme.colors.background : accColor}
              />
              <Text
                style={[
                  styles.name, 
                  { 
                    color: selected ? theme.colors.background : theme.colors.text,
                    fontFamily: selected ? theme.fontFamilies.sansBold : theme.fontFamilies.sansSemiBold
                  }
                ]}
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
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 10,
      color: theme.colors.textMuted,
      letterSpacing: 1.5,
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
