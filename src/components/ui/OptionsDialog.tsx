import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Box, HStack, VStack } from './Stack';
import { Pressable } from './Pressable';
import { Text, cn } from './Text';

type IconName = keyof typeof Ionicons.glyphMap;

export type OptionsDialogOption = {
  key: string;
  label: string;
  icon?: IconName;
  selected?: boolean;
  destructive?: boolean;
  closeOnPress?: boolean;
  onPress: () => void;
};

type OptionsDialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: OptionsDialogOption[];
  closeLabel?: string;
};

export const OptionsDialog = React.memo(function OptionsDialog({
  visible,
  onClose,
  title,
  subtitle,
  options,
  closeLabel = 'Close',
}: OptionsDialogProps) {
  const { isDark } = useTheme();

  const handleOptionPress = useCallback((option: OptionsDialogOption) => {
    if (option.closeOnPress !== false) {
      onClose();
    }
    option.onPress();
  }, [onClose]);

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
          <Text className="font-headingRegular text-2xl text-text tracking-tight">
            {title}
          </Text>
          {subtitle ? (
            <Text className="font-regular text-xs text-text-muted mt-1 mb-4">
              {subtitle}
            </Text>
          ) : <Box className="mb-4" />}

          <VStack className="rounded-full overflow-hidden">
            {options.map((option) => {
              const selected = !!option.selected;
              const iconColor = selected
                ? (isDark ? '#000100' : '#F6FFF9') // background
                : option.destructive
                  ? (isDark ? '#EF4444' : '#DC2626') // danger
                  : (isDark ? '#b2bb8b' : '#737a5f'); // textMuted

              return (
                <Pressable
                  key={option.key}
                  className={cn(
                    "h-12 rounded-full mb-2 bg-surface border px-3 flex-row items-center",
                    selected ? "bg-text border-text" : "border-border",
                    option.destructive && !selected && "border-danger/30 bg-danger/10"
                  )}
                  onPress={() => handleOptionPress(option)}
                >
                  {option.icon && (
                    <Box className={cn(
                      "w-[26px] h-[26px] rounded-full justify-center items-center mr-2.5",
                      selected ? "bg-background/40" : "bg-background"
                    )}>
                      <Ionicons name={option.icon} size={16} color={iconColor} />
                    </Box>
                  )}

                  <Text
                    className={cn(
                      "flex-1 font-semibold text-[13px] text-text",
                      selected && "text-background",
                      option.destructive && !selected && "text-danger"
                    )}
                  >
                    {option.label}
                  </Text>

                  {selected && <Ionicons name="checkmark" size={16} color={isDark ? '#000100' : '#F6FFF9'} />}
                </Pressable>
              );
            })}
          </VStack>

          <Pressable
            className="mt-2 h-11 rounded-full border border-primary/20 bg-surface justify-center items-center"
            onPress={onClose}
          >
            <Text className="font-semibold text-sm text-text">
              {closeLabel}
            </Text>
          </Pressable>
        </VStack>
      </Box>
    </Modal>
  );
});