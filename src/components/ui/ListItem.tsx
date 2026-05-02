import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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

  const containerStyle = [
    styles.container,
    {
      backgroundColor: colors.surface,
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
      {rightElement && (
        <View style={styles.rightElement}>
          {rightElement}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
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
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 12,
    },
    firstItem: {
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
    },
    lastItem: {
      borderBottomLeftRadius: theme.radius.lg,
      borderBottomRightRadius: theme.radius.lg,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 14,
    },
    subtitle: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    rightElement: {
      marginLeft: 8,
    },
  });

export default ListItem;
