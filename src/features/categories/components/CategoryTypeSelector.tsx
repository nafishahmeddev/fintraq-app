import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { CategoryType } from '../../../db/schema';

interface CategoryTypeSelectorProps {
  activeType: CategoryType;
  onTypeChange: (type: CategoryType) => void;
  colors: ThemeColors;
}

const TYPE_CONFIG: Record<CategoryType, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  DR: { label: 'Expenses', icon: 'arrow-down-circle-outline' },
  CR: { label: 'Income', icon: 'arrow-up-circle-outline' },
  TRANSFER: { label: 'Transfer', icon: 'swap-horizontal-outline' },
};

export const CategoryTypeSelector: React.FC<CategoryTypeSelectorProps> = ({
  activeType,
  onTypeChange,
  colors,
}) => {
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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
              color={isActive ? colors.background : colors.textMuted} 
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  typeTabsRail: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'D9',
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
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  segmentPillActive: {
    backgroundColor: colors.text,
  },
  segmentPillText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  segmentPillTextActive: {
    color: colors.background,
  },
});
