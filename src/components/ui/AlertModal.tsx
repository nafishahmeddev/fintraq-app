import React, { useMemo, useCallback } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

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
  const theme = useTheme();
  const { colors } = theme;
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, width), [theme, width]);

  const icon = useMemo(() => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle' as const, color: colors.primary };
      case 'error': return { name: 'alert-circle' as const, color: colors.danger };
      case 'warning': return { name: 'warning' as const, color: colors.warning };
      default: return { name: 'information-circle' as const, color: colors.primary };
    }
  }, [type, colors.primary, colors.danger, colors.warning]);

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
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
              <Ionicons name={icon.name} size={28} color={icon.color} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel ? styles.cancelButton : styles.primaryButton,
                    isDestructive && { backgroundColor: colors.danger, borderColor: colors.danger },
                    buttons.length > 2 ? { width: '100%' } : { flex: 1 }
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text style={[
                    styles.buttonText,
                    isCancel ? { color: colors.text } : { color: colors.background }
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (theme: Theme, width: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.layout.screenPadding,
    },
    content: {
      width: Math.min(width - 48, 340),
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius['2xl'],
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing[24],
      alignItems: 'flex-start',
      ...theme.shadow.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[16],
      marginBottom: theme.spacing[20],
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      flex: 1,
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 22,
      color: theme.colors.text,
      letterSpacing: -1,
    },
    message: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 15,
      color: theme.colors.textMuted,
      lineHeight: 22,
      marginBottom: theme.spacing[32],
    },
    buttonContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[12],
      width: '100%',
    },
    button: {
      height: 52,
      borderRadius: theme.radius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    primaryButton: {
      backgroundColor: theme.colors.text,
      borderColor: theme.colors.text,
    },
    cancelButton: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    buttonText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 14,
      letterSpacing: -0.2,
    },
  });
