import React, { useCallback, useMemo } from 'react';
import { Modal, useWindowDimensions } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, VStack } from './Stack';
import { Pressable } from './Pressable';
import { Text, cn } from './Text';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
};

export const AlertModal = React.memo(function AlertModal({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
  type = 'info',
}: AlertModalProps) {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();

  const icon = useMemo(() => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle' as const, color: isDark ? '#B8D641' : '#a6c13a', bg: 'bg-primary/15' };
      case 'error': return { name: 'alert-circle' as const, color: isDark ? '#EF4444' : '#DC2626', bg: 'bg-danger/15' };
      case 'warning': return { name: 'warning' as const, color: '#FFB800', bg: 'bg-warning/15' };
      default: return { name: 'information-circle' as const, color: isDark ? '#B8D641' : '#a6c13a', bg: 'bg-primary/15' };
    }
  }, [type, isDark]);

  const handleButtonPress = useCallback((button: AlertButton) => {
    if (button.onPress) button.onPress();
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Box className="flex-1 bg-black/70 justify-center items-center p-6">
        <VStack
          className="bg-background rounded-3xl border border-border p-6 items-start"
          style={{ width: Math.min(width - 48, 340) }}
        >
          <HStack className="items-center space-x-4 mb-5">
            <Box className={cn("w-12 h-12 rounded-full justify-center items-center", icon.bg)}>
              <Ionicons name={icon.name} size={28} color={icon.color} />
            </Box>
            <Text className="flex-1 font-heading text-[22px] text-text tracking-tight">
              {title}
            </Text>
          </HStack>
          
          {message && (
            <Text className="font-regular text-[15px] text-text-muted leading-relaxed mb-8">
              {message}
            </Text>
          )}

          <Box className={cn(
            "flex-row flex-wrap gap-3 w-full",
          )}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              
              return (
                <Pressable
                  key={index}
                  className={cn(
                    "h-14 rounded-full justify-center items-center",
                    isCancel ? "bg-surface border border-border" : "bg-text",
                    isDestructive && "bg-danger",
                    buttons.length > 2 ? "w-full" : "flex-1"
                  )}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text className={cn(
                    "font-bold text-[13px] tracking-widest",
                    isCancel ? "text-text" : "text-background",
                    isDestructive && "text-white"
                  )}>
                    {button.text.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
        </VStack>
      </Box>
    </Modal>
  );
});