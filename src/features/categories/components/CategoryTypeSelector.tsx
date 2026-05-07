import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryType } from '../../../db/schema';
import { Theme } from '../../../providers/ThemeProvider';

interface CategoryTypeSelectorProps {
  activeType: CategoryType;
  onTypeChange: (type: CategoryType) => void;
  theme: Theme;
}

const TYPE_CONFIG: Record<CategoryType, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  DR: { label: 'Expenses', icon: 'arrow-down-circle-outline' },
  CR: { label: 'Income', icon: 'arrow-up-circle-outline' },
  TRANSFER: { label: 'Transfer', icon: 'swap-horizontal-outline' },
};

export const CategoryTypeSelector: React.FC<CategoryTypeSelectorProps> = ({
  activeType,
  onTypeChange,
  theme,
}) => {
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.rail}>
      {(Object.keys(TYPE_CONFIG) as CategoryType[]).map((type) => {
        const config = TYPE_CONFIG[type];
        const isActive = activeType === type;
        return (
          <TouchableOpacity
            key={type}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onTypeChange(type)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={config.icon}
              size={14}
              color={isActive ? colors.onPrimary : colors.textMuted}
            />
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  rail: {
    flexDirection: 'row',
    height: 48,
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.overlay,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    borderRadius: theme.radius.xl,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
  },
  pillText: {
    fontFamily: theme.fontFamilies.sansBold,
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  pillTextActive: {
    color: theme.colors.onPrimary,
  },
});
