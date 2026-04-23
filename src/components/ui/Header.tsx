import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { IconButton } from './IconButton';
import { Box, HStack, VStack } from './Stack';
import { Text, cn } from './Text';

export type HeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
};

export const Header = React.memo(function Header({ 
  title, 
  subtitle, 
  showBack, 
  rightAction,
  className
}: HeaderProps) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <HStack className={cn('items-center justify-between px-6 pt-3 pb-4 bg-transparent', className)}>
      <HStack className="flex-1 items-center space-x-4">
        {showBack && (
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            size="md"
            variant="default"
          />
        )}
        <VStack className="flex-1 justify-center">
          <Text
            className="font-heading text-[28px] text-text tracking-tight leading-8"
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="font-regular text-[13px] text-text-muted mt-0.5 tracking-wide"
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </VStack>
      </HStack>

      {rightAction && (
        <HStack className="items-center space-x-2">
          {rightAction}
        </HStack>
      )}
    </HStack>
  );
});