import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { IconBox } from './IconBox';

export interface ListItemProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackgroundColor?: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const ListItem = React.memo(function ListItem({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  rightElement,
  onPress,
  selected = false,
  isFirst = false,
  isLast = false,
  showDivider = true,
  style,
}: ListItemProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback(() => onPress?.(), [onPress]);

  const containerStyle = [
    styles.container,
    {
      backgroundColor: selected ? colors.primary + '15' : colors.surface,
      borderBottomColor: showDivider && !isLast ? colors.border : 'transparent',
      borderBottomWidth: showDivider && !isLast ? 1 : 0,
    },
    isFirst && styles.firstItem,
    isLast && styles.lastItem,
    style,
  ];

  const content = (
    <>
      {icon && (
        <IconBox
          icon={icon}
          size="md"
          shape="circle"
          backgroundColor={iconBackgroundColor || colors.surface}
          iconColor={iconColor || colors.text}
        />
      )}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: selected ? colors.primary : colors.text },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement ? (
        <View style={styles.rightElement}>
          {rightElement}
        </View>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: theme.layout.listItemHeight,
      paddingVertical: theme.spacing[12],
      paddingHorizontal: theme.spacing[16],
      gap: theme.spacing[12],
    },
    firstItem: {
      borderTopLeftRadius: theme.radius['3xl'],
      borderTopRightRadius: theme.radius['3xl'],
    },
    lastItem: {
      borderBottomLeftRadius: theme.radius['3xl'],
      borderBottomRightRadius: theme.radius['3xl'],
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: theme.fontSizes.sm,
    },
    subtitle: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    rightElement: {
      marginLeft: theme.spacing[4],
    },
  });

export default ListItem;
