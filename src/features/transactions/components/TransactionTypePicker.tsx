import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { TransactionType } from '../../../types';

type Props = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  disabled?: boolean;
  allowedTypes?: TransactionType[];
};

const TYPE_CONFIG: Record<TransactionType, {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  colorKey: 'danger' | 'success' | 'primary';
}> = {
  DR:       { label: 'Expense',  icon: 'arrow-down-outline',       colorKey: 'danger'   },
  CR:       { label: 'Income',   icon: 'arrow-up-outline',         colorKey: 'success'  },
  TRANSFER: { label: 'Transfer', icon: 'swap-horizontal-outline',  colorKey: 'primary'  },
};

export const TransactionTypePicker = React.memo(function TransactionTypePicker({
  value,
  onChange,
  disabled,
  allowedTypes,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const types = useMemo(
    () => allowedTypes ?? (Object.keys(TYPE_CONFIG) as TransactionType[]),
    [allowedTypes]
  );

  return (
    <View style={styles.rail}>
      {types.map((type) => {
        const config = TYPE_CONFIG[type];
        const isActive = value === type;
        const isGhosted = disabled && !isActive;
        const activeColor = colors[config.colorKey];

        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.pill,
              isActive && { backgroundColor: activeColor },
              isGhosted && styles.pillGhosted,
            ]}
            onPress={() => !disabled && onChange(type)}
            activeOpacity={disabled ? 1 : 0.75}
          >
            <Ionicons
              name={config.icon}
              size={15}
              color={isActive ? '#fff' : isGhosted ? colors.textFaint : colors.textMuted}
            />
            <Text style={[
              styles.label,
              isActive && styles.labelActive,
              isGhosted && styles.labelGhosted,
            ]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  rail: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.radius['3xl'],
    marginHorizontal: theme.layout.screenPadding,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
    borderRadius: theme.radius.xl,
  },
  pillGhosted: {
    opacity: 0.35,
  },
  label: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  labelActive: {
    color: '#fff',
  },
  labelGhosted: {
    color: theme.colors.textFaint,
  },
});
