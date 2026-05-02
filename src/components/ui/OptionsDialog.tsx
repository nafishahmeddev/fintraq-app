import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

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
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

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
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.optionsWrap}>
            {options.map((option) => {
              const selected = !!option.selected;
              const iconColor = selected
                ? colors.background
                : option.destructive
                  ? colors.danger
                  : colors.textMuted;

              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionRow,
                    selected && styles.optionRowActive,
                    option.destructive && !selected && styles.optionRowDestructive,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => handleOptionPress(option)}
                >
                  {option.icon ? (
                    <View style={[styles.optionIconWrap, selected && styles.optionIconWrapActive]}>
                      <Ionicons name={option.icon} size={16} color={iconColor} />
                    </View>
                  ) : null}

                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextActive,
                      option.destructive && !selected && styles.optionTextDestructive,
                    ]}
                  >
                    {option.label}
                  </Text>

                  {selected ? <Ionicons name="checkmark" size={16} color={colors.background} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.closeButtonText}>{closeLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.52)',
      justifyContent: 'flex-end',
      paddingHorizontal: theme.layout.screenPadding,
      paddingBottom: 42,
    },
    card: {
      alignSelf: 'stretch',
      borderRadius: theme.radius['2xl'],
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing[20],
      ...theme.shadow.lg,
    },
    title: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 24,
      color: theme.colors.text,
      letterSpacing: -0.6,
    },
    subtitle: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 14,
      color: theme.colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    optionsWrap: {
      overflow: 'hidden',
    },
    optionRow: {
      height: 52,
      borderRadius: theme.radius.lg,
      marginBottom: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionRowActive: {
      backgroundColor: theme.colors.text,
      borderColor: theme.colors.text,
    },
    optionRowDestructive: {
      borderColor: theme.colors.danger + '35',
      backgroundColor: theme.colors.danger + '10',
    },
    optionIconWrap: {
      width: 32,
      height: 32,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    optionIconWrapActive: {
      backgroundColor: theme.colors.background + '20',
      borderColor: 'transparent',
    },
    optionText: {
      flex: 1,
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 14,
      color: theme.colors.text,
    },
    optionTextActive: {
      color: theme.colors.background,
    },
    optionTextDestructive: {
      color: theme.colors.danger,
    },
    closeButton: {
      marginTop: 8,
      height: 48,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 14,
      color: theme.colors.text,
    },
  });
