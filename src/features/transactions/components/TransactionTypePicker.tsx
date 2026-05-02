import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { TransactionType } from '../../../types';

type Props = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  disabled?: boolean;
  allowedTypes?: TransactionType[];
};

const TYPE_CONFIG = {
  DR: { label: 'Expense', colorKey: 'danger' as const, onColorKey: 'background' as const },
  CR: { label: 'Income', colorKey: 'success' as const, onColorKey: 'background' as const },
  TRANSFER: { label: 'Transfer', colorKey: 'primary' as const, onColorKey: 'onPrimary' as const },
};

export const TransactionTypePicker = ({ value, onChange, disabled, allowedTypes }: Props) => {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const typesToRender = allowedTypes || (Object.keys(TYPE_CONFIG) as TransactionType[]);

  if (disabled) {
    const config = TYPE_CONFIG[value];
    const activeColor = colors[config.colorKey];
    const textColor = colors[config.onColorKey];

    return (
      <View style={styles.container}>
        <View style={[styles.pill, { backgroundColor: activeColor, borderColor: activeColor }]}>
          <Text style={[styles.pillText, { color: textColor, fontFamily: theme.fontFamilies.sansBold }]}>
            {config.label}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {typesToRender.map((type) => {
        const config = TYPE_CONFIG[type];
        const isSelected = value === type;
        const activeColor = colors[config.colorKey];
        const textColor = colors[config.onColorKey];

        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.pill,
              { backgroundColor: colors.card, borderColor: colors.border },
              isSelected && { backgroundColor: activeColor, borderColor: activeColor },
            ]}
            onPress={() => onChange(type)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.pillText,
              {
                color: isSelected ? textColor : colors.textMuted,
                fontFamily: isSelected ? theme.fontFamilies.sansBold : theme.fontFamilies.sansSemiBold,
              },
            ]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
  },
});
