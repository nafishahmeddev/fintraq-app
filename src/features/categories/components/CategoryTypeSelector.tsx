import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { CategoryType } from '../../../db/schema';

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
    <View style={styles.typeTabsRail}>
      {(Object.keys(TYPE_CONFIG) as CategoryType[]).map((type) => {
        const config = TYPE_CONFIG[type];
        const isActive = activeType === type;
        return (
          <TouchableOpacity
            key={type}
            style={[styles.segmentPill, isActive && styles.segmentPillActive]}
            onPress={() => onTypeChange(type)}
            activeOpacity={0.9}
          >
            <Ionicons
              name={config.icon}
              size={14}
              color={isActive ? colors.onPrimary : colors.textMuted}
            />
            <Text style={[styles.segmentPillText, isActive && styles.segmentPillTextActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  typeTabsRail: {
    flexDirection: 'row',
    height: 48,
    borderRadius: theme.radius['3xl'],
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: 4,
    gap: 4,
  },
  segmentPill: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    borderRadius: theme.radius.xl,
    backgroundColor: 'transparent',
  },
  segmentPillActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentPillText: {
    fontFamily: theme.fontFamilies.sansBold,
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  segmentPillTextActive: {
    color: theme.colors.onPrimary,
  },
});
