import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, radius } from '../../theme/tokens';
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
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('3'),
      paddingHorizontal: spacing('4'),
      gap: spacing('3'),
    },
    firstItem: {
      borderTopLeftRadius: radius('lg'),
      borderTopRightRadius: radius('lg'),
    },
    lastItem: {
      borderBottomLeftRadius: radius('lg'),
      borderBottomRightRadius: radius('lg'),
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing('0.5'),
    },
    rightElement: {
      marginLeft: spacing('2'),
    },
  });

export default ListItem;
