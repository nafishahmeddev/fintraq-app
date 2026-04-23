import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { IconBox } from './IconBox';
import { Box, HStack, VStack } from './Stack';
import { Pressable } from './Pressable';
import { Text, cn } from './Text';

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
  className?: string;
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
  className,
}: ListItemProps) {
  const { isDark } = useTheme();

  const containerClasses = cn(
    "flex-row items-center py-3 px-4 space-x-3 bg-surface",
    showDivider && !isLast && "border-b border-border",
    isFirst && "rounded-t-2xl",
    isLast && "rounded-b-2xl",
    className
  );

  const content = (
    <>
      {icon && (
        <IconBox
          icon={icon}
          size="md"
          shape="circle"
          backgroundColor={iconBackgroundColor}
          iconColor={iconColor}
        />
      )}
      <VStack className="flex-1 justify-center">
        <Text
          className={cn(
            "font-semibold text-sm",
            selected ? "text-primary" : "text-text"
          )}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="font-regular text-xs text-text-muted mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </VStack>
      {rightElement && (
        <Box className="ml-2">
          {rightElement}
        </Box>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        className={containerClasses}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <Box className={containerClasses}>{content}</Box>;
});

export default ListItem;