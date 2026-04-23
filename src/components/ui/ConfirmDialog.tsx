import React, { useCallback } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Box, HStack, VStack } from './Stack';
import { Pressable } from './Pressable';
import { Text, cn } from './Text';

type ConfirmDialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
};

export const ConfirmDialog = React.memo(function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  isLoading = false,
}: ConfirmDialogProps) {

  const handleConfirm = useCallback(() => {
    onClose();
    onConfirm();
  }, [onClose, onConfirm]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Box className="flex-1 bg-black/50 justify-end px-6 pb-10">
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <VStack className="rounded-2xl bg-background border border-border p-5">
          <Text className="font-headingRegular text-2xl tracking-tight text-text">
            {title}
          </Text>
          {message ? (
            <Text className="mt-1.5 mb-4 font-regular text-sm text-text-muted leading-relaxed">
              {message}
            </Text>
          ) : <Box className="mb-4" />}

          <HStack className="space-x-2.5">
            <Pressable
              className="flex-1 h-12 rounded-full border border-primary/20 bg-surface items-center justify-center"
              onPress={onClose}
            >
              <Text className="font-semibold text-sm text-text">{cancelLabel}</Text>
            </Pressable>

            <Pressable
              className={cn(
                "flex-1 h-12 rounded-full items-center justify-center",
                destructive ? "bg-danger" : "bg-primary",
                isLoading && "opacity-70"
              )}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="font-semibold text-sm text-white">{confirmLabel}</Text>
              )}
            </Pressable>
          </HStack>
        </VStack>
      </Box>
    </Modal>
  );
});